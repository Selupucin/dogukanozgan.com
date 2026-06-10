"use client";

// İzlenen <a> linki — tıklanınca GA4 olayı gönderir, sonra normal gezinme devam eder.
// Sunucu bileşenlerindeki (header/footer/iletişim/hero/FAB) WhatsApp & telefon (tel:)
// linklerini sarmalamak için kullanılır: link davranışı AYNEN korunur (href/target/rel
// vb. props olarak geçer), yalnızca onClick'te track() tetiklenir. KVKK: track() yalnız
// çerez onayı sonrası gtag yüklüyken çalışır → onaysız no-op (bkz. lib/track.ts).

import type { AnchorHTMLAttributes } from "react";
import { track } from "@/lib/track";

type TrackLinkProps = AnchorHTMLAttributes<HTMLAnchorElement> & {
  /** Gönderilecek GA4 olay adı (ör. "iletisim_arama"). */
  event: string;
  /** Olay parametreleri (ör. { kanal: "whatsapp" }). */
  eventParams?: Record<string, unknown>;
};

export function TrackLink({ event, eventParams, onClick, children, ...props }: TrackLinkProps) {
  return (
    <a
      {...props}
      onClick={(e) => {
        track(event, eventParams);
        onClick?.(e);
      }}
    >
      {children}
    </a>
  );
}
