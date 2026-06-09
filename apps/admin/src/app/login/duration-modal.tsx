"use client";

// Oturum süresi seçim modalı — "Bu cihazda beni hatırla" işaretlenince açılır.
// docs/05 §1 (oturum süresi: 1 ay / 6 ay / 1 yıl / her zaman) + docs/09 (form/dialog dili).
//
// Erişilebilirlik (delete-confirm-modal deseniyle aynı): role="dialog" + aria-modal,
// focus tuzağı, ESC ile kapatma, açılınca odak ilk seçeneğe, kapanınca tetikleyene döner,
// arka plan kaydırması kilitli. Backdrop tıklaması = Vazgeç.
//
// Seçilen değer ("1m" | "6m" | "1y" | "forever") startLogin'in okuduğu `duration` ile
// birebir uyumludur; üst bileşen bunu gizli alanda tutar.

import { useEffect, useId, useRef, useState } from "react";
import { Clock, X } from "lucide-react";
import { cn } from "@do/ui";
import { buttonClass } from "@/components/ui";
import type { SessionDuration } from "@/lib/login-crypto";

/** Seçenek listesi — değerler startLogin'in beklediği SessionDuration ile aynı. */
export const DURATION_OPTIONS: { value: SessionDuration; label: string; hint: string }[] = [
  { value: "1m", label: "1 ay", hint: "Bu cihazda 1 ay boyunca tekrar giriş istenmez." },
  { value: "6m", label: "6 ay", hint: "Bu cihazda 6 ay boyunca tekrar giriş istenmez." },
  { value: "1y", label: "1 yıl", hint: "Bu cihazda 1 yıl boyunca tekrar giriş istenmez." },
  {
    value: "forever",
    label: "Her zaman",
    hint: "Siz çıkış yapana kadar bu cihazda tekrar giriş istenmez.",
  },
];

/** Değerden okunabilir etiket (form özeti için). */
export function durationLabel(value: SessionDuration): string {
  return DURATION_OPTIONS.find((o) => o.value === value)?.label ?? value;
}

interface DurationModalProps {
  /** Modal açılırken seçili gelecek değer (varsayılan / önceki seçim). */
  initialValue: SessionDuration;
  /** "Onayla" → seçilen süreyle çağrılır. */
  onConfirm: (value: SessionDuration) => void;
  /** "Vazgeç" / X / ESC / backdrop → seçim yapılmadan kapat. */
  onCancel: () => void;
}

export function DurationModal({ initialValue, onConfirm, onCancel }: DurationModalProps) {
  const titleId = useId();
  const descId = useId();
  const groupName = useId();
  const dialogRef = useRef<HTMLDivElement>(null);
  const firstOptionRef = useRef<HTMLInputElement>(null);

  const [selected, setSelected] = useState<SessionDuration>(initialValue);

  // Açılışta: body scroll kilidi + odak ilk seçeneğe.
  useEffect(() => {
    const prevOverflow = document.body.style.overflow;
    document.body.style.overflow = "hidden";
    firstOptionRef.current?.focus();
    return () => {
      document.body.style.overflow = prevOverflow;
    };
  }, []);

  // ESC ile kapatma + focus tuzağı (delete-confirm-modal ile aynı desen).
  function onKeyDown(e: React.KeyboardEvent) {
    if (e.key === "Escape") {
      e.stopPropagation();
      onCancel();
      return;
    }
    if (e.key !== "Tab") return;
    const root = dialogRef.current;
    if (!root) return;
    const focusables = root.querySelectorAll<HTMLElement>(
      'a[href], button:not([disabled]), textarea, input:not([type="radio"]), select, [tabindex]:not([tabindex="-1"]), input[type="radio"]:checked, input[type="radio"][tabindex="0"]',
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
        if (e.target === e.currentTarget) onCancel();
      }}
      onKeyDown={onKeyDown}
    >
      <div
        ref={dialogRef}
        role="dialog"
        aria-modal="true"
        aria-labelledby={titleId}
        aria-describedby={descId}
        tabIndex={-1}
        className="flex max-h-[88vh] w-full max-w-md flex-col rounded-t-[var(--radius)] border border-border bg-card shadow-xl outline-none sm:rounded-[var(--radius)]"
      >
        {/* Başlık */}
        <div className="flex items-center justify-between gap-4 border-b border-border px-6 py-4">
          <h2 id={titleId} className="flex items-center gap-2 font-heading text-lg text-foreground">
            <Clock className="h-5 w-5 text-primary" aria-hidden />
            Oturum ne kadar açık kalsın?
          </h2>
          <button
            type="button"
            onClick={onCancel}
            aria-label="Kapat"
            className="inline-flex h-9 w-9 items-center justify-center rounded-full text-muted-foreground transition hover:bg-muted hover:text-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
          >
            <X className="h-5 w-5" aria-hidden />
          </button>
        </div>

        {/* İçerik — tıklanabilir radyo kartları */}
        <div className="flex flex-col gap-3 overflow-y-auto px-6 py-5">
          <p id={descId} className="text-sm text-muted-foreground">
            Seçtiğiniz süre boyunca bu cihazda tekrar giriş istenmez.
          </p>

          <div role="radiogroup" aria-labelledby={titleId} className="flex flex-col gap-2.5">
            {DURATION_OPTIONS.map((opt, i) => {
              const isSelected = selected === opt.value;
              return (
                <label
                  key={opt.value}
                  className={cn(
                    "flex min-h-[44px] cursor-pointer items-start gap-3 rounded-xl border px-4 py-3 transition-colors",
                    "focus-within:ring-2 focus-within:ring-ring focus-within:ring-offset-1 focus-within:ring-offset-background",
                    isSelected
                      ? "border-primary bg-primary/5"
                      : "border-input hover:border-primary/50 hover:bg-muted/40",
                  )}
                >
                  <input
                    ref={i === 0 ? firstOptionRef : undefined}
                    type="radio"
                    name={groupName}
                    value={opt.value}
                    checked={isSelected}
                    onChange={() => setSelected(opt.value)}
                    className="mt-0.5 h-4 w-4 shrink-0 border-input text-primary focus:ring-2 focus:ring-ring"
                  />
                  <span className="flex flex-col gap-0.5">
                    <span className="text-sm font-medium text-foreground">{opt.label}</span>
                    <span className="text-xs text-muted-foreground">{opt.hint}</span>
                  </span>
                </label>
              );
            })}
          </div>
        </div>

        {/* Aksiyonlar */}
        <div className="flex items-center justify-end gap-2 border-t border-border px-6 py-4">
          <button type="button" onClick={onCancel} className={buttonClass("outline", "sm")}>
            Vazgeç
          </button>
          <button
            type="button"
            onClick={() => onConfirm(selected)}
            className={buttonClass("primary", "sm")}
          >
            Onayla
          </button>
        </div>
      </div>
    </div>
  );
}
