"use server";

// Giriş Server Action'ı — Auth.js Credentials ile oturum açar.
// Kaynak: docs/05 "Giriş", "Hatalı denemede genel hata mesajı (kullanıcı sızdırmaz)".
//
// GÜVENLİK (docs/13 §Y2): Kimlik kontrolünden ÖNCE dağıtık (DB tabanlı) brute-force
// kilidi. IP+e-posta anahtarıyla 15 dk'da en fazla 5 deneme. Aşılırsa giriş denemesi
// HİÇ yapılmaz, genel mesaj döner (kullanıcı enumerasyonu YAPILMAZ — e-posta var/yok
// ifşa edilmez; başarısız kimlik için tek/genel mesaj korunur).

import { AuthError } from "next-auth";
import { headers } from "next/headers";
import { checkRateLimit, resetRateLimit, getClientIp } from "@do/db";
import { signIn } from "@/auth";

export interface LoginState {
  error?: string;
}

// Login kilidi: IP+e-posta başına 15 dk'da 5 başarısız/deneme. docs/13 §Y2.
const LOGIN_RATE_LIMIT = { limit: 5, windowMs: 15 * 60 * 1000 };

// Genel mesaj (kullanıcı/şifre ayrımı yok — enumerasyon önleme, docs/05).
const GENERIC_ERROR = "E-posta veya şifre hatalı.";
// Limit aşımı mesajı (yine kimlik ifşa etmez).
const RATE_LIMITED_ERROR = "Çok fazla deneme yapıldı. Lütfen bir süre sonra tekrar deneyin.";

export async function loginAction(_prev: LoginState, formData: FormData): Promise<LoginState> {
  const email = String(formData.get("email") ?? "");
  const password = String(formData.get("password") ?? "");

  const hdrs = await headers();
  const ip = getClientIp(hdrs);
  // Anahtar IP + normalize e-posta: tek e-postaya dağıtık brute-force'u da yavaşlatır.
  const rlKey = `login:${ip}:${email.trim().toLowerCase()}`;

  // 1) Kimlik kontrolünden ÖNCE brute-force kilidi.
  //    fail-safe: DB hatasında checkRateLimit `allowed:true` döner → meşru admin
  //    kilitlenmez (erişilebilirlik); bu nadir durum loglanır (limiter içinde).
  const rl = await checkRateLimit({ key: rlKey, ...LOGIN_RATE_LIMIT });
  if (!rl.allowed) {
    // Giriş DENEMESİ YAPILMAZ; genel limit mesajı (kimlik ifşası yok).
    return { error: RATE_LIMITED_ERROR };
  }

  try {
    await signIn("credentials", {
      email,
      password,
      redirectTo: "/teklifler",
    });
    // Not: signIn başarılı girişte redirect fırlatır (aşağıdaki catch'e düşer ve
    // yeniden fırlatılır); bu noktaya normalde ulaşılmaz. Yine de güvenli sayaç sıfırlama.
    await resetRateLimit(rlKey);
    return {};
  } catch (error) {
    // NextAuth, başarılı girişte redirect (NEXT_REDIRECT) atar; bunu yeniden fırlat.
    if (error instanceof AuthError) {
      // Kimlik hatası → genel mesaj. Sayaç ARTMIŞ durumda (yukarıdaki check ile),
      // başarısız denemeler kademeli olarak limite yaklaşır.
      return { error: GENERIC_ERROR };
    }
    // redirect dahil diğer her şey (başarılı giriş) → sayacı sıfırla, sonra yeniden fırlat.
    await resetRateLimit(rlKey);
    throw error;
  }
}
