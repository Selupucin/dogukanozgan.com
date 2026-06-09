// Ürün TANIM/REKLAM sayfası — /[locale]/planlar/[slug] (docs/02, docs/03).
// Sigortanın TANIMI + reklamı: ne işe yarar, kapsam/teminat, avantajlar, neden Doğukan,
// kısa ürün SSS + (varsa) HESAPLAYICI. Teklif FORMU BURADA YOKTUR — belirgin "Teklif Al"
// CTA ziyaretçiyi /planlar/[slug]/teklif sayfasına götürür (docs/02/03 ayrımı).
// İçerik definitions.ts (isim/açıklama/hesaplayıcı) + lib/product-content (tanıtım metni,
// kapsam, avantaj, ürün SSS — YER TUTUCU) tek kaynaktan üretilir.
// SEO: tekil title/meta + hreflang/canonical + Service & FAQPage JSON-LD (docs/07).

import type { Metadata } from "next";
import { notFound } from "next/navigation";
import { getTranslations, setRequestLocale } from "next-intl/server";
import { getProductByLocalizedSlug, getLocalizedProductSlugs } from "@do/products";
import {
  ArrowRight,
  CheckCircle2,
  ShieldCheck,
  Scale,
  HeartHandshake,
  Calculator,
  Sparkles,
} from "lucide-react";
import { Link } from "@/i18n/navigation";
import { routing } from "@/i18n/routing";
import { localizedAlternates, jsonLdHtml } from "@/lib/seo";
import { siteUrl } from "@/lib/site";
import { getProductContent } from "@/lib/product-content";
import { ProductIcon } from "@/components/product-icon";
import { CalculatorSection } from "@/components/calculators/calculator-section";
import { FaqAccordion } from "@/components/faq-accordion";

type Locale = (typeof routing.locales)[number];

// Tüm locale × YEREL slug kombinasyonları statik üretilir (SSG → SEO).
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

  // ÇİFT MARKALAMA YOK (docs/07): kök layout title.template zaten "%s — Doğukan Özgan"
  // markasını ekler. Title olarak SADECE ürün adı verilir → "Trafik Sigortası — Doğukan
  // Özgan" (marka tek kez). OG/Twitter şablon uygulamadığından markayı elle ekleriz.
  const title = product.name[loc];
  const ogTitle = `${title} — Doğukan Özgan`;
  // hreflang/canonical: tanım sayfası (her locale KENDİ yerel slug'ı) — docs/07.
  return {
    title,
    description: product.description[loc],
    alternates: localizedAlternates(loc, "/planlar/[slug]", {
      tr: { slug: product.slugs.tr },
      en: { slug: product.slugs.en },
    }),
    openGraph: { title: ogTitle, description: product.description[loc], type: "website" },
  };
}

