"use client";

// AutoForm — ürün tanımından (definitions.ts) OTOMATİK üretilen teklif formu.
// Kaynak: docs/01 (RHF + Zod), docs/03 (ortak alanlar + KVKK rıza), docs/09 (stil + form UX).
//
// 2 ADIMLI (wizard) form (docs/09 form UX kararı):
//   • Adım 1 — "Sigorta Bilgileri": "detay" bölümü alanları + [Devam →].
//   • Adım 2 — "İletişim Bilgileri": "Kişi Bilgileri" (kisi) + "İletişim" (iletisim)
//     alt başlıkları + KVKK rıza kutu(ları) + [← Geri] [Teklif Al].
// Üstte ilerleme göstergesi (Adım 1/2). Adımlar TEK useForm üzerinde sadece
// GÖRÜNÜRLÜK ile yönetilir (alanlar unmount EDİLMEZ → RHF değerleri, cascade adres,
// dosya yükleme ve ruhsat rehber modalı korunur). [Devam] yalnızca Adım 1 alanlarını
// doğrular (RHF trigger); submit kalan alanları + KVKK'yı doğrular.
//
// Backend/payload DEĞİŞMEZ: alan name'leri ve gönderim akışı aynıdır; yalnızca
// bölüm/adım SUNUMU değişti. submit-quote'a dokunulmadı.

import { useMemo, useState } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { useTranslations } from "next-intl";
import { AlertTriangle, ArrowLeft, ArrowRight } from "lucide-react";
import { cn } from "@do/ui";
import type { ProductDefinition, ProductField, Locale } from "./types-bridge";
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

/** Bir alanın bölümü (verilmezse "detay"). */
function sectionOf(field: ProductField): "kisi" | "iletisim" | "detay" {
  return field.section ?? "detay";
}

