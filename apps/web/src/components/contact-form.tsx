"use client";

// İletişim / geri arama formu (docs/02 "İletişim: ... genel form", docs/12 §3 K31).
//
// Aşama 7: Form artık GERÇEK gönderim yapar — `submitContactRequest` Server Action'ına
// bağlıdır (ContactRequest → DB + ILETISIM bildirimi). docs/06 gereği iletişimde de
// aydınlatma + KVKK açık rıza zorunludur (ConsentField + KVKK modal deseni; teklif
// formuyla AYNI bileşen/akış). İstemcide Zod ile ön-doğrulama, sunucu aynı şemayla
// yeniden doğrular. Başarı/hata ekranı vardır.
//
// WhatsApp hızlı yolu KORUNUR ama ikincil bir kanaldır: asıl gönderim DB'ye yapılır.

import { useState } from "react";
import { useForm, type UseFormReturn } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { useTranslations, useLocale } from "next-intl";
import { CheckCircle2, AlertTriangle, MessageCircle } from "lucide-react";
import { z } from "zod";
import { cn } from "@do/ui";
import { contact } from "@/lib/site";
import { submitContactRequest, type SubmitContactResult } from "@/lib/submit-contact";
import { track } from "@/lib/track";
import { ConsentField } from "@/components/auto-form/consent-field";
import { KvkkBody } from "@/components/legal/kvkk-content";
import type { Locale } from "@/i18n/routing";

// İstemci-tarafı şema — sunucudaki contactSchema'nın AYNASI (lib/submit-contact.ts).
// Mesajlar i18n anahtarıdır; UI "errors.<key>" ile çevirir.
const contactSchema = z.object({
  fullName: z.string().trim().min(2, "fullName").max(120),
  phone: z.string().trim().min(7, "phone").max(30),
  email: z
    .string()
    .trim()
    .email("email")
    .max(160)
    .optional()
    .or(z.literal("").transform(() => undefined)),
  subject: z.string().trim().max(160).optional(),
  message: z.string().trim().min(5, "message").max(5000),
  kvkkConsent: z.literal(true, { message: "consentRequired" }),
});

// RHF form değerleri: şema alanları + honeypot (şema dışı; zodResolver soyar).
type ContactValues = z.infer<typeof contactSchema> & { website?: string };

