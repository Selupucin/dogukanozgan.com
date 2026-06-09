// SSS — /[locale]/sss (docs/02 "SSS"). Sıkça sorulan sorular, KATEGORİLİ
// (Genel + ürünler) açılır-kapanır listeler.
// Tek kaynak: lib/faq.ts. SEO: tekil title/meta + hreflang/canonical +
// FAQPage JSON-LD (docs/07 — "akordeon" zengin sonuç; TÜM sorular düzleştirilir).

import type { Metadata } from "next";
import { getTranslations, setRequestLocale } from "next-intl/server";
import { ArrowRight, MessageCircle } from "lucide-react";
import { Link } from "@/i18n/navigation";
import { routing } from "@/i18n/routing";
import { localizedAlternates, jsonLdHtml } from "@/lib/seo";
import { FaqCategories } from "@/components/faq-categories";
import { buildFaqJsonLd, faqCategories, getAllFaqItems } from "@/lib/faq";
import { contact } from "@/lib/site";

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
  const t = await getTranslations({ locale, namespace: "faqPage" });
  return {
    title: t("metaTitle"),
    description: t("metaDescription"),
    alternates: localizedAlternates(locale as Locale, "/sss"),
  };
}

export default async function FaqPage({ params }: { params: Promise<{ locale: string }> }) {
  const { locale } = await params;
  setRequestLocale(locale);
  const loc = locale as Locale;
  const t = await getTranslations("faqPage");
  const tc = await getTranslations("common");

  // FAQPage JSON-LD — TÜM kategorilerdeki sorular düzleştirilir (docs/07).
  const faqJsonLd = buildFaqJsonLd(loc, getAllFaqItems());
  const waHref = `https://wa.me/${contact.whatsapp}?text=${encodeURIComponent(
    tc("whatsappPrefill"),
  )}`;

  return (
    <main className="mx-auto max-w-3xl px-4 py-16 sm:px-6">
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: jsonLdHtml(faqJsonLd) }}
      />

      <header className="max-w-2xl">
        <span className="text-xs font-extrabold uppercase tracking-[0.1em] text-primary">
          {t("eyebrow")}
        </span>
        <h1 className="mt-3 font-heading text-[clamp(2.2rem,4.5vw,3.2rem)] font-semibold tracking-tight text-foreground">
          {t("heading")}
        </h1>
        <p className="mt-4 text-lg text-muted-foreground">{t("intro")}</p>
      </header>

      {/* Kategori hızlı erişim — sayfa içi anchor'larla gruplara atlama */}
      <nav aria-label={t("categoryNavLabel")} className="mt-8 flex flex-wrap gap-2">
        {faqCategories.map((category) => (
          <a
            key={category.id}
            href={`#${category.id}`}
            className="rounded-full border border-border bg-card px-3.5 py-1.5 text-sm font-medium text-muted-foreground transition hover:border-secondary hover:text-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 focus-visible:ring-offset-background"
          >
            {category.title[loc]}
          </a>
        ))}
      </nav>

      <div className="mt-10">
        <FaqCategories locale={loc} />
      </div>

      {/* İletişim CTA — soru yanıtsız kalırsa doğrudan ulaşım */}
      <div className="mt-12 rounded-[var(--radius)] border border-border bg-card p-7 text-center sm:p-9">
        <h2 className="font-heading text-2xl text-foreground">{t("ctaTitle")}</h2>
        <p className="mx-auto mt-2 max-w-md text-muted-foreground">{t("ctaBody")}</p>
        <div className="mt-6 flex flex-wrap justify-center gap-3.5">
          <Link
            href="/iletisim"
            className="inline-flex items-center gap-2 rounded-full bg-primary px-6 py-3 text-base font-bold text-primary-foreground transition hover:-translate-y-0.5 hover:bg-destructive focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 focus-visible:ring-offset-card"
          >
            {t("ctaButton")}
            <ArrowRight className="h-5 w-5" aria-hidden />
          </Link>
          <a
            href={waHref}
            target="_blank"
            rel="noopener noreferrer"
            className="inline-flex items-center gap-2 rounded-full border-[1.5px] border-foreground px-6 py-3 text-base font-bold text-foreground transition hover:bg-foreground hover:text-background focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 focus-visible:ring-offset-card"
          >
            <MessageCircle className="h-5 w-5" aria-hidden />
            WhatsApp
          </a>
        </div>
      </div>
    </main>
  );
}
