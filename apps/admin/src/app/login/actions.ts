"use server";

// İki adımlı admin girişi — Server Action'ları. docs/05 (Kimlik Doğrulama) + docs/13 §Y2.
//
// AKIŞ:
//   Adım 1 — startLogin: rate-limit → şifre doğrula → güvenilen cihaz varsa OTP ATLA
//     (ticket ile signIn) → yoksa OTP üret+gönder + bekleyen-giriş çerezi yaz, UI Adım 2'ye geçer.
//   Adım 2 — verifyLogin: bekleyen-giriş çerezini oku → OTP rate-limit → kodu doğrula →
//     başarılıysa (remember ise güvenilen cihaz çerezi yaz) ticket ile signIn → panele.
//   resendCode: rate-limit'li yeniden gönderim. cancelLogin: bekleyen-giriş çerezini temizle.
//
// GÜVENLİK:
//   - Şifre OTP'den ÖNCE doğrulanır; geçersizse GENEL hata (kullanıcı enumerasyonu YOK).
//   - OTP DB'de hash'li (sha256+AUTH_SECRET), 10dk, 5 deneme (packages/db/login-code).
//   - Bekleyen-giriş + güvenilen-cihaz + ticket: AUTH_SECRET ile HMAC imzalı (login-crypto).
//   - Çerezler httpOnly + secure(prod) + sameSite=lax.
//   - signIn'e ASLA şifre gitmez; yalnız sunucuda üretilmiş ticket (ticket güveni).

import { AuthError } from "next-auth";
import { cookies, headers } from "next/headers";
import {
  checkRateLimit,
  resetRateLimit,
  getClientIp,
  verifyAdminCredentials,
  issueLoginCode,
  verifyLoginCode,
  clearLoginCode,
} from "@do/db";
import { sendLoginCode } from "@do/email";
import { signIn } from "@/auth";
import {
  signPendingLogin,
  verifyPendingLogin,
  signTrustedDevice,
  verifyTrustedDevice,
  signLoginTicket,
  durationToMs,
  isSessionDuration,
  type SessionDuration,
  PENDING_COOKIE,
  TRUSTED_DEVICE_COOKIE,
} from "@/lib/login-crypto";
// ⚠️ Tip/başlangıç değeri ayrı dosyada — "use server" dosyası NESNE export edemez (Next.js).
import type { LoginState } from "./state";

// Rate-limit pencereleri (docs/13 §Y2 — Adım 1 şifre denemesi: 5/15dk).
const LOGIN_RATE_LIMIT = { limit: 5, windowMs: 15 * 60 * 1000 };
// OTP doğrulama denemesi: IP+email başına 10/15dk (kod başına 5 deneme zaten DB'de).
const OTP_RATE_LIMIT = { limit: 10, windowMs: 15 * 60 * 1000 };
// Kod yeniden gönderim: IP+email başına 3/15dk (e-posta spam'ini sınırla).
const RESEND_RATE_LIMIT = { limit: 3, windowMs: 15 * 60 * 1000 };

// Bekleyen-giriş çerezi ömrü (~10dk — OTP geçerlilik süresiyle hizalı).
const PENDING_TTL_MS = 10 * 60 * 1000;

const GENERIC_ERROR = "E-posta veya şifre hatalı.";
const RATE_LIMITED_ERROR = "Çok fazla deneme yapıldı. Lütfen bir süre sonra tekrar deneyin.";
const OTP_GENERIC_ERROR = "Kod hatalı veya süresi dolmuş. Lütfen tekrar deneyin.";
const SESSION_EXPIRED_ERROR = "Oturum süresi doldu. Lütfen baştan giriş yapın.";
// OTP üretilemedi/gönderilemedi (DB hatası veya e-posta yapılandırması yok/başarısız).
// Enumerasyon yok — kullanıcıya genel "tekrar dene" mesajı.
const OTP_SEND_FAILED_ERROR = "Doğrulama kodu gönderilemedi, lütfen daha sonra tekrar deneyin.";

const isProd = process.env.NODE_ENV === "production";

/** Ortak güvenli çerez seçenekleri (HMAC imzalı yük + httpOnly + secure + lax). */
function cookieOptions(maxAgeSeconds: number) {
  return {
    httpOnly: true,
    secure: isProd,
    sameSite: "lax" as const,
    path: "/",
    maxAge: maxAgeSeconds,
  };
}

/** E-postayı kabaca maskeler (ör. d***n@site.com) — Adım 2 ipucu için. */
function maskEmail(email: string): string {
  const [name, domain] = email.split("@");
  if (!domain || !name) return email;
  const head = name.slice(0, 1);
  const tail = name.length > 2 ? name.slice(-1) : "";
  return `${head}***${tail}@${domain}`;
}

