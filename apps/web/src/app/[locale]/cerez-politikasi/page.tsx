// Çerez Politikası — /[locale]/cerez-politikasi. Kaynak: docs/06 §3 & §4, docs/02.
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
    title: t("cookies.title"),
    description: t("cookies.metaDescription"),
    alternates: localizedAlternates(locale as Locale, "/cerez-politikasi"),
  };
}

export default async function CookiePolicyPage({
  params,
}: {
  params: Promise<{ locale: string }>;
}) {
  const { locale } = await params;
  setRequestLocale(locale);
  const t = await getTranslations("legal");
  const loc = locale as Locale;

  return (
    <LegalPage title={t("cookies.title")}>{loc === "tr" ? <CookiesTr /> : <CookiesEn />}</LegalPage>
  );
}

function CookiesTr() {
  return (
    <>
      <p>
        Bu politika, sitemizde kullanılan çerezleri ve tercihlerinizi nasıl yönetebileceğinizi
        açıklar.
      </p>
      <h2>Çerez Türleri</h2>
      <ul>
        <li>
          <strong>Zorunlu çerezler:</strong> Sitenin çalışması için gereklidir; onay gerektirmez.
        </li>
        <li>
          <strong>Analitik/işlevsel çerezler:</strong> Yalnızca açık onayınızla çalışır.
        </li>
      </ul>
      <p>
        Site, çerez kullanmayan anonim performans ve trafik ölçümü (Vercel Analytics &amp; Speed
        Insights) kullanır. Bu ölçüm çerez yerleştirmez, kişisel veri toplamaz ve siteler arası
        takip yapmaz; bu nedenle onayınız olmadan çalışabilir.
      </p>
      <h2>Onay Yönetimi</h2>
      <p>
        İlk ziyarette gösterilen banner üzerinden tercihinizi belirleyebilirsiniz. Zorunlu olmayan
        çerezler onayınız alınmadan çalıştırılmaz.
      </p>
      <h2>Tercihinizi Değiştirme</h2>
      <p>Tarayıcı ayarlarınızdan çerezleri silebilir veya tekrar onay verebilirsiniz.</p>
    </>
  );
}

function CookiesEn() {
  return (
    <>
      <p>This policy explains the cookies used on our site and how to manage your preferences.</p>
      <h2>Cookie Types</h2>
      <ul>
        <li>
          <strong>Strictly necessary:</strong> Required for the site to function; no consent needed.
        </li>
        <li>
          <strong>Analytics/functional:</strong> Run only with your explicit consent.
        </li>
      </ul>
      <p>
        The site uses cookieless, anonymous performance and traffic measurement (Vercel Analytics
        &amp; Speed Insights). This measurement sets no cookies, collects no personal data and does
        no cross-site tracking; it may therefore run without your consent.
      </p>
      <h2>Consent Management</h2>
      <p>
        You can set your preference via the banner shown on your first visit. Non-essential cookies
        are not run without your consent.
      </p>
      <h2>Changing Your Preference</h2>
      <p>You can clear cookies via your browser settings or re-consent at any time.</p>
    </>
  );
}
