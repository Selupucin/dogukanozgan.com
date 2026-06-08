// SEO yardımcıları — yerelleştirilmiş canonical + hreflang üretimi.
// Kaynak: docs/07 SEO kontrol listesi ("hreflang (tr/en) + canonical").
//
// next-intl `pathnames` ile her sayfanın YEREL yolu locale'e göre farklıdır
// (örn. tr: /tr/planlar/trafik, en: /en/plans/traffic). Bu helper, bir KANONİK
// pathname anahtarı (+ opsiyonel param) için doğru canonical ve languages
// (hreflang) bloğunu üretir. Param değeri (ör. ürün slug'ı) HER locale için
// ayrı verilebilir (slug da çevrildiğinden).

import type { Metadata } from "next";
import { getPathname } from "@/i18n/navigation";
import { routing, type Locale, type AppPathname, type StaticPathname } from "@/i18n/routing";

type ParamsByLocale = Partial<Record<Locale, Record<string, string>>>;

/**
 * JSON-LD'yi `<script type="application/ld+json">` içine GÜVENLE basmak için
 * serialize eder (docs/13 §O3). `dangerouslySetInnerHTML` ile basılan JSON
 * çıktısında `</script>` veya `<!--` gibi diziler script bağlamını kapatıp
 * XSS'e yol açabilir. `<` karakterini `<` olarak kaçışlamak bunu engeller
 * (JSON sözdizimini bozmaz; tarayıcı yine geçerli JSON görür). Veri sabit/güvenilir
 * olsa bile defansif olarak TÜM JSON-LD basımları bundan geçirilir.
 */
export function jsonLdHtml(obj: unknown): string {
  return JSON.stringify(obj).replace(/</g, "\\u003c");
}

/**
 * Bir kanonik pathname için canonical (aktif locale) + hreflang (tüm locale +
 * x-default) alternates bloğu üretir.
 *
 * @param activeLocale Aktif sayfa locale'i (canonical bunun yerel yoluna işaret eder).
 * @param pathname     Kanonik (iç) pathname anahtarı, ör. "/planlar/[slug]".
 * @param paramsByLocale Dinamik rotalar için locale -> params (ör. slug çevirisi).
 */
export function localizedAlternates(
  activeLocale: Locale,
  pathname: AppPathname,
  paramsByLocale?: ParamsByLocale,
): NonNullable<Metadata["alternates"]> {
  const hrefFor = (locale: Locale): string => {
    // getPathname yerel (locale-prefixli) yolu döndürür: örn. "/en/plans/traffic".
    // Dinamik ürün rotaları ([slug] = tanım, [slug]/teklif = teklif) için
    // {pathname, params}; diğerleri STATİK yol. docs/02/03.
    if (pathname === "/planlar/[slug]" || pathname === "/planlar/[slug]/teklif") {
      const slug = paramsByLocale?.[locale]?.slug ?? "";
      return getPathname({ locale, href: { pathname, params: { slug } } });
    }
    return getPathname({ locale, href: pathname as StaticPathname });
  };

  const languages: Record<string, string> = {};
  for (const locale of routing.locales) {
    languages[locale] = hrefFor(locale);
  }
  languages["x-default"] = hrefFor(routing.defaultLocale);

  return {
    canonical: hrefFor(activeLocale),
    languages,
  };
}
