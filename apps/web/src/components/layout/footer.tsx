// Footer (docs/09 / docs/02): branşlar + kurumsal linkler + iletişim + harita +
// sosyal medya. Sunucu bileşeni.

import { getTranslations } from "next-intl/server";
import { Mail, MapPin, Phone } from "lucide-react";
import { Link } from "@/i18n/navigation";
import { InstagramIcon, LinkedinIcon, FacebookIcon } from "@/components/social-icons";
import { getAllProducts, getLocalizedSlug } from "@do/products";
import { routing } from "@/i18n/routing";
import { ShieldMark } from "@/components/wordmark";
import { contact, social, mapLinkUrl, brandName } from "@/lib/site";

type Locale = (typeof routing.locales)[number];

export async function Footer({ locale }: { locale: Locale }) {
  const t = await getTranslations("footer");
  const tc = await getTranslations("common");
  const products = getAllProducts();
  const year = new Date().getFullYear();

  const corporate = [
    { key: "about", href: "/hakkimda" },
    { key: "faq", href: "/sss" },
    { key: "contact", href: "/iletisim" },
    { key: "quoteStatus", href: "/teklif-durumu" },
    { key: "kvkk", href: "/kvkk" },
    { key: "privacy", href: "/gizlilik" },
    { key: "cookies", href: "/cerez-politikasi" },
  ] as const;

  return (
    <footer className="bg-[hsl(210_56%_8%)] text-[hsl(210_25%_70%)]">
      <div className="mx-auto max-w-6xl px-4 py-14 sm:px-6">
        <div className="grid grid-cols-1 gap-10 md:grid-cols-2 lg:grid-cols-[1.6fr_1fr_1fr_1.4fr]">
          {/* Marka + özet */}
          <div>
            <div className="flex items-center gap-2.5 text-white">
              <ShieldMark className="h-8 w-8" />
              <span className="font-heading text-lg font-semibold">{brandName}</span>
            </div>
            <p className="mt-4 max-w-xs text-sm leading-relaxed">{t("about")}</p>
            <div className="mt-5 flex gap-3">
              <SocialLink href={social.instagram} label={t("followOn", { network: "Instagram" })}>
                <InstagramIcon className="h-4 w-4" />
              </SocialLink>
              <SocialLink href={social.linkedin} label={t("followOn", { network: "LinkedIn" })}>
                <LinkedinIcon className="h-4 w-4" />
              </SocialLink>
              <SocialLink href={social.facebook} label={t("followOn", { network: "Facebook" })}>
                <FacebookIcon className="h-4 w-4" />
              </SocialLink>
            </div>
          </div>

          {/* Branşlar */}
          <nav aria-label={t("branches")}>
            <h2 className="mb-4 text-xs font-bold uppercase tracking-wider text-white">
              {t("branches")}
            </h2>
            <ul className="space-y-2.5 text-sm">
              {products.map((p) => (
                <li key={p.slug}>
                  <Link
                    href={{
                      pathname: "/planlar/[slug]",
                      params: { slug: getLocalizedSlug(p, locale) },
                    }}
                    className="transition hover:text-white"
                  >
                    {p.name[locale]}
                  </Link>
                </li>
              ))}
            </ul>
          </nav>

          {/* Kurumsal */}
          <nav aria-label={t("corporate")}>
            <h2 className="mb-4 text-xs font-bold uppercase tracking-wider text-white">
              {t("corporate")}
            </h2>
            <ul className="space-y-2.5 text-sm">
              {corporate.map((c) => (
                <li key={c.key}>
                  <Link href={c.href} className="transition hover:text-white">
                    {t(`links.${c.key}`)}
                  </Link>
                </li>
              ))}
            </ul>
          </nav>

          {/* İletişim + harita */}
          <div>
            <h2 className="mb-4 text-xs font-bold uppercase tracking-wider text-white">
              {tc("contact")}
            </h2>
            <ul className="space-y-3 text-sm">
              <li className="flex items-start gap-2.5">
                <Phone className="mt-0.5 h-4 w-4 shrink-0 text-primary" aria-hidden />
                <a href={`tel:${contact.phoneE164}`} className="transition hover:text-white">
                  {contact.phoneDisplay}
                </a>
              </li>
              <li className="flex items-start gap-2.5">
                <Mail className="mt-0.5 h-4 w-4 shrink-0 text-primary" aria-hidden />
                <a
                  href={`mailto:${contact.email}`}
                  className="break-all transition hover:text-white"
                >
                  {contact.email}
                </a>
              </li>
              <li className="flex items-start gap-2.5">
                <MapPin className="mt-0.5 h-4 w-4 shrink-0 text-primary" aria-hidden />
                <span>{contact.fullAddress}</span>
              </li>
            </ul>
            <a
              href={mapLinkUrl}
              target="_blank"
              rel="noopener noreferrer"
              className="mt-4 inline-flex items-center gap-2 rounded-lg border border-white/15 bg-white/5 px-3 py-2 text-xs font-semibold text-white transition hover:bg-white/10"
            >
              <MapPin className="h-3.5 w-3.5 text-primary" aria-hidden />
              {t("viewOnMap")}
            </a>
          </div>
        </div>

        <div className="mt-12 flex flex-col gap-2 border-t border-white/10 pt-6 text-xs sm:flex-row sm:items-center sm:justify-between">
          <span>
            © {year} {brandName}. {t("rights")}
          </span>
          <span className="text-[hsl(210_25%_55%)]">{t("agencyNote")}</span>
        </div>
      </div>
    </footer>
  );
}

function SocialLink({
  href,
  label,
  children,
}: {
  href: string;
  label: string;
  children: React.ReactNode;
}) {
  return (
    <a
      href={href}
      target="_blank"
      rel="noopener noreferrer"
      aria-label={label}
      className="inline-flex h-9 w-9 items-center justify-center rounded-full border border-white/15 bg-white/5 text-white transition hover:bg-primary hover:text-primary-foreground"
    >
      {children}
    </a>
  );
}