/**
 * Sunucuda her şey doğrulandıktan SONRA oturumu açar: HMAC ticket üret → signIn("credentials").
 * Başarılı girişte signIn redirect (NEXT_REDIRECT) fırlatır → çağıran catch'te yeniden fırlatır.
 */
async function establishSession(
  email: string,
  remember: boolean,
  duration: SessionDuration,
): Promise<void> {
  const ticket = signLoginTicket({ email, remember, duration });
  await signIn("credentials", { ticket, redirectTo: "/teklifler" });
}

/**
 * OTP üretir (DB) ve e-postayla gönderir. Sadece kod gerçekten gönderildiyse `true` döner.
 * - `issueLoginCode` exception fırlatırsa (DB hatası) → yakalanır, `false`.
 * - `sendLoginCode` `ok:false` döndürürse (yapılandırma yok/`skipped` veya gönderim hatası)
 *   → `false`. Böylece çağıran "kod gönderildi" demeden net hata gösterebilir.
 * Düz kod hiçbir koşulda loglanmaz; başarısızlık nedeni kullanıcıya sızdırılmaz.
 */
async function issueAndSendCode(email: string): Promise<boolean> {
  try {
    const { code, expiresMinutes } = await issueLoginCode(email);
    const sent = await sendLoginCode({ to: email, code, expiresMinutes, locale: "tr" });
    return sent.ok === true;
  } catch {
    return false;
  }
}

// ───────────────────────────── Adım 1 — startLogin ─────────────────────────────

export async function startLogin(_prev: LoginState, formData: FormData): Promise<LoginState> {
  const rawEmail = String(formData.get("email") ?? "");
  const password = String(formData.get("password") ?? "");
  const remember = formData.get("remember") === "on" || formData.get("remember") === "true";
  const durationRaw = String(formData.get("duration") ?? "1m");
  const duration: SessionDuration = isSessionDuration(durationRaw) ? durationRaw : "1m";
  const email = rawEmail.trim().toLowerCase();

  const hdrs = await headers();
  const ip = getClientIp(hdrs);
  const rlKey = `login:${ip}:${email}`;

  // 1) Brute-force kilidi (kimlik kontrolünden ÖNCE). fail-safe: DB hatasında izin verir.
  const rl = await checkRateLimit({ key: rlKey, ...LOGIN_RATE_LIMIT });
  if (!rl.allowed) {
    return { step: "credentials", error: RATE_LIMITED_ERROR };
  }

  // 2) Şifre doğrula. Geçersiz → GENEL hata (enumerasyon yok).
  const user = await verifyAdminCredentials(email, password);
  if (!user) {
    return { step: "credentials", error: GENERIC_ERROR };
  }

  // Şifre doğru → bu denemeyi limit sayacından düş (meşru kullanıcı kilitlenmesin).
  await resetRateLimit(rlKey);

  const cookieStore = await cookies();

  // 3) Güvenilen cihaz çerezi bu kullanıcı için geçerli mi? Varsa OTP ATLA → oturumu aç.
  const trusted = cookieStore.get(TRUSTED_DEVICE_COOKIE)?.value;
  if (verifyTrustedDevice(trusted, email)) {
    try {
      await establishSession(email, remember, duration);
      return { step: "credentials" }; // ulaşılmaz (redirect fırlatılır)
    } catch (error) {
      if (error instanceof AuthError) {
        // Ticket beklenmedik şekilde reddedildi → OTP akışına düş (aşağı).
      } else {
        throw error; // NEXT_REDIRECT dahil → yeniden fırlat (başarılı giriş)
      }
    }
  }

  // 4) OTP üret + hash'le + DB'ye yaz + e-postayla gönder. Düz kod saklanmaz/loglanmaz.
  //    Üretim (DB) veya gönderim başarısızsa Adım 2'ye GEÇME — Adım 1'de genel hata göster
  //    (e-posta yapılandırması yok → { ok:false, skipped:true } da başarısız sayılır).
  if (!(await issueAndSendCode(email))) {
    return { step: "credentials", error: OTP_SEND_FAILED_ERROR };
  }

  // 5) Bekleyen-giriş bağlamını HMAC imzalı kısa ömürlü çereze yaz (Adım 2 okur).
  const pending = signPendingLogin({ email, remember, duration }, PENDING_TTL_MS);
  cookieStore.set(PENDING_COOKIE, pending, cookieOptions(Math.floor(PENDING_TTL_MS / 1000)));

  return {
    step: "otp",
    info: "Doğrulama kodu e-posta adresinize gönderildi.",
    maskedEmail: maskEmail(email),
  };
}

// ───────────────────────────── Adım 2 — verifyLogin ─────────────────────────────

