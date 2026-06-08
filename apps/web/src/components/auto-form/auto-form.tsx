"use client";

// AutoForm — ürün tanımından (definitions.ts) OTOMATİK üretilen teklif formu.
// Kaynak: docs/01 (RHF + Zod), docs/03 (ortak alanlar + KVKK rıza), docs/09 (stil).
//
// Aşama 2: Form artık GERÇEK gönderim yapar. İstemcide Zod ile ön-doğrulama yapılır,
// ardından `submitQuoteRequest` Server Action'ı çağrılır (FormData ile — dosyalar
// dahil). Sunucu AYNI şema ile yeniden doğrular, KVKK rıza kanıtını kaydeder ve
// dosyaları Supabase private bucket'a yükler. Bkz. apps/web/src/lib/submit-quote.ts.

import { useState } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { useTranslations } from "next-intl";
import { AlertTriangle } from "lucide-react";
import { cn } from "@do/ui";
import type { ProductDefinition, Locale } from "./types-bridge";
import { buildFormSchema, isFieldVisible } from "./schema";
import { Field } from "./field";
import { ConsentField } from "./consent-field";
import { QuoteSuccess } from "./quote-success";
import { KvkkBody, SensitiveConsentBody } from "@/components/legal/kvkk-content";
import { submitQuoteRequest, type SubmitQuoteResult } from "@/lib/submit-quote";

interface AutoFormProps {
  product: ProductDefinition;
  locale: Locale;
  /**
   * Hesaplayıcıdan forma "yumuşak geçiş": ilgili alanları ön-doldurmak için
   * opsiyonel başlangıç değerleri (docs/08 Aşama 4 madde 4). Zorunlu değil.
   * Anahtarlar definitions.ts alan adlarıyla eşleşmeli.
   */
  defaultValues?: Record<string, unknown>;
}

