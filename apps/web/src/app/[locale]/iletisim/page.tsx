// İletişim — /[locale]/iletisim (docs/02). Telefon, WhatsApp, e-posta, adres, harita.
// SEO: tekil title/meta + hreflang/canonical + LocalBusiness JSON-LD (docs/07 yerel SEO).

import type { Metadata } from "next";
import { getTranslations, setRequestLocale } from "next-intl/server";
import { Phone, Mail, MapPin, MessageCircle, Clock } from "lucide-react";
import { routing, type Locale } from "@/i18n/routing";
import { localizedAlternates, jsonLdHtml } from "@/lib/seo";
import { contact, mapEmbedUrl, mapLinkUrl, siteUrl, brandName, social } from "@/lib/site";
import { ContactForm } from "@/components/contact-form";
import { TrackLink } from "@/components/track-link";

export function generateStaticParams() {
  return routing.locales.map((locale) => ({ locale }));
}

export async function generateMetadata({
  params,
}: {
  params: Promise<{ locale: string }>;
}): Promise<Metadata> {
  const { locale } = await params;
  const t = await getTranslations({ locale, namespace: "contact" });
  return {
    title: t("metaTitle"),
    description: t("metaDescription"),
    alternates: localizedAlternates(locale as Locale, "/iletisim"),
  };
}

export default async function ContactPage({ params }: { params: Promise<{ locale: string }> }) {
  const { locale } = await params;
  setRequestLocale(locale);
  const t = await getTranslations("contact");
  const tc = await getTranslations("common");

  const waHref = `https://wa.me/${contact.whatsapp}?text=${encodeURIComponent(
    tc("whatsappPrefill"),
  )}`;

  // LocalBusiness JSON-LD — açık adres/telefon (NAP) burada da güçlendirilir.
  const jsonLd = {
    "@context": "https://schema.org",
    "@type": "InsuranceAgency",
    name: brandName,
    url: `${siteUrl}/${locale}/${locale === "tr" ? "iletisim" : "contact"}`,
    telephone: contact.phoneE164,
    email: contact.email,
    address: {
      "@type": "PostalAddress",
      streetAddress: contact.address.street,
      addressLocality: contact.address.district,
      addressRegion: contact.address.city,
      postalCode: contact.address.postalCode,
      addressCountry: contact.address.country,
    },
    // Ofis koordinatı (docs/07 yerel SEO — GeoCoordinates) + harita bağlantısı (hasMap).
    geo: {
      "@type": "GeoCoordinates",
      latitude: contact.geo.lat,
      longitude: contact.geo.lng,
    },
    hasMap: mapLinkUrl,
    // docs/07: marka-entity sosyal profilleri (sameAs → yerel SEO).
    sameAs: [social.instagram, social.facebook, social.linkedin],
  };

  const cards = [
    {
      icon: Phone,
      title: t("phoneTitle"),
      value: contact.phoneDisplay,
      href: `tel:${contact.phoneE164}`,
      // GA4: bu kart tıklanınca "iletisim_arama" (kanal: telefon).
      kanal: "telefon" as const,
    },
    {
      icon: MessageCircle,
      title: t("whatsappTitle"),
      value: contact.phoneDisplay,
      href: waHref,
      external: true,
      // GA4: bu kart tıklanınca "iletisim_arama" (kanal: whatsapp).
      kanal: "whatsapp" as const,
    },
    {
      icon: Mail,
      title: t("emailTitle"),
      value: contact.email,
      href: `mailto:${contact.email}`,
    },
  ];

  return (
    <main className="mx-auto max-w-5xl px-4 py-16 sm:px-6">
      <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: jsonLdHtml(jsonLd) }} />

      <header className="max-w-2xl">
        <span className="text-xs font-extrabold uppercase tracking-[0.1em] eyebrow">
          {t("eyebrow")}
        </span>
        <h1 className="mt-3 font-heading text-[clamp(2.2rem,4.5vw,3.2rem)] font-semibold tracking-tight text-foreground">
          {t("heading")}
        </h1>
        <p className="mt-4 text-lg text-muted-foreground">{t("intro")}</p>
      </header>

      <div className="mt-10 grid grid-cols-1 gap-5 sm:grid-cols-3">
        {cards.map((c) => {
          const cardClass =
            "group flex flex-col gap-2 rounded-[var(--radius)] border border-border bg-card p-6 transition hover:-translate-y-1 hover:shadow-[0_18px_50px_-22px_hsl(210_56%_15%/0.45)]";
          const externalProps = c.external ? { target: "_blank", rel: "noopener noreferrer" } : {};
          const inner = (
            <>
              <span className="flex h-11 w-11 items-center justify-center rounded-xl bg-accent text-accent-foreground">
                <c.icon className="h-5 w-5" aria-hidden />
              </span>
              <span className="mt-1 text-sm font-bold text-muted-foreground">{c.title}</span>
              <span className="break-words font-heading text-lg text-foreground">{c.value}</span>
            </>
          );
          // Telefon/WhatsApp kartı → GA4 "iletisim_arama" izlenir; e-posta kartı düz <a>.
          return c.kanal ? (
            <TrackLink
              key={c.title}
              event="iletisim_arama"
              eventParams={{ kanal: c.kanal }}
              href={c.href}
              {...externalProps}
              className={cardClass}
            >
              {inner}
            </TrackLink>
          ) : (
            <a key={c.title} href={c.href} {...externalProps} className={cardClass}>
              {inner}
            </a>
          );
        })}
      </div>

      <div className="mt-10 grid grid-cols-1 gap-6 lg:grid-cols-2">
        {/* Geri arama / iletişim formu (docs/02) */}
        <ContactForm />

        <div className="flex flex-col gap-6">
          <div className="rounded-[var(--radius)] border border-border bg-card p-6">
            <h2 className="font-heading text-xl text-foreground">{t("addressTitle")}</h2>
            <p className="mt-3 flex items-start gap-2.5 text-muted-foreground">
              <MapPin className="mt-0.5 h-5 w-5 shrink-0 text-secondary" aria-hidden />
              {contact.fullAddress}
            </p>
            <p className="mt-4 flex items-start gap-2.5 text-muted-foreground">
              <Clock className="mt-0.5 h-5 w-5 shrink-0 text-secondary" aria-hidden />
              {t("hours")}
            </p>
            <a
              href={mapLinkUrl}
              target="_blank"
              rel="noopener noreferrer"
              className="mt-5 inline-flex items-center gap-2 rounded-full bg-destructive px-5 py-2.5 text-sm font-bold text-white transition hover:-translate-y-0.5 hover:bg-[hsl(9_84%_38%)]"
            >
              <MapPin className="h-4 w-4" aria-hidden />
              {t("openMap")}
            </a>
          </div>

          <div className="overflow-hidden rounded-[var(--radius)] border border-border bg-card">
            {/* Harita gömme (docs/02 / docs/07 yerel SEO). lazy yükleme — performans. */}
            <iframe
              src={mapEmbedUrl}
              title={t("mapTitle")}
              loading="lazy"
              referrerPolicy="no-referrer-when-downgrade"
              className="h-full min-h-[280px] w-full border-0"
            />
          </div>
        </div>
      </div>
    </main>
  );
}
