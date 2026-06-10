// Çerez onayı — paylaşılan sabitler ve yardımcılar (KVKK, docs/06 §3).
//
// Tek doğru kaynak: hem çerez banner'ı (cookie-consent.tsx) hem analitik yükleyici
// (analytics.tsx) aynı anahtarı ve değerleri buradan okur.
//
// Davranış: Zorunlu OLMAYAN çerezler (analitik) YALNIZCA kullanıcı "all" (tümünü
// kabul) seçtiğinde çalışır. "essential" veya tercih yokken HİÇBİR analitik
// yüklenmez (docs/06 §3 — "onaydan önce çalışmaz").
//
// SAKLAMA: Tercih bir ÇEREZE yazılır (localStorage yerine). Böylece SUNUCU isteği
// işlerken `cookies()` ile okuyabilir ve çerez banner'ını sunucuda (layout) koşullu
// render edebilir → banner ilk HTML'de gelir, geç-mount/LCP gecikmesi olmaz
// (PageSpeed: çerez banner'ı LCP'yi geciktiriyordu). KVKK akışı aynen korunur:
// onay yine açıkça alınır ve saklanır (çerez de geçerli bir saklama mekanizmasıdır).

export const CONSENT_STORAGE_KEY = "do-cookie-consent";

/** Onay tercihi çerezinin yaşam süresi (gün). Bir yıl sonra yeniden sorulur. */
export const CONSENT_MAX_AGE_DAYS = 365;

/** Onay seçenekleri: tümü (analitik dahil) | yalnızca zorunlu. */
export type ConsentValue = "all" | "essential";

/** Tercih değiştiğinde aynı sekmedeki dinleyicilere haber veren olay adı. */
export const CONSENT_EVENT = "do-consent-change";

/** Ham bir string'i geçerli bir ConsentValue'ya çözer (yoksa null). */
export function parseConsent(raw: string | null | undefined): ConsentValue | null {
  return raw === "all" || raw === "essential" ? raw : null;
}

/** İstemcide document.cookie'den mevcut tercihi okur (yoksa null). SSR güvenli. */
export function readConsent(): ConsentValue | null {
  if (typeof document === "undefined") return null;
  try {
    const match = document.cookie
      .split("; ")
      .find((row) => row.startsWith(`${CONSENT_STORAGE_KEY}=`));
    const raw = match?.slice(CONSENT_STORAGE_KEY.length + 1);
    return parseConsent(raw ? decodeURIComponent(raw) : null);
  } catch {
    return null;
  }
}

/** Tercihi çereze yazar ve aynı sekmeye olay yayar (banner → analitik anında tetiklenir). */
export function writeConsent(value: ConsentValue): void {
  if (typeof document === "undefined") return;
  try {
    const maxAge = CONSENT_MAX_AGE_DAYS * 24 * 60 * 60;
    // SameSite=Lax + path=/ : zorunlu (kişisel veri içermeyen) tercih çerezi.
    document.cookie = `${CONSENT_STORAGE_KEY}=${value}; Max-Age=${maxAge}; Path=/; SameSite=Lax`;
  } catch {
    /* yoksay */
  }
  window.dispatchEvent(new CustomEvent(CONSENT_EVENT, { detail: value }));
}

/** Analitik yüklenebilir mi? Yalnızca açık "all" onayında true. */
export function analyticsAllowed(value: ConsentValue | null): boolean {
  return value === "all";
}
