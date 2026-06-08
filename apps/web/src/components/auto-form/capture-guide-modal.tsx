"use client";

// Ruhsat/araç fotoğrafı ÇEKİM REHBERİ modalı (docs/03 §1/§6, docs/09 kart/gölge dili).
//
// Davranış (field.tsx file alanından tetiklenir, captureGuide: true ise):
// - Kullanıcı yükleme butonuna basınca ÖNCE bu modal açılır.
// - İçinde GERÇEK fotoğraf değil, temaya uygun (lacivert/teal/turuncu) ince çizgi bir SVG
//   illüstrasyon + "Yapın / Yapmayın" ipuçları gösterilir.
// - "Anladım" → modal kapanır ve çağıran native dosya seçiciyi açar.
//
// Erişilebilirlik: role="dialog" + aria-modal, focus tuzağı, ESC ile kapatma, açılınca
// odak modale, kapanınca tetikleyene döner, arka plan kaydırması kilitli. (ConsentModal
// ile aynı desen — tutarlılık.)

import { useEffect, useId, useRef } from "react";
import { Check, X, Camera } from "lucide-react";
import { cn } from "@do/ui";
import type { Locale } from "./types-bridge";

interface CaptureGuideModalProps {
  locale: Locale;
  /** "Anladım" → kapan + dosya seçiciyi aç. */
  onConfirm: () => void;
  /** Sadece kapat (X / ESC / backdrop) — dosya seçici AÇILMAZ. */
  onClose: () => void;
}

const TXT = {
  tr: {
    title: "Ruhsatınızı nasıl çekmelisiniz?",
    intro: "Net bir fotoğraf, teklifinizi daha hızlı ve doğru hazırlamamızı sağlar.",
    doTitle: "Yapın",
    dontTitle: "Yapmayın",
    dos: [
      "Ruhsatı düz bir zemine koyun, tüm köşeler kadraja girsin.",
      "İyi ışıkta, dengeli ve gölgesiz çekin.",
      "Yazılar net ve okunur olsun (bulanık olmasın).",
    ],
    donts: [
      "Parlama / flaş yansıması olmasın.",
      "Köşeler kesik veya eğri olmasın.",
      "Karanlık, bulanık veya çok uzaktan çekmeyin.",
    ],
    confirm: "Anladım, fotoğrafı seç",
    close: "Kapat",
  },
  en: {
    title: "How to photograph your registration",
    intro: "A clear photo helps us prepare your quote faster and more accurately.",
    doTitle: "Do",
    dontTitle: "Don't",
    dos: [
      "Place it on a flat surface; keep all corners in frame.",
      "Use good, even lighting with no shadows.",
      "Make sure the text is sharp and readable (not blurry).",
    ],
    donts: [
      "Avoid glare / flash reflections.",
      "Don't cut off or tilt the corners.",
      "Don't shoot in the dark, blurry or from too far.",
    ],
    confirm: "Got it, choose photo",
    close: "Close",
  },
} as const;

/** Temaya uygun ince çizgi ruhsat illüstrasyonu (gerçek fotoğraf DEĞİL). */
function RegistrationIllustration() {
  return (
    <svg viewBox="0 0 200 130" role="img" aria-hidden className="h-auto w-full max-w-[260px]">
      {/* Kadraj köşe işaretleri (turuncu) */}
      <g stroke="hsl(var(--primary))" strokeWidth="2.5" fill="none" strokeLinecap="round">
        <path d="M10 28 V12 H26" />
        <path d="M174 12 H190 V28" />
        <path d="M190 102 V118 H174" />
        <path d="M26 118 H10 V102" />
      </g>
      {/* Ruhsat kartı */}
      <rect
        x="34"
        y="30"
        width="132"
        height="70"
        rx="8"
        fill="hsl(var(--card))"
        stroke="hsl(var(--secondary))"
        strokeWidth="2"
      />
      {/* Fotoğraf alanı (lacivert) */}
      <rect
        x="42"
        y="40"
        width="34"
        height="42"
        rx="4"
        fill="hsl(var(--primary) / 0.12)"
        stroke="hsl(var(--primary))"
        strokeWidth="1.5"
      />
      <circle cx="59" cy="54" r="6" fill="none" stroke="hsl(var(--primary))" strokeWidth="1.5" />
      <path d="M48 78 q11 -14 22 0" fill="none" stroke="hsl(var(--primary))" strokeWidth="1.5" />
      {/* Metin satırları (teal) */}
      <g stroke="hsl(var(--secondary))" strokeWidth="3" strokeLinecap="round">
        <line x1="86" y1="46" x2="156" y2="46" />
        <line x1="86" y1="56" x2="148" y2="56" />
        <line x1="86" y1="66" x2="156" y2="66" />
        <line x1="86" y1="76" x2="132" y2="76" />
      </g>
    </svg>
  );
}