export default async function ProductPage({
  params,
}: {
  params: Promise<{ locale: string; slug: string }>;
}) {
  const { locale, slug } = await params;
  setRequestLocale(locale);
  const loc = locale as Locale;
  const product = getProductByLocalizedSlug(loc, slug);
  if (!product) notFound();

  const t = await getTranslations("productPage");
  const tp = await getTranslations("plans");
  // Tanıtım içeriği (kapsam/avantaj/ürün SSS) — YER TUTUCU (lib/product-content).
  const content = getProductContent(product.slug);

  // url: bu locale'in YEREL yolu (tr:/tr/planlar/<slug> ↔ en:/en/plans/<slug>).
  const localizedPath = `${loc}/${loc === "tr" ? "planlar" : "plans"}/${slug}`;

  // JSON-LD: Service + (içerik SSS varsa) FAQPage — docs/07 "ürüne özel FAQ JSON-LD".
  const serviceLd = {
    "@context": "https://schema.org",
    "@type": "Service",
    name: product.name[loc],
    description: product.description[loc],
    serviceType: product.name[loc],
    url: `${siteUrl}/${localizedPath}`,
    provider: { "@type": "InsuranceAgency", name: "Doğukan Özgan" },
  };
  const faqLd =
    content && content.faq.length > 0
      ? {
          "@context": "https://schema.org",
          "@type": "FAQPage",
          mainEntity: content.faq.map((f) => ({
            "@type": "Question",
            name: f.q[loc],
            acceptedAnswer: { "@type": "Answer", text: f.a[loc] },
          })),
        }
      : null;

  const why = [
    { icon: Scale, title: tp("why1Title"), body: tp("why1Body") },
    { icon: ShieldCheck, title: tp("why2Title"), body: tp("why2Body") },
    { icon: HeartHandshake, title: tp("why3Title"), body: tp("why3Body") },
  ];

  // docs/02/03 düzen: hesaplayıcısı OLAN ürünlerde hesaplayıcı EN ÜSTTE (hero hemen
  // sonrası); açıklamalar/teminat/avantaj/SSS aşağıda. Hesaplayıcısız ürünlerde
  // mevcut düzen (lead → kapsam → avantaj …) korunur. "Teklif Al" CTA hero'da hep var.

  // ── Şık TANITIM PARAGRAFI bloğu (docs/09: lead paragraf + yumuşak kart + ikon) ──
  const leadBlock =
    content && content.lead ? (
      <section className="py-14 sm:py-16">
        <div className="mx-auto max-w-4xl px-4 sm:px-6">
          <div className="relative overflow-hidden rounded-[var(--radius)] border border-border bg-card p-7 shadow-sm sm:p-10">
            <span
              aria-hidden
              className="pointer-events-none absolute -right-16 -top-16 h-56 w-56 rounded-full bg-[radial-gradient(circle,hsl(177_60%_27%/0.12),transparent_70%)]"
            />
            <span className="relative flex h-11 w-11 items-center justify-center rounded-xl bg-secondary/15 text-secondary">
              <Sparkles className="h-5 w-5" aria-hidden />
            </span>
            <span className="relative mt-5 block text-xs font-extrabold uppercase tracking-[0.1em] text-primary">
              {t("leadEyebrow")}
            </span>
            <p className="relative mt-3 font-heading text-[clamp(1.15rem,2.2vw,1.5rem)] font-medium leading-relaxed text-foreground">
              {content.lead[loc]}
            </p>
          </div>
        </div>
      </section>
    ) : null;

  // ── Hesaplayıcı bloğu ──
  const calculatorBlock =
    product.hasCalculator && product.calculator ? (
      <section id="hesaplayici" className="scroll-mt-24 py-14 sm:py-16">
        <div className="mx-auto max-w-4xl px-4 sm:px-6">
          <span className="text-xs font-extrabold uppercase tracking-[0.1em] text-primary">
            {t("calculatorEyebrow")}
          </span>
          <h2 className="mt-3 font-heading text-[clamp(1.7rem,3vw,2.3rem)] font-semibold text-foreground">
            {t("calculatorTitle")}
          </h2>
          <div className="mt-6">
            <CalculatorSection kind={product.calculator} locale={loc} slug={slug} />
          </div>
        </div>
      </section>
    ) : null;

  // ── Kapsam ──
  const coverageBlock =
    content && content.coverage.length > 0 ? (
      <section className="py-16 sm:py-20">
        <div className="mx-auto max-w-6xl px-4 sm:px-6">
          <span className="text-xs font-extrabold uppercase tracking-[0.1em] text-primary">
            {t("coverageEyebrow")}
          </span>
          <h2 className="mt-3 font-heading text-[clamp(1.7rem,3vw,2.3rem)] font-semibold text-foreground">
            {t("coverageTitle")}
          </h2>
          <ul className="mt-8 grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3">
            {content.coverage.map((c) => (
              <li
                key={c[loc]}
                className="flex items-start gap-3 rounded-[var(--radius)] border border-border bg-card p-5"
              >
                <CheckCircle2 className="mt-0.5 h-5 w-5 shrink-0 text-secondary" aria-hidden />
                <span className="text-sm text-foreground">{c[loc]}</span>
              </li>
            ))}
          </ul>
        </div>
      </section>
    ) : null;

  // ── Avantajlar ──
  const advantagesBlock =
    content && content.advantages.length > 0 ? (
      <section className="bg-muted/60 py-16 sm:py-20">
        <div className="mx-auto max-w-6xl px-4 sm:px-6">
          <span className="text-xs font-extrabold uppercase tracking-[0.1em] text-primary">
            {t("advantagesEyebrow")}
          </span>
          <h2 className="mt-3 font-heading text-[clamp(1.7rem,3vw,2.3rem)] font-semibold text-foreground">
            {t("advantagesTitle")}
          </h2>
          <ul className="mt-8 grid grid-cols-1 gap-5 sm:grid-cols-2">
            {content.advantages.map((a) => (
              <li
                key={a.title[loc]}
                className="rounded-[var(--radius)] border border-border bg-card p-6"
              >
                <h3 className="font-heading text-lg text-foreground">{a.title[loc]}</h3>
                <p className="mt-2 text-sm text-muted-foreground">{a.body[loc]}</p>
              </li>
            ))}
          </ul>
        </div>
      </section>
    ) : null;

  // ── Neden Doğukan ile ──
  const whyBlock = (
    <section className="bg-muted/60 py-16 sm:py-20">
      <div className="mx-auto max-w-6xl px-4 sm:px-6">
        <span className="text-xs font-extrabold uppercase tracking-[0.1em] text-primary">
          {t("whyEyebrow")}
        </span>
        <h2 className="mt-3 font-heading text-[clamp(1.7rem,3vw,2.3rem)] font-semibold text-foreground">
          {t("whyTitle")}
        </h2>
        <ul className="mt-8 grid grid-cols-1 gap-5 sm:grid-cols-3">
          {why.map((w) => (
            <li key={w.title} className="rounded-[var(--radius)] border border-border bg-card p-6">
              <span className="flex h-11 w-11 items-center justify-center rounded-xl bg-accent text-accent-foreground">
                <w.icon className="h-5 w-5" aria-hidden />
              </span>
              <h3 className="mt-4 font-heading text-lg text-foreground">{w.title}</h3>
              <p className="mt-2 text-sm text-muted-foreground">{w.body}</p>
            </li>
          ))}
        </ul>
      </div>
    </section>
  );

  // ── Ürün SSS ──
  const faqBlock =
    content && content.faq.length > 0 ? (
      <section className="py-16 sm:py-20">
        <div className="mx-auto max-w-3xl px-4 sm:px-6">
          <div className="text-center">
            <span className="text-xs font-extrabold uppercase tracking-[0.1em] text-primary">
              {t("faqEyebrow")}
            </span>
            <h2 className="mt-3 font-heading text-[clamp(1.7rem,3vw,2.3rem)] font-semibold text-foreground">
              {t("faqTitle")}
            </h2>
          </div>
          <div className="mt-8">
            <FaqAccordion locale={loc} items={content.faq.map((f) => ({ q: f.q, a: f.a }))} />
          </div>
        </div>
      </section>
    ) : null;

  // Bölüm sırası: hesaplayıcı varsa → hesaplayıcı önce, sonra tanıtım/açıklamalar.
  // Yoksa → tanıtım (lead) önce, ardından açıklamalar (mevcut düzen).
  const bodySections = product.hasCalculator
    ? [calculatorBlock, leadBlock, coverageBlock, advantagesBlock, whyBlock, faqBlock]
    : [leadBlock, coverageBlock, advantagesBlock, whyBlock, faqBlock];

  return (
    <main>
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: jsonLdHtml(serviceLd) }}
      />
      {faqLd && (
        <script
          type="application/ld+json"
          dangerouslySetInnerHTML={{ __html: jsonLdHtml(faqLd) }}
        />
      )}

      {/* ===== HERO ===== */}
      <section className="relative overflow-hidden border-b border-border">
        <span
          aria-hidden
          className="pointer-events-none absolute -right-32 -top-32 h-[460px] w-[460px] rounded-full bg-[radial-gradient(circle_at_30%_30%,hsl(177_60%_27%/0.16),transparent_65%)]"
        />
        <div className="relative mx-auto max-w-6xl px-4 py-16 sm:px-6 lg:py-20">
          <nav aria-label="breadcrumb" className="mb-6 text-sm text-muted-foreground">
            <Link href="/planlar" className="transition hover:text-foreground">
              {tp("heading")}
            </Link>
            <span className="px-2">/</span>
            <span className="text-foreground">{product.name[loc]}</span>
          </nav>
          <div className="max-w-2xl">
            <span className="flex h-14 w-14 items-center justify-center rounded-2xl bg-accent text-accent-foreground">
              <ProductIcon name={product.icon} className="h-7 w-7" />
            </span>
            <h1 className="mt-5 font-heading text-[clamp(2.2rem,4.5vw,3.4rem)] font-semibold leading-[1.07] tracking-tight text-foreground">
              {product.name[loc]}
            </h1>
            <p className="mt-4 text-lg text-muted-foreground">
              {content ? content.intro[loc] : product.description[loc]}
            </p>
            <div className="mt-8 flex flex-wrap gap-3.5">
              <Link
                href={{ pathname: "/planlar/[slug]/teklif", params: { slug } }}
                className="inline-flex items-center gap-2 rounded-full bg-primary px-6 py-3.5 text-base font-bold text-primary-foreground shadow-[0_10px_24px_-10px_hsl(var(--destructive))] transition hover:-translate-y-0.5 hover:bg-destructive focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 focus-visible:ring-offset-background"
              >
                {t("getQuote")}
                <ArrowRight className="h-5 w-5" aria-hidden />
              </Link>
              {product.hasCalculator && (
                // Net CTA: aynı sayfadaki hesaplayıcı bölümüne yumuşak kaydırma
                // (#hesaplayici + html.scroll-smooth + bölümde scroll-mt). docs/03.
                <a
                  href="#hesaplayici"
                  className="inline-flex items-center gap-2 rounded-full border-[1.5px] border-foreground px-6 py-3 text-base font-bold text-foreground transition hover:bg-foreground hover:text-background focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 focus-visible:ring-offset-background"
                >
                  <Calculator className="h-5 w-5" aria-hidden />
                  {tp("goToCalculator")}
                </a>
              )}
            </div>
          </div>
        </div>
      </section>

      {/* ===== GÖVDE — sıra hesaplayıcı varlığına göre (docs/02/03 yeni düzen) ===== */}
      {bodySections.map((node, i) => (node ? <div key={i}>{node}</div> : null))}

      {/* ===== FINAL CTA → TEKLİF SAYFASI ===== */}
      <section className="px-4 pb-20 sm:px-6 sm:pb-24">
        <div className="relative mx-auto max-w-6xl overflow-hidden rounded-[28px] bg-foreground px-6 py-14 text-center text-background sm:px-12">
          <span
            aria-hidden
            className="pointer-events-none absolute -right-20 -top-28 h-[340px] w-[340px] rounded-full bg-[radial-gradient(circle,hsl(13_88%_57%/0.35),transparent_65%)]"
          />
          <h2 className="relative font-heading text-[clamp(1.8rem,3.6vw,2.6rem)] font-semibold">
            {t("ctaTitle")}
          </h2>
          <p className="relative mx-auto mt-4 max-w-xl text-background/75">{t("ctaSubtitle")}</p>
          <div className="relative mt-8">
            <Link
              href={{ pathname: "/planlar/[slug]/teklif", params: { slug } }}
              className="inline-flex items-center gap-2 rounded-full bg-primary px-7 py-3.5 text-base font-bold text-primary-foreground transition hover:-translate-y-0.5 hover:bg-destructive focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 focus-visible:ring-offset-foreground"
            >
              {t("getQuote")}
              <ArrowRight className="h-5 w-5" aria-hidden />
            </Link>
          </div>
        </div>
      </section>
    </main>
  );
}
