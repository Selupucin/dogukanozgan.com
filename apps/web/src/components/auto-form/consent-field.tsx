"use client";

// KVKK rıza alanı — MODAL + SCROLL "okudum" kapısı (docs/06 §2a).
//
// Davranış:
// - Rıza kutusu TIKLANABİLİR ama okunmadan İŞARETLENMEZ: kullanıcı metni MODAL'da açıp
//   EN ALTA kadar okumadan kutuya tıklarsa → kutu işaretlenmez, bunun yerine sözleşme
//   modal'ı açılır (kutu `disabled` DEĞİLDİR).
// - Modal içinde metin en alta kaydırılınca (veya metin kısaysa baştan) "Okudum ve
//   onaylıyorum" butonu aktifleşir; tıklanınca modal kapanır ve rıza işaretlenir.
// - Erişilebilir: role="dialog" + aria-modal, focus tuzağı, ESC ile kapatma, açılınca
//   odak modale, kapanınca tetikleyene döner, arka plan kaydırması kilitli.
// - İçerik TEK KAYNAKTAN gelir (components/legal/kvkk-content) — /kvkk ile aynı.
//
// Form alanlarından AYRI tutulur (definitions.ts). Değer RHF'e Controller ile bağlanır.

import { useCallback, useEffect, useId, useRef, useState } from "react";
import { type UseFormReturn, Controller } from "react-hook-form";
import { Check, X } from "lucide-react";
import { cn } from "@do/ui";

interface ConsentFieldProps {
  /** RHF alan adı (kvkkConsent / sensitiveConsent). */
  name: string;
  form: UseFormReturn<Record<string, unknown>>;
  /** Onay kutusu yanındaki kısa rıza ifadesi. */
  label: string;
  /** Modal başlığı. */
  modalTitle: string;
  /** Modal içeriği (TEK KAYNAK — kvkk-content). */
  children: React.ReactNode;
  /** "Okudum ve onaylıyorum" buton etiketi. */
  confirmLabel: string;
  /** Metni açma linki etiketi (rıza satırı içinde). */
  openLinkLabel: string;
  /** "Okumak için aşağı kaydırın" yardımcı metni. */
  scrollHint: string;
  /** Kapatma butonu erişilebilir etiketi. */
  closeLabel: string;
}

export function ConsentField({
  name,
  form,
  label,
  modalTitle,
  children,
  confirmLabel,
  openLinkLabel,
  scrollHint,
  closeLabel,
}: ConsentFieldProps) {
  const [open, setOpen] = useState(false);
  // Kullanıcı metni en alta kadar okudu mu (modal scroll kapısı).
  const [readToEnd, setReadToEnd] = useState(false);
  const error = form.formState.errors[name];
  const triggerRef = useRef<HTMLButtonElement>(null);

  return (
    <Controller
      name={name}
      control={form.control}
      defaultValue={false}
      render={({ field }) => {
        const checked = field.value === true;
        return (
          <div>
            <div className="flex items-start gap-3">
              {/* Onay kutusu — diğer form checkbox'larıyla TUTARLI şık stil (docs/03 #3,
                  docs/09): appearance-none, teal aksan, hafif yuvarlak köşe, görünür focus.
                  TIKLANABİLİR (disabled değil): okunmadan tıklanırsa işaretlenmez, sözleşme
                  modal'ı açılır; okunduysa normal işaretlenir. Tik (✔) checked iken görünür. */}
              <span className="relative mt-0.5 inline-flex shrink-0 items-center justify-center">
                <input
                  type="checkbox"
                  checked={checked}
                  aria-describedby={`${name}-hint`}
                  onClick={(e) => {
                    // Okunmadıysa: kutuyu işaretleme, bunun yerine modal'ı aç.
                    if (!readToEnd && !checked) {
                      e.preventDefault();
                      setOpen(true);
                    }
                  }}
                  onChange={(e) => {
                    // Okunmadan değişimi yok say (savunma); okunduysa RHF'e yaz.
                    if (!readToEnd && !checked) return;
                    field.onChange(e.target.checked);
                  }}
                  className={cn(
                    "peer h-5 w-5 shrink-0 cursor-pointer appearance-none rounded-md border-2 border-input bg-card transition-colors",
                    "checked:border-secondary checked:bg-secondary",
                    "focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 focus-visible:ring-offset-background",
                    "hover:border-secondary/70",
                  )}
                />
                <Check
                  className="pointer-events-none absolute h-3.5 w-3.5 text-white opacity-0 peer-checked:opacity-100"
                  strokeWidth={3}
                  aria-hidden
                />
              </span>
              <span className="text-sm text-muted-foreground">
                {label}{" "}
                <button
                  ref={triggerRef}
                  type="button"
                  onClick={() => setOpen(true)}
                  className="font-medium text-secondary underline underline-offset-2 hover:text-secondary/80 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
                >
                  {openLinkLabel}
                </button>
                <span className="text-primary"> *</span>
              </span>
            </div>

            <p id={`${name}-hint`} className="ml-8 mt-1 text-xs text-muted-foreground/80">
              {scrollHint}
            </p>

            {error && "message" in error && typeof error.message === "string" && (
              <p role="alert" className="ml-8 mt-1 text-xs font-medium text-destructive">
                {error.message}
              </p>
            )}

            {open && (
              <ConsentModal
                title={modalTitle}
                confirmLabel={confirmLabel}
                closeLabel={closeLabel}
                canConfirm={readToEnd}
                onReachEnd={() => setReadToEnd(true)}
                onConfirm={() => {
                  field.onChange(true);
                  setOpen(false);
                  triggerRef.current?.focus();
                }}
                onClose={() => {
                  setOpen(false);
                  triggerRef.current?.focus();
                }}
              >
                {children}
              </ConsentModal>
            )}
          </div>
        );
      }}
    />
  );
}

