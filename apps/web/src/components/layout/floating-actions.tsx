// Sabit FAB (docs/09 madde 10): WhatsApp (her cihaz) + Ara (yalnız mobil).
// Sunucu bileşeni — yalnızca linkler.

import { getTranslations } from "next-intl/server";
import { Phone } from "lucide-react";
import { contact } from "@/lib/site";
import { TrackLink } from "@/components/track-link";

export async function FloatingActions() {
  const t = await getTranslations("common");
  const waText = encodeURIComponent(t("whatsappPrefill"));

  return (
    <div className="fixed bottom-4 right-4 z-40 flex flex-col gap-3">
      <TrackLink
        event="iletisim_arama"
        eventParams={{ kanal: "whatsapp" }}
        href={`https://wa.me/${contact.whatsapp}?text=${waText}`}
        target="_blank"
        rel="noopener noreferrer"
        aria-label={t("whatsappAria")}
        className="inline-flex h-14 w-14 items-center justify-center rounded-full bg-[#25d366] text-white shadow-lg transition hover:scale-105 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 focus-visible:ring-offset-background"
      >
        <svg viewBox="0 0 24 24" className="h-7 w-7" fill="currentColor" aria-hidden>
          <path d="M12 2a10 10 0 0 0-8.6 15l-1.3 4.7 4.8-1.3A10 10 0 1 0 12 2Zm5.8 14.1c-.2.7-1.4 1.3-2 1.4-.5.1-1.2.1-1.9-.1-.4-.1-1-.3-1.7-.6-3-1.3-4.9-4.3-5.1-4.5-.1-.2-1.2-1.5-1.2-2.9s.7-2 1-2.3c.2-.3.5-.4.7-.4h.5c.2 0 .4 0 .6.5l.8 1.9c.1.2.1.4 0 .5l-.3.5-.4.4c-.1.2-.3.3-.1.6.2.3.8 1.3 1.7 2.1 1.2 1 2.1 1.4 2.4 1.5.2.1.4.1.6-.1l.7-.9c.2-.2.4-.2.6-.1l1.9.9c.2.1.4.2.4.3.1.2.1.7-.1 1.1Z" />
        </svg>
      </TrackLink>
      <TrackLink
        event="iletisim_arama"
        eventParams={{ kanal: "telefon" }}
        href={`tel:${contact.phoneE164}`}
        aria-label={t("callAria")}
        className="inline-flex h-14 w-14 items-center justify-center rounded-full bg-destructive text-white shadow-lg transition hover:scale-105 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 focus-visible:ring-offset-background lg:hidden"
      >
        <Phone className="h-6 w-6" aria-hidden />
      </TrackLink>
    </div>
  );
}
