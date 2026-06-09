// Ürün (planlar) LİSTE / landing sayfası — /[locale]/planlar (docs/02).
// Zengin landing: giriş + neden acente + ürün kartları + nasıl çalışır + güven şeridi +
// kısa SSS + kapanış CTA (docs/02 güncel "Planlar (liste)" + docs/09 tasarım dili).
// Kartlar definitions.ts'ten üretilir; her kart ürün TANIM sayfasına gider.
// SEO: tekil title/meta + hreflang (docs/07). FAQPage JSON-LD BURADA YOK — mükerrerliği
// önlemek için yapısal SSS verisi yalnız anasayfa + /sss'te (D2); burada görsel akordeon.

import type { Metadata } from "next";
import { getTranslations, setRequestLocale } from "next-intl/server";
import { getAllProducts, getLocalizedSlug } from "@do/products";
import { ArrowRight, Calculator, Scale, Gift, HeartHandshake } from "lucide-react";
import { Link } from "@/i18n/navigation";
import { routing } from "@/i18n/routing";
import { localizedAlternates } from "@/lib/seo";
import { ProductIcon } from "@/components/product-icon";
import { FaqAccordion } from "@/components/faq-accordion";
import { getProductContent } from "@/lib/product-content";
import { partnerCompanies } from "@/lib/site";

type Locale = (typeof routing.locales)[number];

export function generateStaticParams() {
  return routing.locales.map((locale) => ({ locale }));
}

export async function generateMetadata({
  params,
}: {
  params: Promise<{ locale: string }>;
}): Promise<Metadata> {
  const { locale } = await params;
  const t = await getTranslations({ locale, namespace: "plans" });
  const loc = locale as Locale;
  return {
    title: t("metaTitle"),
    description: t("metaDescription"),
    alternates: localizedAlternates(loc, "/planlar"),
  };
}

