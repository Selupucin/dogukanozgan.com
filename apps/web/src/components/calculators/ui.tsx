"use client";

// Hesaplayıcı ORTAK UI parçaları (kart kabuğu, sonuç kutusu, "Tahmini" uyarısı,
// girdi sarmalayıcıları). docs/09 stili: yuvarlak kart, teal/turuncu aksanlar,
// yumuşak gölge, teal focus ring, dokunma hedefi ≥44px.
//
// "Tahmini değerdir" uyarısı (EstimateNotice) docs/03 gereği ZORUNLU'dur ve her
// hesaplayıcı sonucunun yanında gösterilir.

import { useEffect, useState } from "react";
import { useTranslations } from "next-intl";
import { Calculator, Info, X } from "lucide-react";
import { cn } from "@do/ui";
import type { Locale } from "@/components/auto-form/types-bridge";

/** Hesaplayıcı kart kabuğu — başlık + ikon + giriş metni + içerik. */
export function CalculatorShell({
  titleKey,
  introKey,
  children,
}: {
  titleKey: string;
  introKey: string;
  children: React.ReactNode;
}) {
  const t = useTranslations("calculator");
  return (
    <section
      aria-labelledby="calculator-heading"
      className="rounded-[var(--radius)] border border-secondary/30 bg-accent/60 p-6 shadow-sm sm:p-8"
    >
      <div className="flex items-center gap-3">
        <span className="flex h-10 w-10 items-center justify-center rounded-xl bg-secondary text-secondary-foreground">
          <Calculator className="h-5 w-5" aria-hidden />
        </span>
        <h2 id="calculator-heading" className="font-heading text-2xl text-foreground">
          {t(titleKey)}
        </h2>
      </div>
      <p className="mt-3 text-sm text-accent-foreground/80">{t(introKey)}</p>
      <div className="mt-6">{children}</div>
    </section>
  );
}

/** Etiketli sayısal/aralıklı girdi sarmalayıcısı. */
export function InputRow({
  id,
  label,
  children,
}: {
  id: string;
  label: string;
  children: React.ReactNode;
}) {
  return (
    <div className="flex flex-col gap-1.5">
      <label htmlFor={id} className="text-sm font-medium text-foreground">
        {label}
      </label>
      {children}
    </div>
  );
}

// Mobil-dostu girdi: ≥16px font (iOS zoom önler), ≥44px dokunma hedefi (docs/09).
export const numberInputClass = cn(
  "w-full min-h-[44px] rounded-xl border border-input bg-card px-4 py-2.5 text-base text-foreground",
  "placeholder:text-muted-foreground/70",
  "focus:outline-none focus:ring-2 focus:ring-ring focus:ring-offset-1 focus:ring-offset-background",
  "transition-shadow",
);

/**
 * Mobil-dostu sayısal girdi (docs/09 erişilebilirlik).
 * - Değer STRING olarak tutulur → kullanıcı alanı tamamen SİLEBİLİR (mobil bug çözümü:
 *   number state + Number("") kombinasyonu alanı temizlenemez yapıyordu).
 * - inputMode ile mobil sayısal klavye; ≥16px font, ≥44px dokunma hedefi.
 * - Dolu iken sağda "×" temizleme butonu (parmakla kolay temizleme).
 * - Boş/geçersiz değer üst bileşene fallback (varsayılan) olarak iletilir.
 */