export async function verifyLogin(_prev: LoginState, formData: FormData): Promise<LoginState> {
  const code = String(formData.get("code") ?? "").trim();

  const cookieStore = await cookies();
  const pending = verifyPendingLogin(cookieStore.get(PENDING_COOKIE)?.value);
  if (!pending) {
    // Bekleyen giriş yok/expired → baştan.
    cookieStore.delete(PENDING_COOKIE);
    return { step: "credentials", error: SESSION_EXPIRED_ERROR };
  }

  const { email, remember, duration } = pending;

  const hdrs = await headers();
  const ip = getClientIp(hdrs);

  // 1) OTP deneme rate-limit (kod-başına 5 deneme DB'de + bu IP/email pencere limiti).
  const otpKey = `login-otp:${ip}:${email}`;
  const rl = await checkRateLimit({ key: otpKey, ...OTP_RATE_LIMIT });
  if (!rl.allowed) {
    return {
      step: "otp",
      error: RATE_LIMITED_ERROR,
      maskedEmail: maskEmail(email),
    };
  }

  // 2) Kodu doğrula (hash + süre + deneme<5).
  const result = await verifyLoginCode(email, code);
  if (!result.ok) {
    if (result.reason === "expired" || result.reason === "locked") {
      // Kod yok/expired/iptal → bekleyen girişi de temizle, baştan.
      cookieStore.delete(PENDING_COOKIE);
      await clearLoginCode(email);
      return { step: "credentials", error: SESSION_EXPIRED_ERROR };
    }
    // mismatch → aynı adımda kal, genel hata.
    return { step: "otp", error: OTP_GENERIC_ERROR, maskedEmail: maskEmail(email) };
  }

  // 3) Başarılı → kullanılan kodu sil, bekleyen-giriş çerezini temizle.
  await clearLoginCode(email);
  cookieStore.delete(PENDING_COOKIE);

  // 4) "Beni hatırla" ise güvenilen-cihaz çerezi yaz (süre = seçilen oturum süresi).
  if (remember) {
    const ttlMs = durationToMs(duration);
    const trusted = signTrustedDevice(email, ttlMs);
    cookieStore.set(TRUSTED_DEVICE_COOKIE, trusted, cookieOptions(Math.floor(ttlMs / 1000)));
  }

  // 5) Oturumu aç (ticket → signIn). Başarılı girişte redirect fırlatılır.
  try {
    await establishSession(email, remember, duration);
    return { step: "otp" }; // ulaşılmaz
  } catch (error) {
    if (error instanceof AuthError) {
      return { step: "otp", error: OTP_GENERIC_ERROR, maskedEmail: maskEmail(email) };
    }
    throw error; // NEXT_REDIRECT → yeniden fırlat
  }
}

// ───────────────────────────── Kodu yeniden gönder ─────────────────────────────

export async function resendCode(_prev: LoginState, _formData: FormData): Promise<LoginState> {
  const cookieStore = await cookies();
  const pending = verifyPendingLogin(cookieStore.get(PENDING_COOKIE)?.value);
  if (!pending) {
    cookieStore.delete(PENDING_COOKIE);
    return { step: "credentials", error: SESSION_EXPIRED_ERROR };
  }
  const { email, remember, duration } = pending;

  const hdrs = await headers();
  const ip = getClientIp(hdrs);
  const rl = await checkRateLimit({ key: `login-resend:${ip}:${email}`, ...RESEND_RATE_LIMIT });
  if (!rl.allowed) {
    return {
      step: "otp",
      error: "Çok fazla kod istendi. Lütfen bir süre sonra tekrar deneyin.",
      maskedEmail: maskEmail(email),
    };
  }

  // Yeni kod üret + gönder; başarısızsa Adım 2'de kal, genel hata göster (çerezi tazeleme).
  if (!(await issueAndSendCode(email))) {
    return { step: "otp", error: OTP_SEND_FAILED_ERROR, maskedEmail: maskEmail(email) };
  }

  // Bekleyen-giriş çerezini de tazele (süreyi uzat).
  const refreshed = signPendingLogin({ email, remember, duration }, PENDING_TTL_MS);
  cookieStore.set(PENDING_COOKIE, refreshed, cookieOptions(Math.floor(PENDING_TTL_MS / 1000)));

  return {
    step: "otp",
    info: "Yeni doğrulama kodu gönderildi.",
    maskedEmail: maskEmail(email),
  };
}

// ───────────────────────────── Vazgeç ─────────────────────────────

export async function cancelLogin(): Promise<LoginState> {
  const cookieStore = await cookies();
  const pending = verifyPendingLogin(cookieStore.get(PENDING_COOKIE)?.value);
  if (pending) {
    await clearLoginCode(pending.email);
  }
  cookieStore.delete(PENDING_COOKIE);
  return { step: "credentials" };
}
