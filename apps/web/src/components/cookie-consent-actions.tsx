"use client";

// Çerez banner'ı — yalnızca BUTONLAR (istemci adası). Kaynak: docs/06 §3, docs/07.
//
// Banner'ın kendisi SUNUCUDA render edilir (cookie-consent.tsx) ve ilk HTML'de gelir
// → geç-mount/LCP gecikmesi olmaz. Bu küçük ada yalnız etkileşimi taşır:
//   - Seçim çereze yazılır (writeConsent) → sonraki sayfa yüklemelerinde paint-öncesi
//     inline script banner'ı gizler; analitik bileşeni de CONSENT_EVENT ile anında
//     tetiklenir (yalnız "all" onayında yüklenir).
//   - Banner kabı `hidden` yapılarak gizlenir (inline paint-öncesi script ile aynı
//     mekanizma); React'in yönettiği DOM ağacı korunur, layout shift olmaz.

import { useTranslations } from "next-intl";
import { writeConsent, type ConsentValue } from "@/lib/consent";

/** Banner kabını (en yakın [data-cookie-banner]) görünürde kapatır. */
function dismissBanner(target: HTMLElement) {
  const banner = target.closest<HTMLElement>("[data-cookie-banner]");
  if (banner) banner.hidden = true;
}

export function CookieConsentActions() {
  const t = useTranslations("cookie");

  function choose(value: ConsentValue, e: React.MouseEvent<HTMLButtonElement>) {
    writeConsent(value);
    dismissBanner(e.currentTarget);
  }

  return (
    <div className="mt-3 flex flex-col gap-2 sm:flex-row sm:justify-end">
      <button
        type="button"
        onClick={(e) => choose("essential", e)}
        className="rounded-pill border border-input px-4 py-2 text-sm font-medium transition hover:bg-muted"
      >
        {t("reject")}
      </button>
      <button
        type="button"
        onClick={(e) => choose("all", e)}
        className="rounded-pill bg-primary px-4 py-2 text-sm font-medium text-primary-foreground transition hover:-translate-y-0.5"
      >
        {t("accept")}
      </button>
    </div>
  );
}
