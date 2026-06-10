// Çerez onay banner'ı (KVKK). Kaynak: docs/06 §3, docs/02 "Global Bileşenler", docs/07.
//
// PERFORMANS / LCP DÜZELTMESİ:
// Eskiden banner bir client bileşeniydi; hidrasyon + localStorage okumasından SONRA
// mount oluyordu → geç boyanıyor ve LCP'yi ~860ms geciktiriyordu (PageSpeed). Artık:
//   - Banner markup'ı SUNUCUDA, statik HTML içinde GELİR (hidrasyon beklenmez) →
//     ilk boyamada hazır, "öğe oluşturma gecikmesi" ~0. Sayfalar STATİK kalır
//     (cookies()/headers() KULLANILMAZ → SSG/CDN cache korunur, ki bu da LCP'yi
//     hızlandırır).
//   - Tercih bir ÇEREZE saklanır. Daha önce onay vermiş kullanıcıda banner'ı boyamadan
//     ÖNCE gizlemek için, banner'dan hemen önce küçük bir SENKRON inline script çereze
//     bakar; tercih varsa kabı `hidden` yapar (paint-öncesi → yanıp sönme/CLS yok).
//
// CLS: Banner `position: fixed` + alt köşede → belge akışını itmez; gösterilmesi/
// gizlenmesi layout shift YARATMAZ (CLS 0 korunur).
//
// DAVRANIŞ (değişmedi): "Tümünü kabul et" / "Yalnızca zorunlu" tercihi kaydeder;
// zorunlu OLMAYAN çerezler (analitik) yalnız "all" onayında çalışır (lib/consent.ts,
// components/analytics.tsx). Butonlar küçük bir istemci adasında (cookie-consent-actions).

import { getTranslations } from "next-intl/server";
import { Link } from "@/i18n/navigation";
import { CONSENT_STORAGE_KEY } from "@/lib/consent";
import { CookieConsentActions } from "./cookie-consent-actions";

// Paint-öncesi inline script: çerezde "all"/"essential" varsa banner kabını gizle.
// Statik string olduğundan SSG'yi bozmaz; senkron çalışır → boyamadan önce karar verilir.
const HIDE_IF_CONSENTED = `(function(){try{var m=document.cookie.match(/(?:^|; )${CONSENT_STORAGE_KEY}=([^;]+)/);var v=m&&decodeURIComponent(m[1]);if(v==='all'||v==='essential'){var b=document.getElementById('cookie-consent-banner');if(b)b.hidden=true;}}catch(e){}})();`;

export async function CookieConsent() {
  const t = await getTranslations("cookie");

  return (
    <>
      <div
        id="cookie-consent-banner"
        data-cookie-banner
        role="dialog"
        aria-live="polite"
        aria-label={t("policyLink")}
        className="fixed inset-x-3 bottom-3 z-50 mx-auto max-w-3xl rounded-[var(--radius)] border border-border bg-card p-4 shadow-lg sm:p-5"
      >
        <p className="text-sm text-muted-foreground">
          {t("message")}{" "}
          <Link href="/cerez-politikasi" className="font-medium text-secondary underline">
            {t("policyLink")}
          </Link>
        </p>
        <CookieConsentActions />
      </div>
      <script dangerouslySetInnerHTML={{ __html: HIDE_IF_CONSENTED }} />
    </>
  );
}
