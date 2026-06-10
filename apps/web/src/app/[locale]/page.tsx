// Anasayfa — docs/09 "Anasayfa Düzeni" akışı (referans kalitesinde).
// Bölümler: Hero + hızlı teklif kartı · Güven şeridi · Branşlar · Nasıl çalışır ·
// SSS · Final CTA. (Üst bar/Header/Footer/FAB SiteShell'den gelir.)
// SEO: locale layout'tan kök metadata + burada FAQPage JSON-LD (docs/07).

import { getTranslations, setRequestLocale } from "next-intl/server";
import { ArrowRight, MessageCircle, ShieldCheck } from "lucide-react";
import { Link } from "@/i18n/navigation";
import { routing } from "@/i18n/routing";
import { getAllProducts, getLocalizedSlug } from "@do/products";
import { ProductIcon } from "@/components/product-icon";
import { HeroQuoteCard } from "@/components/home/hero-quote-card";
import { TrackLink } from "@/components/track-link";
import { FaqAccordion } from "@/components/faq-accordion";
import { buildFaqJsonLd } from "@/lib/faq";
import { jsonLdHtml } from "@/lib/seo";
import { contact, partnerCompanies } from "@/lib/site";

type Locale = (typeof routing.locales)[number];

export function generateStaticParams() {
  return routing.locales.map((locale) => ({ locale }));
}

