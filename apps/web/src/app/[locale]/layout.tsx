import type { ReactNode } from "react";
import type { Metadata, Viewport } from "next";
import { notFound } from "next/navigation";
import { NextIntlClientProvider, hasLocale } from "next-intl";
import { getTranslations, setRequestLocale } from "next-intl/server";
import { Fraunces, Hanken_Grotesk } from "next/font/google";
import { routing } from "@/i18n/routing";
import { localizedAlternates, jsonLdHtml } from "@/lib/seo";
import { ThemeProvider } from "@/components/theme-provider";
import { CookieConsent } from "@/components/cookie-consent";
import { Analytics } from "@/components/analytics";
import { Analytics as VercelAnalytics } from "@vercel/analytics/next";
import { SpeedInsights } from "@vercel/speed-insights/next";
import { SiteShell } from "@/components/layout/site-shell";
import { contact, siteUrl, brandName, social, mapLinkUrl, openingHours } from "@/lib/site";
import "../globals.css";

type Locale = (typeof routing.locales)[number];

// Tipografi (docs/09): Fraunces = başlık, Hanken Grotesk = gövde.
// Türkçe karakter desteği için "latin-ext" alt kümesi dahil.
// TODO(doc): docs/09 — TR karakter (ş, ğ, ı, İ) render teyidi yapılacak.
const fraunces = Fraunces({
  subsets: ["latin", "latin-ext"],
  variable: "--font-heading",
  display: "swap",
});

const hanken = Hanken_Grotesk({
  subsets: ["latin", "latin-ext"],
  variable: "--font-body",
  display: "swap",
});

export function generateStaticParams() {
  return routing.locales.map((locale) => ({ locale }));
}

// Viewport + theme-color (docs/07 SEO/PWA, docs/09 palet): tarayıcı UI rengi temaya
// göre değişir — açıkta krem (#f7f2e9), koyuda navy (#10243a). responsive viewport.
export const viewport: Viewport = {
  width: "device-width",
  initialScale: 1,
  themeColor: [
    { media: "(prefers-color-scheme: light)", color: "#f7f2e9" },
    { media: "(prefers-color-scheme: dark)", color: "#10243a" },
  ],
};

// Locale-bazlı kök metadata (docs/07): başlık şablonu, OG, hreflang temeli.
export async function generateMetadata({
  params,
}: {
  params: Promise<{ locale: string }>;
}): Promise<Metadata> {
  const { locale } = await params;
  const t = await getTranslations({ locale, namespace: "meta" });

  return {
    metadataBase: new URL(siteUrl),
    title: {
      default: t("homeTitle"),
      template: `%s — ${brandName}`,
    },
    description: t("homeDescription"),
    applicationName: brandName,
    alternates: localizedAlternates(locale as Locale, "/"),
    openGraph: {
      type: "website",
      siteName: brandName,
      title: t("homeTitle"),
      description: t("homeDescription"),
      locale: locale === "tr" ? "tr_TR" : "en_US",
      url: `${siteUrl}/${locale}`,
    },
    twitter: {
      card: "summary_large_image",
      title: t("homeTitle"),
      description: t("homeDescription"),
    },
    // Google Search Console doğrulaması (docs/07 / docs/10 env). Env değişkeni SET ise
    // Next `<meta name="google-site-verification" ...>` render eder; BOŞ/undefined ise
    // hiçbir şey eklenmez (güvenli varsayılan). Kod değişmeden Vercel env ile çalışır.
    verification: { google: process.env.GOOGLE_SITE_VERIFICATION },
    robots: { index: true, follow: true },
  };
}

export default async function LocaleLayout({
  children,
  params,
}: {
  children: ReactNode;
  params: Promise<{ locale: string }>;
}) {
  const { locale } = await params;

  if (!hasLocale(routing.locales, locale)) {
    notFound();
  }

  setRequestLocale(locale);
  const loc = locale as Locale;

  // JSON-LD: InsuranceAgency / LocalBusiness (docs/07 — yerel SEO, NAP tutarlılığı).
  const orgJsonLd = {
    "@context": "https://schema.org",
    "@type": "InsuranceAgency",
    name: brandName,
    url: `${siteUrl}/${loc}`,
    telephone: contact.phoneE164,
    email: contact.email,
    image: `${siteUrl}/opengraph-image`,
    address: {
      "@type": "PostalAddress",
      streetAddress: contact.address.street,
      addressLocality: contact.address.district,
      addressRegion: contact.address.city,
      postalCode: contact.address.postalCode,
      addressCountry: contact.address.country,
    },
    areaServed: "TR",
    priceRange: "$$",
    // Ofis koordinatı (docs/07 yerel SEO — GeoCoordinates) + harita bağlantısı (hasMap).
    geo: {
      "@type": "GeoCoordinates",
      latitude: contact.geo.lat,
      longitude: contact.geo.lng,
    },
    // Çalışma saatleri (docs/07 yerel SEO — sitedeki "Hafta içi 09:00–18:00" ile birebir).
    openingHoursSpecification: {
      "@type": "OpeningHoursSpecification",
      dayOfWeek: openingHours.dayOfWeek,
      opens: openingHours.opens,
      closes: openingHours.closes,
    },
    hasMap: mapLinkUrl,
    // docs/07: sosyal profilleri marka-entity ile ilişkilendir (sameAs → yerel SEO).
    sameAs: [social.instagram, social.facebook, social.linkedin],
  };

  return (
    <html lang={locale} suppressHydrationWarning className="scroll-smooth">
      <body className={`${fraunces.variable} ${hanken.variable}`}>
        <script
          type="application/ld+json"
          dangerouslySetInnerHTML={{ __html: jsonLdHtml(orgJsonLd) }}
        />
        <ThemeProvider attribute="class" defaultTheme="system" enableSystem>
          <NextIntlClientProvider>
            <SiteShell locale={loc}>{children}</SiteShell>
            <CookieConsent />
            {/* Onay-kapılı analitik (Plausible/GA4 — KVKK §3). */}
            <Analytics />
          </NextIntlClientProvider>
        </ThemeProvider>
        {/* Vercel Web Analytics + Speed Insights: çerezsiz, anonim, cross-site izleme
            yok. Kişisel veri toplamadığından onay kapısına girmez; doğrudan yüklenir
            (docs/06 §3, docs/07 analitik). */}
        <VercelAnalytics />
        <SpeedInsights />
      </body>
    </html>
  );
}