export function AutoForm({ product, locale, defaultValues }: AutoFormProps) {
  const t = useTranslations("form");
  const sensitive = Boolean(product.sensitive || product.fields.some((f) => f.sensitive));
  const schema = buildFormSchema(product.fields, locale, sensitive);

  const form = useForm<Record<string, unknown>>({
    resolver: zodResolver(schema),
    mode: "onTouched",
    defaultValues,
  });

  const [submitted, setSubmitted] = useState(false);
  // K30: başarı ekranında gösterilen durum-takip kodu (sunucudan döner).
  const [trackingCode, setTrackingCode] = useState<string | null>(null);
  const [serverError, setServerError] = useState<SubmitQuoteResult["error"] | null>(null);

  // docs/03 koşullu görünürlük: tüm değerleri izle → showIf'e göre alanları göster/gizle
  // ve gizli alanları gönderimden çıkar (Zod superRefine zaten gizliyken atlar).
  const watched = form.watch();

  async function onSubmit(values: Record<string, unknown>) {
    setServerError(null);

    // RHF değerlerini FormData'ya çevir (Server Action FormData bekler — dosya dahil).
    const fd = new FormData();
    fd.set("__slug", product.slug);
    fd.set("__locale", locale);
    for (const field of product.fields) {
      // Gizli (showIf koşulu sağlanmayan) alanları gönderme.
      if (!isFieldVisible(field, values)) continue;
      const value = values[field.name];
      if (value === undefined || value === null) continue;
      if (value instanceof File) {
        fd.set(field.name, value);
      } else if (typeof value === "boolean") {
        fd.set(field.name, value ? "true" : "false");
      } else {
        fd.set(field.name, String(value));
      }
    }
    // KVKK rıza kutuları (form alanlarından ayrı).
    fd.set("kvkkConsent", values.kvkkConsent ? "true" : "false");
    if (sensitive) fd.set("sensitiveConsent", values.sensitiveConsent ? "true" : "false");

    // Honeypot (şema dışı; zodResolver soyduğu için getValues ile okunur).
    const honeypot = form.getValues("website");
    if (typeof honeypot === "string" && honeypot) fd.set("website", honeypot);

    const result = await submitQuoteRequest(fd);

    if (result.ok) {
      setTrackingCode(result.trackingCode ?? null);
      setSubmitted(true);
      return;
    }

    // Sunucu alan bazlı hata döndüyse RHF'e yansıt.
    if (result.fieldErrors) {
      for (const [name, message] of Object.entries(result.fieldErrors)) {
        form.setError(name, { type: "server", message });
      }
    }
    setServerError(result.error ?? "server");
  }

  if (submitted) {
    return (
      <QuoteSuccess
        trackingCode={trackingCode}
        onReset={() => {
          form.reset();
          setSubmitted(false);
          setTrackingCode(null);
        }}
      />
    );
  }

  return (
    <form
      onSubmit={form.handleSubmit(onSubmit)}
      noValidate
      className="relative flex flex-col gap-5 rounded-[var(--radius)] border border-border bg-card p-6 shadow-sm sm:p-8"
    >
      {/* docs/03 "Form bölümleri": alanlar başlıklı bölümlere gruplanır.
          İletişim (ad-soyad/telefon/e-posta) → Sigorta Bilgileri (ürüne özel). */}
      {(["iletisim", "detay"] as const).map((section) => {
        const sectionFields = product.fields.filter((f) => (f.section ?? "detay") === section);
        if (sectionFields.length === 0) return null;
        return (
          <fieldset key={section} className="flex flex-col gap-4">
            <legend className="mb-1 w-full border-b border-border pb-2 font-heading text-lg text-foreground">
              {t(`sections.${section}`)}
            </legend>
            <div className="grid grid-cols-1 gap-5 sm:grid-cols-2">
              {sectionFields.map((field) => {
                // docs/03: koşullu (showIf) alan, koşul sağlanmazsa render edilmez.
                if (!isFieldVisible(field, watched)) return null;
                return (
                  <div
                    key={field.name}
                    className={
                      field.type === "checkbox" || field.type === "radio" || field.type === "file"
                        ? "sm:col-span-2"
                        : undefined
                    }
                  >
                    <Field field={field} locale={locale} form={form} />
                  </div>
                );
              })}
            </div>
          </fieldset>
        );
      })}

      {/* Honeypot — botlar için görünmez tuzak alan (gerçek kullanıcı doldurmaz). */}
      <div aria-hidden className="absolute left-[-9999px] h-0 w-0 overflow-hidden">
        <label>
          {/* docs/06 §6 spam koruması */}
          Website
          <input type="text" tabIndex={-1} autoComplete="off" {...form.register("website")} />
        </label>
      </div>

      {/* KVKK açık rıza (zorunlu) — docs/03/06 §2a. Form alanlarından AYRI.
          Rıza, aydınlatma metni MODAL'da en alta kadar OKUNMADAN işaretlenemez. */}
      <div className="flex flex-col gap-4 rounded-xl bg-muted/50 p-4">
        <ConsentField
          name="kvkkConsent"
          form={form}
          label={t("kvkkConsent")}
          openLinkLabel={t("kvkkLink")}
          modalTitle={t("consentModal.kvkkTitle")}
          confirmLabel={t("consentModal.confirm")}
          scrollHint={t("consentModal.scrollHint")}
          closeLabel={t("consentModal.close")}
        >
          <KvkkBody locale={locale} />
        </ConsentField>
        {sensitive && (
          // docs/06: özel nitelikli veri (sağlık/hayat) için 2. açık rıza (aynı desen).
          <ConsentField
            name="sensitiveConsent"
            form={form}
            label={t("sensitiveConsent")}
            openLinkLabel={t("sensitiveLink")}
            modalTitle={t("consentModal.sensitiveTitle")}
            confirmLabel={t("consentModal.confirm")}
            scrollHint={t("consentModal.scrollHint")}
            closeLabel={t("consentModal.close")}
          >
            <SensitiveConsentBody locale={locale} />
          </ConsentField>
        )}
      </div>

      {serverError && (
        <div
          role="alert"
          className="flex items-start gap-2 rounded-xl border border-destructive/40 bg-destructive/10 p-3 text-sm text-destructive"
        >
          <AlertTriangle className="mt-0.5 h-4 w-4 shrink-0" aria-hidden />
          <span>{t(`errors.${serverError}`)}</span>
        </div>
      )}

      <button
        type="submit"
        disabled={form.formState.isSubmitting}
        className={cn(
          "rounded-pill bg-primary px-6 py-3 font-medium text-primary-foreground",
          "transition hover:-translate-y-0.5 hover:bg-destructive disabled:opacity-60",
        )}
      >
        {form.formState.isSubmitting ? t("submitting") : t("submit")}
      </button>
    </form>
  );
}
