"use client";

// Tek bir form alanını render eden bileşen.
// Stil: docs/09 — yuvarlak girdiler, odakta teal halka (focus ring), erişilebilir.
// RHF register/Controller ile bağlanır.

import { useRef, useState } from "react";
import { type UseFormReturn, Controller } from "react-hook-form";
import { Check } from "lucide-react";
import { cn, Select, SelectTrigger, SelectValue, SelectContent, SelectItem } from "@do/ui";
import type { ProductField, Locale } from "./types-bridge";
import { CascadeField } from "./cascade-field";
import { CaptureGuideModal } from "./capture-guide-modal";
import { formatPhone, formatTc } from "@/lib/masks";

interface FieldProps {
  field: ProductField;
  locale: Locale;
  form: UseFormReturn<Record<string, unknown>>;
}

// Ortak girdi sınıfları (docs/09: yuvarlak, teal focus ring, dokunma hedefi ≥44px).
// Mobil: text-base (≥16px) iOS otomatik yakınlaştırmayı önler; min-h-[44px] dokunma hedefi.
const inputClass = cn(
  "w-full min-h-[44px] rounded-xl border border-input bg-card px-4 py-2.5 text-base text-foreground",
  "placeholder:text-muted-foreground/70",
  "focus:outline-none focus:ring-2 focus:ring-ring focus:ring-offset-1 focus:ring-offset-background",
  "transition-shadow",
);

// ── Şık custom checkbox (docs/09): çirkin kare kenarlık YOK; teal aksan, hafif yuvarlak
// köşe, görünür focus halkası, light+dark uyumlu. Gerçek <input> "peer" olarak gizlenir;
// görsel kutu peer durumlarını yansıtır. Tıklama alanı = kutu + METİN (w-fit). docs/03 #3.
function CheckboxControl({
  id,
  name,
  register,
  labelText,
  describedBy,
}: {
  id: string;
  name: string;
  register: UseFormReturn<Record<string, unknown>>["register"];
  labelText: string;
  describedBy?: string;
}) {
  return (
    <label htmlFor={id} className="group inline-flex w-fit cursor-pointer items-start gap-3 py-1.5">
      <span className="relative inline-flex shrink-0 items-center justify-center">
        <input
          id={id}
          type="checkbox"
          aria-describedby={describedBy}
          {...register(name)}
          className="peer sr-only"
        />
        <span
          aria-hidden
          className={cn(
            "flex h-5 w-5 items-center justify-center rounded-md border-2 border-input bg-card text-transparent transition-colors",
            "peer-checked:border-secondary peer-checked:bg-secondary peer-checked:text-white",
            "peer-focus-visible:ring-2 peer-focus-visible:ring-ring peer-focus-visible:ring-offset-2 peer-focus-visible:ring-offset-background",
            "group-hover:border-secondary/70",
          )}
        >
          <Check className="h-3.5 w-3.5" strokeWidth={3} />
        </span>
      </span>
      <span className="text-sm leading-snug text-foreground">{labelText}</span>
    </label>
  );
}

// ── Şık custom radio (docs/09): yuvarlak, teal/turuncu seçili durumu, görünür focus.
// Tıklama alanı seçenek pill'i (içeriğe göre); satırın boş kalanı tıklanmaz. docs/03 #3.
function RadioControl({
  name,
  options,
  locale,
  register,
}: {
  name: string;
  options: ProductField["options"];
  locale: Locale;
  register: UseFormReturn<Record<string, unknown>>["register"];
}) {
  return (
    <div role="radiogroup" className="flex flex-wrap gap-3 pt-1">
      {options?.map((o) => (
        <label
          key={o.value}
          className={cn(
            "group inline-flex w-fit cursor-pointer items-center gap-2.5 rounded-pill border border-input bg-card px-4 py-2 text-sm transition-colors",
            "hover:border-secondary/60 has-[:checked]:border-secondary has-[:checked]:bg-accent",
            "has-[:focus-visible]:ring-2 has-[:focus-visible]:ring-ring has-[:focus-visible]:ring-offset-1 has-[:focus-visible]:ring-offset-background",
          )}
        >
          <span className="relative inline-flex shrink-0 items-center justify-center">
            <input type="radio" value={o.value} {...register(name)} className="peer sr-only" />
            <span
              aria-hidden
              className={cn(
                "flex h-[18px] w-[18px] items-center justify-center rounded-full border-2 border-input bg-card transition-colors",
                "peer-checked:border-secondary group-hover:border-secondary/70",
              )}
            >
              <span className="h-2 w-2 rounded-full bg-secondary opacity-0 transition-opacity peer-checked:opacity-100" />
            </span>
          </span>
          <span className="text-foreground">{o.label[locale]}</span>
        </label>
      ))}
    </div>
  );
}