export default async function HomePage({ params }: { params: Promise<{ locale: string }> }) {
  const { locale } = await params;
  setRequestLocale(locale);
  const loc = locale as Locale;
  const t = await getTranslations("home");
  const tc = await getTranslations("common");

  const products = getAllProducts();
  const waHref = `https://wa.me/${contact.whatsapp}?text=${encodeURIComponent(
    tc("whatsappPrefill"),
  )}`;
  const faqJsonLd = buildFaqJsonLd(loc);

  const stats = [
    { value: t("stats.companies"), label: t("stats.companiesLabel") },
    { value: t("stats.experience"), label: t("stats.experienceLabel") },
    { value: t("stats.response"), label: t("stats.responseLabel") },
  ];

  const steps = [
    { t: t("steps.s1Title"), d: t("steps.s1Body") },
    { t: t("steps.s2Title"), d: t("steps.s2Body") },
    { t: t("steps.s3Title"), d: t("steps.s3Body") },
  ];

  return (
    <>
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: jsonLdHtml(faqJsonLd) }}
      />

      {/* ===== HERO ===== */}
      <section className="relative overflow-hidden">
        {/* Radyal ışıma dokuları (docs/09) */}
        <span
          aria-hidden
          className="pointer-events-none absolute -right-40 -top-44 h-[560px] w-[560px] rounded-full bg-[radial-gradient(circle_at_30%_30%,hsl(177_60%_27%/0.18),transparent_65%)]"
        />
        <span
          aria-hidden
          className="pointer-events-none absolute -bottom-48 -left-36 h-[500px] w-[500px] rounded-full bg-[radial-gradient(circle_at_50%_50%,hsl(13_88%_57%/0.14),transparent_65%)]"
        />
        <div className="relative mx-auto grid max-w-6xl items-center gap-12 px-4 py-16 sm:px-6 lg:grid-cols-[1.05fr_0.95fr] lg:py-24">
          <div>
            <span className="reveal reveal-1 inline-flex items-center gap-2 rounded-full border border-secondary/25 bg-accent px-4 py-1.5 text-sm font-bold text-accent-foreground">
              <ShieldCheck className="h-4 w-4" aria-hidden />
              {t("heroBadge")}
            </span>
            <h1 className="reveal reveal-2 mt-5 font-heading text-[clamp(2.4rem,5vw,3.7rem)] font-semibold leading-[1.05] tracking-tight text-foreground">
              {t.rich("heroTitle", {
                em: (chunks) => <em className="italic text-primary">{chunks}</em>,
              })}
            </h1>
            <p className="reveal reveal-3 mt-5 max-w-xl text-lg text-muted-foreground">
              {t("heroSubtitle")}
            </p>
            <div className="reveal reveal-4 mt-7 flex flex-wrap items-center gap-3.5">
              <Link
                href="/planlar"
                className="inline-flex items-center gap-2 rounded-full bg-destructive px-6 py-3.5 text-base font-bold text-white shadow-[0_10px_24px_-10px_hsl(var(--destructive))] transition hover:-translate-y-0.5 hover:bg-[hsl(9_84%_38%)] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 focus-visible:ring-offset-background"
              >
                {t("heroCtaPrimary")}
                <ArrowRight className="h-5 w-5" aria-hidden />
              </Link>
              <TrackLink
                event="iletisim_arama"
                eventParams={{ kanal: "whatsapp" }}
                href={waHref}
                target="_blank"
                rel="noopener noreferrer"
                className="inline-flex items-center gap-2 rounded-full border-[1.5px] border-foreground px-6 py-3 text-base font-bold text-foreground transition hover:bg-foreground hover:text-background focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 focus-visible:ring-offset-background"
              >
                <MessageCircle className="h-5 w-5" aria-hidden />
                {t("heroCtaWhatsapp")}
              </TrackLink>
            </div>
            <dl className="reveal reveal-5 mt-10 flex flex-wrap gap-x-10 gap-y-5">
              {stats.map((s) => (
                <div key={s.label} className="flex flex-col">
                  <dt className="order-2 text-sm font-semibold text-muted-foreground">{s.label}</dt>
                  <dd className="order-1 font-heading text-3xl leading-none text-foreground">
                    {s.value}
                  </dd>
                </div>
              ))}
            </dl>
          </div>

          <div className="reveal reveal-3">
            <HeroQuoteCard locale={loc} />
          </div>
        </div>
      </section>

      {/* ===== GÜVEN ŞERİDİ (anlaşmalı şirketler) ===== */}
      <section aria-label={t("trustLabel")} className="bg-foreground text-background">
        <div className="mx-auto flex max-w-6xl flex-col items-start gap-5 px-4 py-8 sm:px-6 lg:flex-row lg:items-center lg:justify-between">
          <span className="text-xs font-bold uppercase tracking-[0.12em] text-background/60">
            {t("trustLabel")}
          </span>
          <ul className="flex flex-wrap gap-3">
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

      {/* ===== BRANŞLAR ===== */}
      <section id="branslar" className="py-20 sm:py-24">
        <div className="mx-auto max-w-6xl px-4 sm:px-6">
          <div className="max-w-2xl">
            <span className="text-xs font-extrabold uppercase tracking-[0.1em] eyebrow">
              {t("branchesEyebrow")}
            </span>
            <h2 className="mt-3 font-heading text-[clamp(2rem,3.6vw,2.7rem)] font-semibold text-foreground">
              {t("branchesTitle")}
            </h2>
            <p className="mt-3 text-lg text-muted-foreground">{t("branchesSubtitle")}</p>
          </div>

          <ul className="mt-12 grid grid-cols-1 gap-5 sm:grid-cols-2 lg:grid-cols-3">
            {products.map((p, i) => (
              <li key={p.slug}>
                <Link
                  href={{
                    pathname: "/planlar/[slug]",
                    params: { slug: getLocalizedSlug(p, loc) },
                  }}
                  className="group flex h-full flex-col rounded-[var(--radius)] border border-border bg-card p-6 transition hover:-translate-y-1.5 hover:border-transparent hover:shadow-[0_18px_50px_-22px_hsl(210_56%_15%/0.45)]"
                >
                  <span
                    className={
                      i % 2 === 1
                        ? "flex h-12 w-12 items-center justify-center rounded-xl bg-[hsl(13_80%_92%)] text-destructive"
                        : "flex h-12 w-12 items-center justify-center rounded-xl bg-accent text-accent-foreground"
                    }
                  >
                    <ProductIcon name={p.icon} className="h-6 w-6" />
                  </span>
                  <h3 className="mt-4 font-heading text-xl text-foreground">{p.name[loc]}</h3>
                  <p className="mt-2 flex-1 text-sm text-muted-foreground">{p.description[loc]}</p>
                  <span className="mt-4 inline-flex items-center gap-1.5 text-sm font-bold text-destructive">
                    {t("branchesCta")}
                    <ArrowRight
                      className="h-4 w-4 transition-all group-hover:translate-x-1"
                      aria-hidden
                    />
                  </span>
                </Link>
              </li>
            ))}
          </ul>
        </div>
      </section>

      {/* ===== NASIL ÇALIŞIR ===== */}
      <section className="bg-muted/60 py-20 sm:py-24">
        <div className="mx-auto max-w-6xl px-4 sm:px-6">
          <div className="mx-auto max-w-2xl text-center">
            <span className="text-xs font-extrabold uppercase tracking-[0.1em] eyebrow">
              {t("stepsEyebrow")}
            </span>
            <h2 className="mt-3 font-heading text-[clamp(2rem,3.6vw,2.7rem)] font-semibold text-foreground">
              {t("stepsTitle")}
            </h2>
          </div>
          <ol className="mt-14 grid grid-cols-1 gap-10 md:grid-cols-3">
            {steps.map((s, i) => (
              <li key={i}>
                <span className="font-heading text-5xl font-semibold leading-none text-destructive">
                  {String(i + 1).padStart(2, "0")}
                </span>
                <h3 className="mt-3 font-heading text-xl text-foreground">{s.t}</h3>
                <p className="mt-2 text-muted-foreground">{s.d}</p>
              </li>
            ))}
          </ol>
        </div>
      </section>

      {/* ===== SSS ===== */}
      <section id="sss" className="py-20 sm:py-24">
        <div className="mx-auto max-w-3xl px-4 sm:px-6">
          <div className="text-center">
            <span className="text-xs font-extrabold uppercase tracking-[0.1em] eyebrow">
              {t("faqEyebrow")}
            </span>
            <h2 className="mt-3 font-heading text-[clamp(2rem,3.6vw,2.7rem)] font-semibold text-foreground">
              {t("faqTitle")}
            </h2>
          </div>
          <div className="mt-10">
            <FaqAccordion locale={loc} />
          </div>
          <p className="mt-6 text-center text-sm text-muted-foreground">
            {t("faqMore")}{" "}
            <Link href="/sss" className="font-semibold text-secondary underline">
              {t("faqMoreLink")}
            </Link>
          </p>
        </div>
      </section>

      {/* ===== FINAL CTA ===== */}
      <section className="px-4 pb-20 sm:px-6 sm:pb-24">
        <div className="relative mx-auto max-w-6xl overflow-hidden rounded-[28px] bg-foreground px-6 py-16 text-center text-background sm:px-12">
          <span
            aria-hidden
            className="pointer-events-none absolute -right-20 -top-28 h-[340px] w-[340px] rounded-full bg-[radial-gradient(circle,hsl(13_88%_57%/0.35),transparent_65%)]"
          />
          <h2 className="relative font-heading text-[clamp(2rem,4vw,2.9rem)] font-semibold">
            {t("finalTitle")}
          </h2>
          <p className="relative mx-auto mt-4 max-w-xl text-background/75">{t("finalSubtitle")}</p>
          <div className="relative mt-8 flex flex-wrap justify-center gap-3.5">
            <Link
              href="/planlar"
              className="inline-flex items-center gap-2 rounded-full bg-destructive px-7 py-3.5 text-base font-bold text-white transition hover:-translate-y-0.5 hover:bg-[hsl(9_84%_38%)] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 focus-visible:ring-offset-foreground"
            >
              {tc("getQuote")}
              <ArrowRight className="h-5 w-5" aria-hidden />
            </Link>
            <TrackLink
              event="iletisim_arama"
              eventParams={{ kanal: "whatsapp" }}
              href={waHref}
              target="_blank"
              rel="noopener noreferrer"
              className="inline-flex items-center gap-2 rounded-full border-[1.5px] border-white/30 px-7 py-3 text-base font-bold text-background transition hover:bg-white/10 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 focus-visible:ring-offset-foreground"
            >
              <MessageCircle className="h-5 w-5" aria-hidden />
              {t("heroCtaWhatsapp")}
            </TrackLink>
          </div>
        </div>
      </section>
    </>
  );
}