export function AutoForm({ product, locale, defaultValues }: AutoFormProps) {
  const t = useTranslations("form");
  const sensitive = Boolean(product.sensitive || product.fields.some((f) => f.sensitive));
  const schema = buildFormSchema(product.fields, locale, sensitive);

  const form = useForm<Record<string, unknown>>({
    resolver: zodResolver(schema),
    mode: "onTouched",
    defaultValues,
    // Adımlar arası alanlar gizlenince DOM'dan çıksa bile değerleri korunsun
    // (gizleme CSS ile yapılıyor; yine de güvence için register kalsın). docs (görev #2).
    shouldUnregister: false,
  });

  const [submitted, setSubmitted] = useState(false);
  // K30: başarı ekranında gösterilen durum-takip kodu (sunucudan döner).
  const [trackingCode, setTrackingCode] = useState<string | null>(null);
  const [serverError, setServerError] = useState<SubmitQuoteResult["error"] | null>(null);

  // docs/03 koşullu görünürlük: tüm değerleri izle → showIf'e göre alanları göster/gizle
  // ve gizli alanları gönderimden çıkar (Zod superRefine zaten gizliyken atlar).
  const watched = form.watch();

  // ── Bölümlere göre alanları ayır (docs/03 "Form bölümleri").
  const detayFields = useMemo(
    () => product.fields.filter((f) => sectionOf(f) === "detay"),
    [product.fields],
  );
  const kisiFields = useMemo(
    () => product.fields.filter((f) => sectionOf(f) === "kisi"),
    [product.fields],
  );
  const iletisimFields = useMemo(
    () => product.fields.filter((f) => sectionOf(f) === "iletisim"),
    [product.fields],
  );

  // Edge: "detay" alanı YOKSA tek adıma düş (Adım 1 boşsa direkt Adım 2 içeriği). docs (görev #2).
  const hasStep1 = detayFields.length > 0;

  // Aktif adım: 1 = Sigorta Bilgileri (detay) · 2 = İletişim Bilgileri (kisi + iletisim).
  // Tek adımlı ürünlerde daima 2 (kişi/iletişim + rıza + submit) gösterilir.
  const [step, setStep] = useState<1 | 2>(hasStep1 ? 1 : 2);

  // [Devam] doğrulaması için Adım 1 alan adları — yalnızca GÖRÜNÜR (showIf) alanlar.
  const step1FieldNames = useMemo(
    () => detayFields.filter((f) => isFieldVisible(f, watched)).map((f) => f.name),
    [detayFields, watched],
  );

  async function goToStep2() {
    // SADECE Adım 1 alanlarını doğrula (RHF trigger). showIf ile gizli alanlar dahil DEĞİL.
    const valid = step1FieldNames.length === 0 ? true : await form.trigger(step1FieldNames);
    if (!valid) {
      // Hatalı ilk alana odaklan/scroll et (RHF kendi focus'ını da yapar).
      const firstError = step1FieldNames.find((name) => form.getFieldState(name).invalid);
      if (firstError) {
        form.setFocus(firstError);
        document
          .getElementById(`field-${firstError}`)
          ?.scrollIntoView({ behavior: "smooth", block: "center" });
      }
      return;
    }
    setStep(2);
  }

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
          setStep(hasStep1 ? 1 : 2);
        }}
      />
    );
  }

  // İlerleme göstergesinde her zaman 2 adım var ama tek adımlı üründe gizlenir.
  const showStepper = hasStep1;

  return (
    <form
      onSubmit={form.handleSubmit(onSubmit)}
      noValidate
      className="relative flex flex-col gap-6 rounded-[var(--radius)] border border-border bg-card p-6 shadow-sm sm:p-8"
    >
      {/* ── İlerleme göstergesi (docs/09: lacivert/teal, yuvarlak, yumuşak).
          Erişilebilir: aria-label + her adım aria-current. */}
      {showStepper && (
        <nav aria-label={t("steps.progressLabel")} className="flex flex-col gap-3">
          <ol className="flex items-center gap-3">
            {([1, 2] as const).map((s, idx) => {
              const active = step === s;
              const done = step > s;
              return (
                <li key={s} className="flex flex-1 items-center gap-3">
                  <div
                    className="flex items-center gap-2.5"
                    aria-current={active ? "step" : undefined}
                  >
                    <span
                      className={cn(
                        "flex h-8 w-8 shrink-0 items-center justify-center rounded-full border-2 text-sm font-bold transition-colors",
                        active && "border-secondary bg-secondary text-secondary-foreground",
                        done && "border-secondary bg-secondary/15 text-secondary",
                        !active && !done && "border-input bg-card text-muted-foreground",
                      )}
                    >
                      {s}
                    </span>
                    <span
                      className={cn(
                        "text-sm font-medium transition-colors",
                        active ? "text-foreground" : "text-muted-foreground",
                      )}
                    >
                      {s === 1 ? t("steps.step1Short") : t("steps.step2Short")}
                    </span>
                  </div>
                  {idx === 0 && (
                    // Adımlar arası dolu/boş çubuk (Adım 2'de dolar).
                    <span
                      aria-hidden
                      className={cn(
                        "h-1 flex-1 rounded-full transition-colors",
                        step > 1 ? "bg-secondary" : "bg-border",
                      )}
                    />
                  )}
                </li>
              );
            })}
          </ol>
        </nav>
      )}

      {/* ── ADIM 1 — Sigorta Bilgileri ("detay"). Gizlenir (unmount EDİLMEZ) → değerler,
          cascade adres ve dosya/rehber modalı korunur. */}
      {hasStep1 && (
        <fieldset
          className={cn("flex flex-col gap-4", step !== 1 && "hidden")}
          aria-hidden={step !== 1}
        >
          <legend className="mb-1 w-full border-b border-border pb-2 font-heading text-lg text-foreground">
            {t("steps.step1Title")}
          </legend>
          <div className="grid grid-cols-1 gap-5 sm:grid-cols-2">
            {detayFields.map((field) => {
              // docs/03: koşullu (showIf) alan, koşul sağlanmazsa render edilmez.
              if (!isFieldVisible(field, watched)) return null;
              return (
                <div key={field.name} className={spanClass(field)}>
                  <Field field={field} locale={locale} form={form} />
                </div>
              );
            })}
          </div>
        </fieldset>
      )}

      {/* ── ADIM 2 — İletişim Bilgileri: "Kişi Bilgileri" + "İletişim" alt başlıkları. */}
      <div className={cn("flex flex-col gap-6", step !== 2 && "hidden")} aria-hidden={step !== 2}>
        {hasStep1 && (
          <h3 className="font-heading text-xl text-foreground">{t("steps.step2Title")}</h3>
        )}

        {(
          [
            ["kisi", kisiFields],
            ["iletisim", iletisimFields],
          ] as const
        ).map(([section, sectionFields]) => {
          if (sectionFields.length === 0) return null;
          return (
            <fieldset key={section} className="flex flex-col gap-4">
              <legend className="mb-1 w-full border-b border-border pb-2 font-heading text-lg text-foreground">
                {t(`sections.${section}`)}
              </legend>
              <div className="grid grid-cols-1 gap-5 sm:grid-cols-2">
                {sectionFields.map((field) => {
                  if (!isFieldVisible(field, watched)) return null;
                  return (
                    <div key={field.name} className={spanClass(field)}>
                      <Field field={field} locale={locale} form={form} />
                    </div>
                  );
                })}
              </div>
            </fieldset>
          );
        })}

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
      </div>

      {/* Honeypot — botlar için görünmez tuzak alan (gerçek kullanıcı doldurmaz). */}
      <div aria-hidden className="absolute left-[-9999px] h-0 w-0 overflow-hidden">
        <label>
          {/* docs/06 §6 spam koruması */}
          Website
          <input type="text" tabIndex={-1} autoComplete="off" {...form.register("website")} />
        </label>
      </div>

      {serverError && step === 2 && (
        <div
          role="alert"
          className="flex items-start gap-2 rounded-xl border border-destructive/40 bg-destructive/10 p-3 text-sm text-destructive"
        >
          <AlertTriangle className="mt-0.5 h-4 w-4 shrink-0" aria-hidden />
          <span>{t(`errors.${serverError}`)}</span>
        </div>
      )}

      {/* ── Adım gezinme butonları. */}
      {step === 1 ? (
        <button
          type="button"
          onClick={goToStep2}
          className={cn(
            "inline-flex items-center justify-center gap-2 rounded-pill bg-primary px-6 py-3 font-medium text-primary-foreground",
            "transition hover:-translate-y-0.5 hover:bg-destructive focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 focus-visible:ring-offset-card",
          )}
        >
          {t("steps.next")}
          <ArrowRight className="h-4 w-4" aria-hidden />
        </button>
      ) : (
        <div className="flex flex-col-reverse gap-3 sm:flex-row sm:items-center">
          {hasStep1 && (
            <button
              type="button"
              onClick={() => setStep(1)}
              className={cn(
                "inline-flex items-center justify-center gap-2 rounded-pill border border-input bg-card px-6 py-3 font-medium text-foreground",
                "transition hover:bg-muted focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 focus-visible:ring-offset-card",
              )}
            >
              <ArrowLeft className="h-4 w-4" aria-hidden />
              {t("steps.back")}
            </button>
          )}
          <button
            type="submit"
            disabled={form.formState.isSubmitting}
            className={cn(
              "inline-flex flex-1 items-center justify-center rounded-pill bg-primary px-6 py-3 font-medium text-primary-foreground",
              "transition hover:-translate-y-0.5 hover:bg-destructive disabled:opacity-60 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 focus-visible:ring-offset-card",
            )}
          >
            {form.formState.isSubmitting ? t("submitting") : t("submit")}
          </button>
        </div>
      )}
    </form>
  );
}

/** checkbox/radio/file alanları iki sütunlu gridde tam genişlik kaplar. */
function spanClass(field: ProductField): string | undefined {
  return field.type === "checkbox" || field.type === "radio" || field.type === "file"
    ? "sm:col-span-2"
    : undefined;
}
