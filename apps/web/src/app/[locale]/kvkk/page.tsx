// KVKK Aydınlatma Metni — /[locale]/kvkk. Kaynak: docs/06 §1 & §4, docs/02.
// ✅ İçerik hukukçu onayı alınmıştır (2026-06-08).

import type { Metadata } from "next";
import { setRequestLocale, getTranslations } from "next-intl/server";
import { routing } from "@/i18n/routing";
import { localizedAlternates } from "@/lib/seo";
import { LegalPage } from "@/components/legal-page";
import { KvkkBody } from "@/components/legal/kvkk-content";

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
  const t = await getTranslations({ locale, namespace: "legal" });
  return {
    title: t("kvkk.title"),
    description: t("kvkk.metaDescription"),
    alternates: localizedAlternates(locale as Locale, "/kvkk"),
  };
}

export default async function KvkkPage({ params }: { params: Promise<{ locale: string }> }) {
  const { locale } = await params;
  setRequestLocale(locale);
  const t = await getTranslations("legal");
  const loc = locale as Locale;

  // İçerik TEK KAYNAKTAN gelir (components/legal/kvkk-content) — AutoForm rıza
  // modal'ı ile paylaşılır (docs/06 §2a).
  return (
    <LegalPage title={t("kvkk.title")}>
      <KvkkBody locale={loc} />
    </LegalPage>
  );
}