// ── Maskeli metin girdisi (telefon / TC). Controller ile kontrollü; her tuşta `format`
// uygulanır, böylece RHF değeri DAİMA biçimli/temiz kalır (docs/06 telefon/TC; docs/09).
function MaskedControl({
  name,
  control,
  id,
  type,
  inputMode,
  placeholder,
  describedBy,
  format,
  inputClass: cls,
}: {
  name: string;
  control: UseFormReturn<Record<string, unknown>>["control"];
  id: string;
  type: "tel" | "text";
  inputMode: "tel" | "numeric";
  placeholder?: string;
  describedBy?: string;
  format: (raw: string) => string;
  inputClass: string;
}) {
  return (
    <Controller
      name={name}
      control={control}
      render={({ field: rhf }) => (
        <input
          id={id}
          type={type}
          inputMode={inputMode}
          autoComplete={type === "tel" ? "tel" : "off"}
          placeholder={placeholder}
          aria-describedby={describedBy}
          value={(rhf.value as string) ?? ""}
          onChange={(e) => rhf.onChange(format(e.target.value))}
          onBlur={rhf.onBlur}
          className={cls}
        />
      )}
    />
  );
}

// ── Dosya yükleme girdisi. file: buton hover/efektli + cursor-pointer (docs/09 buton
// hover dili). captureGuide: true ise, butona basınca ÖNCE rehber modalı açılır; "Anladım"
// denince native dosya seçici tetiklenir. Bayrak yoksa normal dosya seçimi.
function FileControl({
  field,
  locale,
  id,
  describedBy,
  control,
  inputClass: cls,
}: {
  field: ProductField;
  locale: Locale;
  id: string;
  describedBy?: string;
  control: UseFormReturn<Record<string, unknown>>["control"];
  inputClass: string;
}) {
  const inputRef = useRef<HTMLInputElement>(null);
  const [guideOpen, setGuideOpen] = useState(false);

  // file: buton hover (teal/accent koyulaşma) + cursor-pointer + yumuşak geçiş (docs/09).
  const fileClass = cn(
    cls,
    "cursor-pointer transition-colors hover:border-secondary/60",
    "file:mr-3 file:cursor-pointer file:rounded-pill file:border-0 file:bg-accent file:px-3 file:py-1.5 file:text-sm file:font-medium file:text-accent-foreground file:transition-colors",
    "hover:file:bg-secondary hover:file:text-secondary-foreground",
  );

  return (
    <Controller
      name={field.name}
      control={control}
      render={({ field: rhf }) => (
        <>
          <input
            ref={inputRef}
            id={id}
            type="file"
            accept={field.validation?.accept}
            aria-describedby={describedBy}
            onChange={(e) => rhf.onChange(e.target.files?.[0])}
            onBlur={rhf.onBlur}
            // captureGuide: yükleme tetiklenince ÖNCE modalı aç; native seçiciyi engelle.
            onClick={
              field.captureGuide
                ? (e) => {
                    e.preventDefault();
                    setGuideOpen(true);
                  }
                : undefined
            }
            className={fileClass}
          />
          {guideOpen && (
            <CaptureGuideModal
              locale={locale}
              onClose={() => setGuideOpen(false)}
              onConfirm={() => {
                setGuideOpen(false);
                // Modal kapandıktan sonra native dosya seçiciyi aç.
                // requestAnimationFrame: DOM güncellenip overflow geri gelince tıkla.
                requestAnimationFrame(() => inputRef.current?.click());
              }}
            />
          )}
        </>
      )}
    />
  );
}

export function Field({ field, locale, form }: FieldProps) {
  const {
    register,
    control,
    formState: { errors },
  } = form;
  const error = errors[field.name];
  const labelText = field.label[locale];
  const placeholder = field.placeholder?.[locale];
  const help = field.help?.[locale];
  const id = `field-${field.name}`;
  const describedBy = help ? `${id}-help` : undefined;

  // Checkbox: etiket sağda; tıklama alanı = kutu + metin (w-fit), boş alan tıklanmaz.
  if (field.type === "checkbox") {
    return (
      <div className="flex flex-col gap-1">
        <CheckboxControl
          id={id}
          name={field.name}
          register={register}
          labelText={labelText}
          describedBy={describedBy}
        />
        {help && (
          <p id={describedBy} className="text-xs text-muted-foreground">
            {help}
          </p>
        )}
        {renderError(error)}
      </div>
    );
  }

  return (
    <div className="flex flex-col gap-1.5">
      <label htmlFor={id} className="text-sm font-medium text-foreground">
        {labelText}
        {field.required && <span className="text-primary"> *</span>}
      </label>

      {renderControl({
        field,
        locale,
        id,
        placeholder,
        describedBy,
        register,
        control,
        form,
        inputClass,
      })}

      {help && (
        <p id={describedBy} className="text-xs text-muted-foreground">
          {help}
        </p>
      )}
      {renderError(error)}
    </div>
  );
}