export function NumberField({
  id,
  value,
  onChange,
  fallback,
  min,
  max,
  step,
  decimal,
  clearLabel,
}: {
  id: string;
  value: number;
  onChange: (next: number) => void;
  /** Alan boş bırakılırsa hesap için kullanılacak değer. */
  fallback: number;
  min?: number;
  max?: number;
  step?: number;
  /** true ise inputMode="decimal" (ondalık), değilse "numeric". */
  decimal?: boolean;
  /** "×" butonu için erişilebilir etiket. */
  clearLabel: string;
}) {
  // İçeride STRING state tutulur → kullanıcı alanı tamamen boşaltıp yeniden yazabilir
  // (mobilde "silinemiyor" hatasının kök sebebi: number state'i boş bırakılamıyordu).
  // Hesaba boş değer gitmesin diye, boş iken üst bileşene `fallback` iletilir; ancak
  // input görsel olarak BOŞ kalır (kullanıcı yazmaya devam edebilir).
  const [text, setText] = useState<string>(String(value));

  // Dışarıdan gelen değer (ör. "bu değerlerle teklif al" / temizleme) input ile
  // uyuşmuyorsa senkronize et. Kullanıcı boş bıraktıysa (text === "") ezme.
  useEffect(() => {
    if (text === "") return;
    if (Number(text.replace(",", ".")) !== value) setText(String(value));
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [value]);

  return (
    <div className="relative">
      <input
        id={id}
        type="text"
        inputMode={decimal ? "decimal" : "numeric"}
        pattern={decimal ? "[0-9]*[.,]?[0-9]*" : "[0-9]*"}
        value={text}
        onChange={(e) => {
          const raw = e.target.value;
          setText(raw);
          const cleaned = raw.replace(",", ".").trim();
          if (cleaned === "") {
            onChange(fallback);
            return;
          }
          const n = Number(cleaned);
          if (!Number.isNaN(n)) onChange(n);
        }}
        min={min}
        max={max}
        step={step}
        className={cn(numberInputClass, "pr-11")}
      />
      {text !== "" && (
        <button
          type="button"
          aria-label={clearLabel}
          onClick={() => {
            setText("");
            onChange(fallback);
          }}
          className="absolute right-1.5 top-1/2 flex h-9 w-9 -translate-y-1/2 items-center justify-center rounded-lg text-muted-foreground transition hover:bg-muted hover:text-foreground focus:outline-none focus-visible:ring-2 focus-visible:ring-ring"
        >
          <X className="h-4 w-4" aria-hidden />
        </button>
      )}
    </div>
  );
}

/** Tek bir vurgulu sonuç satırı (büyük rakam). */
export function ResultStat({
  label,
  value,
  accent,
}: {
  label: string;
  value: string;
  accent?: "teal" | "orange";
}) {
  return (
    <div className="rounded-xl border border-border bg-card px-4 py-3">
      <div className="text-xs text-muted-foreground">{label}</div>
      <div
        className={cn(
          "mt-1 font-heading text-xl font-semibold tabular-nums sm:text-2xl",
          accent === "orange" && "text-primary",
          accent === "teal" && "text-secondary",
          !accent && "text-foreground",
        )}
      >
        {value}
      </div>
    </div>
  );
}

/**
 * docs/03 ZORUNLU "Tahmini değerdir" uyarısı.
 * Sonucun hemen yanında, görsel olarak BELİRGİN (çerçeveli) gösterilir.
 */
export function EstimateNotice() {
  const t = useTranslations("calculator");
  return (
    <p
      role="note"
      className="mt-5 flex items-start gap-2 rounded-xl border border-secondary/40 bg-secondary/10 p-3 text-xs text-accent-foreground/90"
    >
      <Info className="mt-0.5 h-4 w-4 shrink-0 text-secondary" aria-hidden />
      <span>
        <strong className="font-semibold text-foreground">{t("estimateNoticeStrong")}</strong>{" "}
        {t("estimateNotice")}
      </span>
    </p>
  );
}

/** TL para biçimi (yer tutucu sonuçlar için). */
export function formatTRY(value: number, locale: Locale): string {
  return new Intl.NumberFormat(locale === "tr" ? "tr-TR" : "en-US", {
    style: "currency",
    currency: "TRY",
    maximumFractionDigits: 0,
  }).format(value);
}

/** "min – max TL" aralık biçimi. */
export function formatRangeTRY(min: number, max: number, locale: Locale): string {
  return `${formatTRY(min, locale)} – ${formatTRY(max, locale)}`;
}
