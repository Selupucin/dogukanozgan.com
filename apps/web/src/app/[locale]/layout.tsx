import type { ReactNode } from "react";
import type { Metadata } from "next";
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
import { contact, siteUrl, brandName } from "@/lib/site";
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
