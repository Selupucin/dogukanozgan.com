// Teklif durum sorgulama — /[locale]/teklif-durumu (EN: /quote-status). K30 / docs/12 §3.
// Kullanıcı takip kodunu girer; YALNIZ ürün + durum + tarih gösterilir (KVKK, docs/12 §6).
// SEO: tekil title/meta + hreflang/canonical. Hassas içerik olmadığından indekslenebilir.

import type { Metadata } from "next";
import { getTranslations, setRequestLocale } from "next-intl/server";
import { Search } from "lucide-react";
import { routing, type Locale } from "@/i18n/routing";
import { localizedAlternates } from "@/lib/seo";
import { StatusLookup } from "@/components/status-lookup";

export function generateStaticParams() {
  return routing.locales.map((locale) => ({ locale }));
}

export async function generateMetadata({
  params,
  searchParams,
}: {
  params: Promise<{ locale: string }>;
  searchParams: Promise<{ code?: string }>;
}): Promise<Metadata> {
  const { locale } = await params;
  const { code } = await searchParams;
  const t = await getTranslations({ locale, namespace: "quoteStatus" });

  // Takip-kodu varyantları (?code=…) İNDEKSLENMESİN (docs/07): her kod ayrı URL üretir,
  // arama sonucunda mükerrer/ince içerik oluşturur. Parametreli sayfa noindex/follow;
  // canonical/alternates HER ZAMAN parametresiz yola işaret eder (aşağıda), böylece
  // parametresiz sayfa index'te kalır.
  return {
    title: t("metaTitle"),
    description: t("metaDescription"),
    alternates: localizedAlternates(locale as Locale, "/teklif-durumu"),
    ...(code ? { robots: { index: false, follow: true } } : {}),
  };
}

export default async function QuoteStatusPage({
  params,
  searchParams,
}: {
  params: Promise<{ locale: string }>;
  searchParams: Promise<{ code?: string }>;
}) {
  const { locale } = await params;
  setRequestLocale(locale);
  const { code } = await searchParams;
  const t = await getTranslations("quoteStatus");

  return (
    <main className="mx-auto max-w-2xl px-4 py-16 sm:px-6">
      <header className="text-center">
        <span className="inline-flex items-center gap-2 rounded-pill bg-accent px-3 py-1 text-xs font-extrabold uppercase tracking-[0.1em] text-secondary">
          <Search className="h-3.5 w-3.5" aria-hidden />
          {t("eyebrow")}
        </span>
        <h1 className="mt-4 font-heading text-[clamp(2rem,4.5vw,3rem)] font-semibold tracking-tight text-foreground">
          {t("heading")}
        </h1>
        <p className="mx-auto mt-4 max-w-xl text-lg text-muted-foreground">{t("intro")}</p>
      </header>

      <div className="mt-10">
        <StatusLookup initialCode={code ?? ""} />
      </div>
    </main>
  );
}