export function CaptureGuideModal({ locale, onConfirm, onClose }: CaptureGuideModalProps) {
  const t = TXT[locale];
  const titleId = useId();
  const dialogRef = useRef<HTMLDivElement>(null);
  const confirmRef = useRef<HTMLButtonElement>(null);

  // Açılışta: body scroll kilidi + odak onay butonuna.
  useEffect(() => {
    const prevOverflow = document.body.style.overflow;
    document.body.style.overflow = "hidden";
    confirmRef.current?.focus();
    return () => {
      document.body.style.overflow = prevOverflow;
    };
  }, []);

  // ESC ile kapatma + focus tuzağı.
  function onKeyDown(e: React.KeyboardEvent) {
    if (e.key === "Escape") {
      e.stopPropagation();
      onClose();
      return;
    }
    if (e.key !== "Tab") return;
    const root = dialogRef.current;
    if (!root) return;
    const focusables = root.querySelectorAll<HTMLElement>(
      'a[href], button:not([disabled]), textarea, input, select, [tabindex]:not([tabindex="-1"])',
    );
    if (focusables.length === 0) return;
    const first = focusables[0]!;
    const last = focusables[focusables.length - 1]!;
    const active = document.activeElement;
    if (e.shiftKey && active === first) {
      e.preventDefault();
      last.focus();
    } else if (!e.shiftKey && active === last) {
      e.preventDefault();
      first.focus();
    }
  }

  return (
    <div
      className="fixed inset-0 z-[100] flex items-end justify-center bg-foreground/50 p-0 backdrop-blur-sm sm:items-center sm:p-6"
      onMouseDown={(e) => {
        if (e.target === e.currentTarget) onClose();
      }}
      onKeyDown={onKeyDown}
    >
      <div
        ref={dialogRef}
        role="dialog"
        aria-modal="true"
        aria-labelledby={titleId}
        tabIndex={-1}
        className="flex max-h-[88vh] w-full max-w-lg flex-col rounded-t-[var(--radius)] border border-border bg-card shadow-xl outline-none sm:rounded-[var(--radius)]"
      >
        <div className="flex items-center justify-between gap-4 border-b border-border px-6 py-4">
          <h2 id={titleId} className="flex items-center gap-2 font-heading text-xl text-foreground">
            <Camera className="h-5 w-5 text-secondary" aria-hidden />
            {t.title}
          </h2>
          <button
            type="button"
            onClick={onClose}
            aria-label={t.close}
            className="inline-flex h-9 w-9 items-center justify-center rounded-full text-muted-foreground transition hover:bg-muted hover:text-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
          >
            <X className="h-5 w-5" aria-hidden />
          </button>
        </div>

        <div className="overflow-y-auto px-6 py-5">
          <p className="text-sm text-muted-foreground">{t.intro}</p>

          <div className="mt-4 flex justify-center rounded-xl border border-secondary/30 bg-accent/50 p-4">
            <RegistrationIllustration />
          </div>

          <div className="mt-5 grid gap-4 sm:grid-cols-2">
            {/* Yapın */}
            <div className="rounded-xl border border-secondary/30 bg-secondary/5 p-4">
              <h3 className="flex items-center gap-2 text-sm font-semibold text-foreground">
                <span className="flex h-5 w-5 items-center justify-center rounded-full bg-secondary text-white">
                  <Check className="h-3 w-3" strokeWidth={3} aria-hidden />
                </span>
                {t.doTitle}
              </h3>
              <ul className="mt-2 space-y-1.5 text-xs text-muted-foreground">
                {t.dos.map((d) => (
                  <li key={d} className="flex items-start gap-1.5">
                    <Check className="mt-0.5 h-3.5 w-3.5 shrink-0 text-secondary" aria-hidden />
                    <span>{d}</span>
                  </li>
                ))}
              </ul>
            </div>
            {/* Yapmayın */}
            <div className="rounded-xl border border-destructive/30 bg-destructive/5 p-4">
              <h3 className="flex items-center gap-2 text-sm font-semibold text-foreground">
                <span className="flex h-5 w-5 items-center justify-center rounded-full bg-destructive text-white">
                  <X className="h-3 w-3" strokeWidth={3} aria-hidden />
                </span>
                {t.dontTitle}
              </h3>
              <ul className="mt-2 space-y-1.5 text-xs text-muted-foreground">
                {t.donts.map((d) => (
                  <li key={d} className="flex items-start gap-1.5">
                    <X className="mt-0.5 h-3.5 w-3.5 shrink-0 text-destructive" aria-hidden />
                    <span>{d}</span>
                  </li>
                ))}
              </ul>
            </div>
          </div>
        </div>

        <div className="border-t border-border px-6 py-4">
          <button
            ref={confirmRef}
            type="button"
            onClick={onConfirm}
            className={cn(
              "inline-flex w-full items-center justify-center gap-2 rounded-pill bg-primary px-6 py-3 text-sm font-bold text-primary-foreground transition",
              "hover:-translate-y-0.5 hover:bg-destructive focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 focus-visible:ring-offset-card",
            )}
          >
            <Camera className="h-4 w-4" aria-hidden />
            {t.confirm}
          </button>
        </div>
      </div>
    </div>
  );
}