function ConsentModal({
  title,
  children,
  confirmLabel,
  closeLabel,
  canConfirm,
  onReachEnd,
  onConfirm,
  onClose,
}: {
  title: string;
  children: React.ReactNode;
  confirmLabel: string;
  closeLabel: string;
  canConfirm: boolean;
  onReachEnd: () => void;
  onConfirm: () => void;
  onClose: () => void;
}) {
  const titleId = useId();
  const dialogRef = useRef<HTMLDivElement>(null);
  const scrollRef = useRef<HTMLDivElement>(null);
  const confirmRef = useRef<HTMLButtonElement>(null);

  // Scroll en alta ulaştı mı? Kısa metinde (taşma yoksa) hemen "okundu" say (docs/06 §2a).
  const checkScrolled = useCallback(() => {
    const el = scrollRef.current;
    if (!el) return;
    const noOverflow = el.scrollHeight <= el.clientHeight + 4;
    const atBottom = el.scrollTop + el.clientHeight >= el.scrollHeight - 8;
    if (noOverflow || atBottom) onReachEnd();
  }, [onReachEnd]);

  // Açılışta: kısa metin kontrolü + body scroll kilidi + odak modale.
  useEffect(() => {
    checkScrolled();
    const prevOverflow = document.body.style.overflow;
    document.body.style.overflow = "hidden";
    // Odağı modale taşı (kapatma butonu).
    dialogRef.current?.focus();
    return () => {
      document.body.style.overflow = prevOverflow;
    };
  }, [checkScrolled]);

  // ESC ile kapatma + focus tuzağı (Tab döngüsü modal içinde kalsın).
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

  // canConfirm true olunca onay butonuna odaklan (klavye kullanıcısı için akış).
  useEffect(() => {
    if (canConfirm) confirmRef.current?.focus();
  }, [canConfirm]);

  return (
    <div
      // Overlay — tıklanınca kapanır (backdrop).
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
        className="flex max-h-[88vh] w-full max-w-2xl flex-col rounded-t-[var(--radius)] border border-border bg-card shadow-xl outline-none sm:rounded-[var(--radius)]"
      >
        <div className="flex items-center justify-between gap-4 border-b border-border px-6 py-4">
          <h2 id={titleId} className="font-heading text-xl text-foreground">
            {title}
          </h2>
          <button
            type="button"
            onClick={onClose}
            aria-label={closeLabel}
            className="inline-flex h-9 w-9 items-center justify-center rounded-full text-muted-foreground transition hover:bg-muted hover:text-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
          >
            <X className="h-5 w-5" aria-hidden />
          </button>
        </div>

        <div
          ref={scrollRef}
          onScroll={checkScrolled}
          className="prose prose-sm prose-neutral max-w-none overflow-y-auto px-6 py-5 text-foreground dark:prose-invert"
        >
          {children}
        </div>

        <div className="border-t border-border px-6 py-4">
          <button
            ref={confirmRef}
            type="button"
            disabled={!canConfirm}
            onClick={onConfirm}
            className={cn(
              "inline-flex w-full items-center justify-center gap-2 rounded-pill bg-primary px-6 py-3 text-sm font-bold text-primary-foreground transition hover:-translate-y-0.5 hover:bg-destructive focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 focus-visible:ring-offset-card",
              "disabled:translate-y-0 disabled:cursor-not-allowed disabled:opacity-50 disabled:hover:bg-primary",
            )}
          >
            <Check className="h-4 w-4" aria-hidden />
            {confirmLabel}
          </button>
        </div>
      </div>
    </div>
  );
}