export default async function PlansPage({ params }: { params: Promise<{ locale: string }> }) {
  const { locale } = await params;
  setRequestLocale(locale);
  const loc = locale as Locale;
  const t = await getTranslations("plans");
  const products = getAllProducts();

  const why = [
    { icon: Scale, title: t("why1Title"), body: t("why1Body") },
    { icon: Gift, title: t("why2Title"), body: t("why2Body") },
    { icon: HeartHandshake, title: t("why3Title"), body: t("why3Body") },
  ];

  // Nasıl çalışır 3 adım — home namespace ile aynı içerik (tek kaynak hissi).
  const th = await getTranslations("home");
  const steps = [
    { t: th("steps.s1Title"), d: th("steps.s1Body") },
    { t: th("steps.s2Title"), d: th("steps.s2Body") },
    { t: th("steps.s3Title"), d: th("steps.s3Body") },
  ];

  return (
    <main>
      {/* FAQPage JSON-LD KALDIRILDI (docs/07 D2): aynı FAQPage yapısal verisi anasayfada
          ve /sss'te var; mükerrer yapısal veriyi önlemek için burada YALNIZ görsel
          akordeon gösterilir (yapısal veri yok). */}

      {/* ===== GİRİŞ ===== */}
      <section className="relative overflow-hidden border-b border-border">
        <span
          aria-hidden
          className="pointer-events-none absolute -right-32 -top-36 h-[480px] w-[480px] rounded-full bg-[radial-gradient(circle_at_30%_30%,hsl(177_60%_27%/0.16),transparent_65%)]"
        />
        <div className="relative mx-auto max-w-6xl px-4 py-16 sm:px-6 lg:py-20">
          <div className="max-w-2xl">
            <span className="text-xs font-extrabold uppercase tracking-[0.1em] text-primary">
              {t("eyebrow")}
            </span>
            <h1 className="mt-3 font-heading text-[clamp(2.2rem,4.5vw,3.4rem)] font-semibold leading-[1.07] tracking-tight text-foreground">
              {t("heading")}
            </h1>
            <p className="mt-4 text-lg text-muted-foreground">{t("subheading")}</p>
          </div>
        </div>
      </section>

      {/* ===== NEDEN ACENTE ===== */}
      <section className="py-16 sm:py-20">
        <div className="mx-auto max-w-6xl px-4 sm:px-6">
          <div className="max-w-2xl">
            <span className="text-xs font-extrabold uppercase tracking-[0.1em] text-primary">
              {t("whyEyebrow")}
            </span>
            <h2 className="mt-3 font-heading text-[clamp(1.7rem,3vw,2.3rem)] font-semibold text-foreground">
              {t("whyTitle")}
            </h2>
            <p className="mt-3 text-muted-foreground">{t("whySubtitle")}</p>
          </div>
          <ul className="mt-8 grid grid-cols-1 gap-5 sm:grid-cols-3">
            {why.map((w) => (
              <li
                key={w.title}
                className="rounded-[var(--radius)] border border-border bg-card p-6"
              >
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

      {/* ===== ÜRÜN KARTLARI (zengin açıklamalı) ===== */}
      <section className="bg-muted/60 py-16 sm:py-20">
        <div className="mx-auto max-w-6xl px-4 sm:px-6">
          <ul className="grid grid-cols-1 gap-6 sm:grid-cols-2 lg:grid-cols-3">
            {products.map((product) => {
              const content = getProductContent(product.slug);
              return (
                <li key={product.slug}>
                  <Link
                    href={{
                      pathname: "/planlar/[slug]",
                      params: { slug: getLocalizedSlug(product, loc) },
                    }}
                    className="group flex h-full flex-col rounded-[var(--radius)] border border-border bg-card p-6 shadow-sm transition hover:-translate-y-1.5 hover:border-transparent hover:shadow-[0_18px_50px_-22px_hsl(210_56%_15%/0.45)]"
                  >
                    <div className="flex items-center justify-between">
                      <span className="flex h-12 w-12 items-center justify-center rounded-xl bg-accent text-accent-foreground">
                        <ProductIcon name={product.icon} className="h-6 w-6" />
                      </span>
                      {product.hasCalculator && (
                        <span className="inline-flex w-fit items-center gap-1.5 rounded-pill bg-secondary/10 px-3 py-1 text-xs font-semibold text-secondary">
                          <Calculator className="h-3.5 w-3.5" aria-hidden />
                          {t("hasCalculator")}
                        </span>
                      )}
                    </div>
                    <h2 className="mt-4 font-heading text-xl text-foreground">
                      {product.name[loc]}
                    </h2>
                    <p className="mt-2 text-sm text-muted-foreground">
                      {content ? content.intro[loc] : product.description[loc]}
                    </p>
                    {content && content.coverage.length > 0 && (
                      <ul className="mt-4 flex-1 space-y-1.5">
                        {content.coverage.slice(0, 3).map((c) => (
                          <li
                            key={c[loc]}
                            className="flex items-start gap-2 text-xs text-muted-foreground"
                          >
                            <span
                              aria-hidden
                              className="mt-1.5 h-1.5 w-1.5 shrink-0 rounded-full bg-secondary"
                            />
                            {c[loc]}
                          </li>
                        ))}
                      </ul>
                    )}
                    <span className="mt-5 inline-flex items-center gap-1.5 text-sm font-bold text-primary">
                      {t("detailsCta")}
                      <ArrowRight
                        className="h-4 w-4 transition group-hover:translate-x-1"
                        aria-hidden
                      />
                    </span>
                  </Link>
                </li>
              );
            })}
          </ul>
        </div>
      </section>

      {/* ===== NASIL ÇALIŞIR ===== */}
      <section className="py-16 sm:py-20">
        <div className="mx-auto max-w-6xl px-4 sm:px-6">
          <div className="mx-auto max-w-2xl text-center">
            <span className="text-xs font-extrabold uppercase tracking-[0.1em] text-primary">
              {t("stepsEyebrow")}
            </span>
            <h2 className="mt-3 font-heading text-[clamp(1.7rem,3vw,2.3rem)] font-semibold text-foreground">
              {t("stepsTitle")}
            </h2>
          </div>
          <ol className="mt-12 grid grid-cols-1 gap-10 md:grid-cols-3">
            {steps.map((s, i) => (
              <li key={i}>
                <span className="font-heading text-5xl font-semibold leading-none text-primary/85">
                  {String(i + 1).padStart(2, "0")}
                </span>
                <h3 className="mt-3 font-heading text-xl text-foreground">{s.t}</h3>
                <p className="mt-2 text-muted-foreground">{s.d}</p>
              </li>
            ))}
          </ol>
        </div>
      </section>

      {/* ===== GÜVEN ŞERİDİ ===== */}
      <section aria-label={t("trustTitle")} className="bg-foreground text-background">
        <div className="mx-auto max-w-6xl px-4 py-14 sm:px-6">
          <div className="max-w-2xl">
            <h2 className="font-heading text-2xl font-semibold">{t("trustTitle")}</h2>
            <p className="mt-2 text-sm text-background/70">{t("trustSubtitle")}</p>
          </div>
          <ul className="mt-7 flex flex-wrap gap-3">
            {partnerCompanies.map((c) => (
              <li
                key={c}
                className="rounded-lg border border-white/12 bg-white/[0.07] px-4 py-2 text-sm font-bold text-background/90"
              >
                {c}
              </li>
            ))}
          </ul>
        </div>
      </section>

      {/* ===== SSS ===== */}
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
            <FaqAccordion locale={loc} />
          </div>
        </div>
      </section>

      {/* ===== KAPANIŞ CTA ===== */}
      <section className="px-4 pb-20 sm:px-6 sm:pb-24">
        <div className="relative mx-auto max-w-6xl overflow-hidden rounded-[28px] bg-foreground px-6 py-14 text-center text-background sm:px-12">
          <span
            aria-hidden
            className="pointer-events-none absolute -right-20 -top-28 h-[340px] w-[340px] rounded-full bg-[radial-gradient(circle,hsl(13_88%_57%/0.35),transparent_65%)]"
          />
          <h2 className="relative font-heading text-[clamp(1.8rem,3.6vw,2.6rem)] font-semibold">
            {t("finalTitle")}
          </h2>
          <p className="relative mx-auto mt-4 max-w-xl text-background/75">{t("finalSubtitle")}</p>
        </div>
      </section>
    </main>
  );
}
