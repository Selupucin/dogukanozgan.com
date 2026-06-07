"use client";

// Tek bir form alanını render eden bileşen.
// Stil: docs/09 — yuvarlak girdiler, odakta teal halka (focus ring), erişilebilir.
// RHF register/Controller ile bağlanır.

import { type UseFormReturn, Controller } from "react-hook-form";
import { cn } from "@do/ui";
import type { ProductField, Locale } from "./types-bridge";

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

  // Checkbox: etiket sağda, satır içi.
  if (field.type === "checkbox") {
    return (
      <label htmlFor={id} className="flex min-h-[44px] items-start gap-3 py-1.5">
        <input
          id={id}
          type="checkbox"
          {...register(field.name)}
          className="mt-0.5 h-5 w-5 shrink-0 rounded-md border-input text-primary focus:ring-2 focus:ring-ring"
        />
        <span className="text-sm text-foreground">
          {labelText}
          {field.required && <span className="text-primary"> *</span>}
        </span>
        {renderError(error)}
      </label>
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
  inputClass: cls,
}: {
  field: ProductField;
  locale: Locale;
  id: string;
  placeholder?: string;
  describedBy?: string;
  register: UseFormReturn<Record<string, unknown>>["register"];
  control: UseFormReturn<Record<string, unknown>>["control"];
  inputClass: string;
}) {
  switch (field.type) {
    case "select":
      return (
        <select id={id} aria-describedby={describedBy} {...register(field.name)} className={cls}>
          <option value="">{locale === "tr" ? "Seçiniz" : "Select"}</option>
          {field.options?.map((o) => (
            <option key={o.value} value={o.value}>
              {o.label[locale]}
            </option>
          ))}
        </select>
      );

    case "radio":
      return (
        <div role="radiogroup" className="flex flex-wrap gap-3 pt-1">
          {field.options?.map((o) => (
            <label
              key={o.value}
              className="flex min-h-[44px] items-center gap-2 rounded-pill border border-input bg-card px-4 py-2 text-sm has-[:checked]:border-secondary has-[:checked]:bg-accent"
            >
              <input
                type="radio"
                value={o.value}
                {...register(field.name)}
                className="h-4 w-4 text-secondary focus:ring-2 focus:ring-ring"
              />
              {o.label[locale]}
            </label>
          ))}
        </div>
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
      // Aşama 1: dosya yalnızca seçilir/validasyondan geçer; YÜKLENMEZ.
      // TODO(doc): Aşama 2 — Supabase Storage upload bağlanacak (trafik ruhsat foto).
      return (
        <Controller
          name={field.name}
          control={control}
          render={({ field: rhf }) => (
            <input
              id={id}
              type="file"
              accept={field.validation?.accept}
              aria-describedby={describedBy}
              onChange={(e) => rhf.onChange(e.target.files?.[0])}
              onBlur={rhf.onBlur}
              className={cn(
                cls,
                "file:mr-3 file:rounded-pill file:border-0 file:bg-accent file:px-3 file:py-1 file:text-sm file:text-accent-foreground",
              )}
            />
          )}
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
      return (
        <input
          id={id}
          type="tel"
          placeholder={placeholder}
          aria-describedby={describedBy}
          {...register(field.name)}
          className={cls}
        />
      );

    case "text":
    case "tcKimlik":
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
