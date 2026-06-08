// Gizlilik Politikası — /[locale]/gizlilik. Kaynak: docs/06 §4, docs/02.
// ✅ İçerik hukukçu onayı alınmıştır (2026-06-08).

import type { Metadata } from "next";
import { setRequestLocale, getTranslations } from "next-intl/server";
import { routing } from "@/i18n/routing";
import { localizedAlternates } from "@/lib/seo";
import { LegalPage } from "@/components/legal-page";

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
    title: t("privacy.title"),
    description: t("privacy.metaDescription"),
    alternates: localizedAlternates(locale as Locale, "/gizlilik"),
  };
}

export default async function PrivacyPage({ params }: { params: Promise<{ locale: string }> }) {
  const { locale } = await params;
  setRequestLocale(locale);
  const t = await getTranslations("legal");
  const loc = locale as Locale;

  return (
    <LegalPage title={t("privacy.title")}>{loc === "tr" ? <PrivacyTr /> : <PrivacyEn />}</LegalPage>
  );
}

function PrivacyTr() {
  return (
    <>
      <p>
        Bu Gizlilik Politikası, kişisel verilerinizin nasıl toplandığını, kullanıldığını ve
        korunduğunu açıklar.
      </p>
      <h2>Topladığımız Veriler</h2>
      <p>
        Form aracılığıyla verdiğiniz iletişim ve sigorta bilgileri ile otomatik teknik veriler (IP,
        çerez).
      </p>
      <h2>Kullanım Amaçları</h2>
      <p>Teklif sunmak, sizinle iletişime geçmek ve hizmeti iyileştirmek.</p>
      <h2>Güvenlik</h2>
      <p>Veriler HTTPS ile iletilir; özel nitelikli veriler erişimi kısıtlı şekilde saklanır.</p>
      <h2>Üçüncü Taraflar</h2>
      <p>Teklif amacıyla yalnızca yetkili sigorta şirketleriyle paylaşım yapılabilir.</p>
      <h2>İletişim</h2>
      <p>Sorularınız için veri sorumlusunun iletişim kanallarını kullanabilirsiniz.</p>
    </>
  );
}

function PrivacyEn() {
  return (
    <>
      <p>This Privacy Policy explains how your personal data is collected, used and protected.</p>
      <h2>Data We Collect</h2>
      <p>
        Contact and insurance details you provide via forms, plus automatic technical data (IP,
        cookies).
      </p>
      <h2>Purposes</h2>
      <p>To provide quotes, contact you, and improve the service.</p>
      <h2>Security</h2>
      <p>Data is transmitted over HTTPS; special-category data is stored with restricted access.</p>
      <h2>Third Parties</h2>
      <p>Data may be shared only with authorized insurance companies for quoting purposes.</p>
      <h2>Contact</h2>
      <p>For questions, please use the data controller&apos;s contact channels.</p>
    </>
  );
}
