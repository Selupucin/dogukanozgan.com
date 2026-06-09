// Ürün TEKLİF (form) sayfası — /[locale]/planlar/[slug]/teklif
// (EN: /en/plans/[slug]/quote). docs/02/03 ayrımı: SADECE ürüne özel teklif formu
// (AutoForm, KVKK modal'lı rıza). Hesaplayıcı BURADA YOKTUR. Üstte tanım sayfasına
// geri link + ürün başlığı. Hesaplayıcıdan gelen değerler query ile ön-doldurulur.
// SEO: tekil title/meta + hreflang/canonical (docs/07).

import type { Metadata } from "next";
import { notFound } from "next/navigation";
import { getTranslations, setRequestLocale } from "next-intl/server";
import { getProductByLocalizedSlug, getLocalizedProductSlugs } from "@do/products";
import { Suspense } from "react";
import { ArrowLeft } from "lucide-react";
import { Link } from "@/i18n/navigation";
import { routing } from "@/i18n/routing";
import { localizedAlternates } from "@/lib/seo";
import { PrefilledAutoForm } from "@/components/auto-form";
import { ProductIcon } from "@/components/product-icon";

type Locale = (typeof routing.locales)[number];

// Tüm locale × YEREL slug kombinasyonları statik üretilir (TR teklif + EN quote).
export function generateStaticParams() {
  return routing.locales.flatMap((locale) =>
    getLocalizedProductSlugs(locale).map((slug) => ({ locale, slug })),
  );
}

export async function generateMetadata({
  params,
}: {
  params: Promise<{ locale: string; slug: string }>;
}): Promise<Metadata> {
  const { locale, slug } = await params;
  const loc = locale as Locale;
  const product = getProductByLocalizedSlug(loc, slug);
  if (!product) return {};
  const t = await getTranslations({ locale, namespace: "quotePage" });

  // ÇİFT MARKALAMA YOK (docs/07): kök layout title.template "%s — Doğukan Özgan"
  // markayı ekler. Title yalnız "Ürün + Teklifi" olur → "Trafik Sigortası Teklifi —
  // Doğukan Özgan" (marka tek kez). OG şablon uygulamadığından markayı elle ekleriz.
  const title = t("titleSuffix", { product: product.name[loc] });
  const ogTitle = `${title} — Doğukan Özgan`;
  return {
    title,
    description: t("metaDescription", { product: product.name[loc] }),
    // hreflang/canonical: teklif sayfası (her locale KENDİ yerel slug'ı) — docs/07.
    alternates: localizedAlternates(loc, "/planlar/[slug]/teklif", {
      tr: { slug: product.slugs.tr },
      en: { slug: product.slugs.en },
    }),
    openGraph: { title: ogTitle, type: "website" },
  };
}

export default async function QuotePage({
  params,
}: {
  params: Promise<{ locale: string; slug: string }>;
}) {
  const { locale, slug } = await params;
  setRequestLocale(locale);
  const loc = locale as Locale;
  const product = getProductByLocalizedSlug(loc, slug);
  if (!product) notFound();

  const t = await getTranslations("quotePage");
  const tp = await getTranslations("plans");

  // Hesaplayıcıdan gelen ön-doldurma değerleri URL query'sinden CLIENT'ta okunur
  // (PrefilledAutoForm). Böylece sayfa SUNUCUDA STATİK (SSG) kalır.
  return (
    <main className="mx-auto max-w-3xl px-4 py-12 sm:px-6 sm:py-16">
      {/* Tanım sayfasına geri link */}
      <Link
        href={{ pathname: "/planlar/[slug]", params: { slug } }}
        className="inline-flex items-center gap-2 text-sm font-semibold text-muted-foreground transition hover:text-foreground"
      >
        <ArrowLeft className="h-4 w-4" aria-hidden />
        {t("back", { product: product.name[loc] })}
      </Link>

      <header className="mt-6 flex items-start gap-4">
        <span className="flex h-12 w-12 shrink-0 items-center justify-center rounded-2xl bg-accent text-accent-foreground">
          <ProductIcon name={product.icon} className="h-6 w-6" />
        </span>
        <div>
          <span className="text-xs font-extrabold uppercase tracking-[0.1em] text-primary">
            {t("eyebrow")}
          </span>
          <h1 className="mt-1 font-heading text-[clamp(1.8rem,3.6vw,2.6rem)] font-semibold leading-tight tracking-tight text-foreground">
            {product.name[loc]}
          </h1>
        </div>
      </header>

      <p className="mt-4 text-sm text-muted-foreground">{tp("formIntro")}</p>

      <div className="mt-8">
        {/* useSearchParams kullanan istemci bileşeni → Suspense ile statik prerender. */}
        <Suspense fallback={null}>
          <PrefilledAutoForm product={product} locale={loc} />
        </Suspense>
      </div>
    </main>
  );
}