function renderControl({
  field,
  locale,
  id,
  placeholder,
  describedBy,
  register,
  control,
  form,
  inputClass: cls,
}: {
  field: ProductField;
  locale: Locale;
  id: string;
  placeholder?: string;
  describedBy?: string;
  register: UseFormReturn<Record<string, unknown>>["register"];
  control: UseFormReturn<Record<string, unknown>>["control"];
  form: UseFormReturn<Record<string, unknown>>;
  inputClass: string;
}) {
  switch (field.type) {
    // Zincirleme adres (docs/03): İl → İlçe → Mahalle.
    case "province":
    case "district":
    case "neighborhood":
      return (
        <CascadeField field={field} locale={locale} form={form} id={id} describedBy={describedBy} />
      );

    case "select":
      // Tema-uyumlu, erişilebilir @do/ui Select (K33). Radix kontrollü → Controller.
      return (
        <Controller
          name={field.name}
          control={control}
          render={({ field: rhf }) => (
            <Select value={(rhf.value as string) || undefined} onValueChange={rhf.onChange}>
              <SelectTrigger
                id={id}
                aria-describedby={describedBy}
                onBlur={rhf.onBlur}
                className="bg-card"
              >
                <SelectValue placeholder={locale === "tr" ? "Seçiniz" : "Select"} />
              </SelectTrigger>
              <SelectContent>
                {field.options?.map((o) => (
                  <SelectItem key={o.value} value={o.value}>
                    {o.label[locale]}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          )}
        />
      );

    case "radio":
      return (
        <RadioControl
          name={field.name}
          options={field.options}
          locale={locale}
          register={register}
        />
      );

    case "number":
      return (
        <input
          id={id}
          type="number"
          inputMode="numeric"
          placeholder={placeholder}
          aria-describedby={describedBy}
          {...register(field.name)}
          className={cls}
        />
      );

    case "date":
      return (
        <input
          id={id}
          type="date"
          aria-describedby={describedBy}
          {...register(field.name)}
          className={cls}
        />
      );

    case "file":
      // Dosya yükleme alanı — hover/efektli buton + (captureGuide ise) çekim rehberi modalı.
      return (
        <FileControl
          field={field}
          locale={locale}
          id={id}
          describedBy={describedBy}
          control={control}
          inputClass={cls}
        />
      );

    case "email":
      return (
        <input
          id={id}
          type="email"
          placeholder={placeholder}
          aria-describedby={describedBy}
          {...register(field.name)}
          className={cls}
        />
      );

    case "tel":
      // Canlı maske: 0 (5XX) XXX XX XX. Sadece rakam, fazla hane engellenir.
      return (
        <MaskedControl
          name={field.name}
          control={control}
          id={id}
          type="tel"
          inputMode="tel"
          placeholder={placeholder}
          describedBy={describedBy}
          format={formatPhone}
          inputClass={cls}
        />
      );

    case "tcKimlik":
      // 11 hane, sadece rakam, GRUPLAMA YOK (kullanıcı isteği), fazla hane engellenir.
      return (
        <MaskedControl
          name={field.name}
          control={control}
          id={id}
          type="text"
          inputMode="numeric"
          placeholder={placeholder}
          describedBy={describedBy}
          format={formatTc}
          inputClass={cls}
        />
      );

    case "text":
    case "plaka":
    default:
      return (
        <input
          id={id}
          type="text"
          placeholder={placeholder}
          aria-describedby={describedBy}
          {...register(field.name)}
          className={cls}
        />
      );
  }
}

function renderError(error: unknown): React.ReactNode {
  if (!error || typeof error !== "object" || !("message" in error)) return null;
  const message = (error as { message?: string }).message;
  if (!message) return null;
  return (
    <p role="alert" className="text-xs font-medium text-destructive">
      {message}
    </p>
  );
}
