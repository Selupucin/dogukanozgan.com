// GA4 olay (event) izleme — istemci-güvenli helper (yalnız apps/web).
//
// KVKK (docs/06 §3): GA4 (gtag.js) YALNIZCA kullanıcı çerez banner'ında açık onay
// ("all") verince yüklenir (bkz. components/analytics.tsx). `window.gtag` ancak o
// zaman tanımlı olur → bu helper `window.gtag` kontrolü yaptığından, onay YOKKEN
// hiçbir olay gönderilmez (no-op). Ekstra rıza-kapısı gerekmez; rıza kapısı gtag'in
// kendisinin yüklenmesidir. Yalnız GA4'e (gtag) gider — GTM dataLayer'a AYRICA push
// EDİLMEZ (çift sayım olmasın; GA4 gtag ile gidiyor).

// gtag yalnız çerez onayından sonra yüklenir → onaysız no-op (KVKK).
declare global {
  interface Window {
    gtag?: (...args: unknown[]) => void;
  }
}

export function track(name: string, params: Record<string, unknown> = {}) {
  if (typeof window !== "undefined" && typeof window.gtag === "function") {
    window.gtag("event", name, params);
  }
}