export function ContactForm() {
  const t = useTranslations("contact");
  const tf = useTranslations("form");
  const locale = useLocale() as Locale;

  const form = useForm<ContactValues>({
    resolver: zodResolver(contactSchema),
    mode: "onTouched",
    defaultValues: { fullName: "", phone: "", email: "", subject: "", message: "" },
  });

  const [submitted, setSubmitted] = useState(false);
  const [serverError, setServerError] = useState<SubmitContactResult["error"] | null>(null);

  async function onSubmit(values: ContactValues) {
    setServerError(null);

    const fd = new FormData();
    fd.set("fullName", values.fullName);
    fd.set("phone", values.phone);
    if (values.email) fd.set("email", values.email);
    if (values.subject) fd.set("subject", values.subject);
    fd.set("message", values.message);
    fd.set("kvkkConsent", values.kvkkConsent ? "true" : "false");

    // Honeypot (şema dışı; zodResolver soyduğu için getValues ile okunur).
    const honeypot = form.getValues("website");
    if (typeof honeypot === "string" && honeypot) fd.set("website", honeypot);

    const result = await submitContactRequest(fd);

    if (result.ok) {
      // GA4: iletişim formu başarıyla gönderildi (yalnız GERÇEK başarıda, 1 kez).
      track("iletisim_formu");
      setSubmitted(true);
      return;
    }

    if (result.fieldErrors) {
      for (const [name, message] of Object.entries(result.fieldErrors)) {
        form.setError(name as keyof ContactValues, { type: "server", message });
      }
    }
    setServerError(result.error ?? "server");
  }

  // WhatsApp hızlı yolu (ikincil kanal) — mevcut form değerlerinden mesaj kurar.
  function buildWaHref() {
    const v = form.getValues();
    const lines = [
      `${t("formName")}: ${v.fullName ?? ""}`.trim(),
      `${t("formPhone")}: ${v.phone ?? ""}`.trim(),
      v.email ? `${t("formEmail")}: ${v.email}` : "",
      v.subject ? `${t("formSubject")}: ${v.subject}` : "",
      v.message ? `${t("formMessage")}: ${v.message}` : "",
    ].filter(Boolean);
    const text = encodeURIComponent(lines.join("\n"));
    return `https://wa.me/${contact.whatsapp}?text=${text}`;
  }

  const fieldClass =
    "w-full min-h-[44px] rounded-xl border-[1.5px] border-input bg-background px-4 py-3 text-base text-foreground transition focus:border-secondary focus:outline-none focus:ring-4 focus:ring-secondary/15";
  const labelClass = "mb-1.5 block text-sm font-bold text-muted-foreground";

  if (submitted) {
    return (
      <div className="flex flex-col items-center justify-center rounded-[var(--radius)] border border-secondary/30 bg-accent p-8 text-center">
        <CheckCircle2 className="h-12 w-12 text-secondary" aria-hidden />
        <h2 className="mt-4 font-heading text-2xl text-foreground">{t("successTitle")}</h2>
        <p className="mt-2 text-sm text-accent-foreground/80">{t("successBody")}</p>
        <button
          type="button"
          onClick={() => {
            form.reset();
            setSubmitted(false);
          }}
          className="mt-6 rounded-pill border border-input bg-card px-5 py-2 text-sm font-medium transition hover:bg-muted"
        >
          {t("submitAnother")}
        </button>
      </div>
    );
  }

  const errors = form.formState.errors;

  return (
    <div className="rounded-[var(--radius)] border border-border bg-card p-6 sm:p-8">
      <h2 className="font-heading text-xl text-foreground">{t("formTitle")}</h2>
      <p className="mt-1 text-sm text-muted-foreground">{t("formIntro")}</p>

      <form onSubmit={form.handleSubmit(onSubmit)} noValidate className="mt-6 flex flex-col gap-4">
        <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
          <div>
            <label htmlFor="cf-name" className={labelClass}>
              {t("formName")} *
            </label>
            <input
              id="cf-name"
              type="text"
              {...form.register("fullName")}
              placeholder={t("formNamePlaceholder")}
              className={fieldClass}
              autoComplete="name"
              aria-invalid={errors.fullName ? true : undefined}
            />
            <FieldError error={errors.fullName?.message} />
          </div>
          <div>
            <label htmlFor="cf-phone" className={labelClass}>
              {t("formPhone")} *
            </label>
            <input
              id="cf-phone"
              type="tel"
              {...form.register("phone")}
              placeholder={t("formPhonePlaceholder")}
              className={fieldClass}
              autoComplete="tel"
              aria-invalid={errors.phone ? true : undefined}
            />
            <FieldError error={errors.phone?.message} />
          </div>
        </div>

        <div>
          <label htmlFor="cf-email" className={labelClass}>
            {t("formEmail")}
          </label>
          <input
            id="cf-email"
            type="email"
            {...form.register("email")}
            placeholder={t("formEmailPlaceholder")}
            className={fieldClass}
            autoComplete="email"
            aria-invalid={errors.email ? true : undefined}
          />
          <FieldError error={errors.email?.message} />
        </div>

        <div>
          <label htmlFor="cf-subject" className={labelClass}>
            {t("formSubject")}
          </label>
          <input
            id="cf-subject"
            type="text"
            {...form.register("subject")}
            placeholder={t("formSubjectPlaceholder")}
            className={fieldClass}
          />
        </div>

        <div>
          <label htmlFor="cf-message" className={labelClass}>
            {t("formMessage")} *
          </label>
          <textarea
            id="cf-message"
            rows={4}
            {...form.register("message")}
            placeholder={t("formMessagePlaceholder")}
            className={`${fieldClass} resize-y`}
            aria-invalid={errors.message ? true : undefined}
          />
          <FieldError error={errors.message?.message} />
        </div>

        {/* Honeypot — botlar için görünmez tuzak (docs/06 §6). */}
        <div aria-hidden className="absolute left-[-9999px] h-0 w-0 overflow-hidden">
          <label>
            Website
            <input type="text" tabIndex={-1} autoComplete="off" {...form.register("website")} />
          </label>
        </div>

        {/* KVKK açık rıza (zorunlu) — teklif formuyla AYNI ConsentField + modal akışı.
            Rıza, aydınlatma metni MODAL'da en alta kadar OKUNMADAN işaretlenemez. */}
        <div className="rounded-xl bg-muted/50 p-4">
          <ConsentField
            name="kvkkConsent"
            form={form as unknown as UseFormReturn<Record<string, unknown>>}
            label={t("kvkkConsent")}
            openLinkLabel={t("kvkkLink")}
            modalTitle={tf("consentModal.kvkkTitle")}
            confirmLabel={tf("consentModal.confirm")}
            scrollHint={tf("consentModal.scrollHint")}
            closeLabel={tf("consentModal.close")}
          >
            <KvkkBody locale={locale} />
          </ConsentField>
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
            "inline-flex w-full items-center justify-center gap-2 rounded-full bg-destructive px-6 py-3.5 text-base font-bold text-white transition",
            "hover:-translate-y-0.5 hover:bg-[hsl(9_84%_38%)] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 focus-visible:ring-offset-card",
            "disabled:translate-y-0 disabled:opacity-60",
          )}
        >
          {form.formState.isSubmitting ? t("formSubmitting") : t("formSubmit")}
        </button>

        {/* İkincil kanal: WhatsApp ile hemen yazışma (docs/02 hızlı yol). */}
        <a
          href={buildWaHref()}
          target="_blank"
          rel="noopener noreferrer"
          onClick={() => track("iletisim_arama", { kanal: "whatsapp" })}
          className="inline-flex w-full items-center justify-center gap-2 rounded-full border-[1.5px] border-secondary/40 px-6 py-3 text-sm font-bold text-secondary transition hover:bg-accent focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
        >
          <MessageCircle className="h-5 w-5" aria-hidden />
          {t("formWhatsappAlt")}
        </a>
        <p className="text-center text-xs text-muted-foreground">{t("formNote")}</p>
      </form>
    </div>
  );
}

function FieldError({ error }: { error?: string }) {
  const t = useTranslations("contact");
  if (!error) return null;
  // Sunucu/şema mesajı i18n anahtarıdır; bilinmiyorsa ham metni göster.
  let text = error;
  try {
    text = t(`errors.${error}`);
  } catch {
    /* anahtar yoksa ham metin */
  }
  return (
    <p role="alert" className="mt-1 text-xs font-medium text-destructive">
      {text}
    </p>
  );
}
