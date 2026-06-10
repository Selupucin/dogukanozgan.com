// Üst bar (docs/09): güven mesajı + telefon + "Hasar anında" linki.
// Sunucu bileşeni (statik metin + iletişim sabitleri).

import { getTranslations } from "next-intl/server";
import { Phone, ShieldCheck, LifeBuoy } from "lucide-react";
import { contact } from "@/lib/site";
import { TrackLink } from "@/components/track-link";

export async function TopBar() {
  const t = await getTranslations("topbar");

  // "Hasar Anında" → doğrudan WhatsApp (hazır mesajla). docs/02 üst bar.
  const claimWaHref = `https://wa.me/${contact.whatsapp}?text=${encodeURIComponent(
    t("claimWhatsapp"),
  )}`;

  return (
    <div className="bg-foreground text-background/85">
      <div className="mx-auto flex h-[38px] max-w-6xl items-center justify-between gap-4 px-4 text-[0.8rem] font-medium sm:px-6">
        <span className="hidden items-center gap-2 sm:inline-flex">
          <ShieldCheck className="h-4 w-4 text-primary" aria-hidden />
          {t("trust")}
        </span>
        <span className="flex items-center gap-4">
          <TrackLink
            event="iletisim_arama"
            eventParams={{ kanal: "telefon" }}
            href={`tel:${contact.phoneE164}`}
            className="inline-flex items-center gap-1.5 transition hover:text-background"
          >
            <Phone className="h-3.5 w-3.5" aria-hidden />
            {contact.phoneDisplay}
          </TrackLink>
          <span aria-hidden className="text-background/30">
            ·
          </span>
          <TrackLink
            event="iletisim_arama"
            eventParams={{ kanal: "whatsapp" }}
            href={claimWaHref}
            target="_blank"
            rel="noopener noreferrer"
            className="inline-flex items-center gap-1.5 transition hover:text-background"
          >
            <LifeBuoy className="h-3.5 w-3.5" aria-hidden />
            {t("claim")}
          </TrackLink>
        </span>
      </div>
    </div>
  );
}
