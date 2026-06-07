// Otomatik form — Zod şeması üreticisi.
// definitions.ts'teki alan tanımlarından (ProductField[]) tip-güvenli bir Zod
// şeması TÜRETİR. Kaynak: docs/01 (RHF + Zod), docs/03 (alan tipleri/validasyon).
//
// Aşama 1: yalnızca CLIENT-SIDE doğrulama. Gerçek gönderim/sunucu doğrulaması
// Aşama 2'de (Server Action). // TODO(doc): Aşama 2'de aynı şema sunucuda da kullanılır.

import { z } from "zod";
import type { ProductField, Locale } from "./types-bridge";

/** Yerelleştirilmiş hata mesajları (TR/EN). */
const messages = {
  required: { tr: "Bu alan zorunludur", en: "This field is required" },
  email: { tr: "Geçerli bir e-posta girin", en: "Enter a valid email" },
  tel: { tr: "Geçerli bir telefon girin", en: "Enter a valid phone number" },
  tcKimlik: { tr: "TC Kimlik No 11 haneli olmalı", en: "ID number must be 11 digits" },
  plaka: { tr: "Geçerli bir plaka girin", en: "Enter a valid plate" },
  number: { tr: "Geçerli bir sayı girin", en: "Enter a valid number" },
  min: { tr: "Değer çok küçük", en: "Value is too small" },
  max: { tr: "Değer çok büyük", en: "Value is too large" },
  minLength: { tr: "Çok kısa", en: "Too short" },
  maxLength: { tr: "Çok uzun", en: "Too long" },
  fileSize: { tr: "Dosya boyutu çok büyük", en: "File is too large" },
} as const;

function msg(key: keyof typeof messages, locale: Locale): string {
  return messages[key][locale];
}

/**
 * docs/03 "Koşullu alan görünürlüğü": bir alanın `showIf` koşulu, mevcut form
 * değerlerine göre sağlanıyor mu? Koşul yoksa alan her zaman görünür (true).
 * `equals` dizi ise herhangi biriyle eşleşmesi yeterlidir.
 */
export function isFieldVisible(field: ProductField, values: Record<string, unknown>): boolean {
  if (!field.showIf) return true;
  const current = values[field.showIf.field];
  const expected = field.showIf.equals;
  return Array.isArray(expected) ? expected.includes(current as string) : current === expected;
}

/** Tek bir alanı Zod tipine çevirir. */
function fieldSchema(field: ProductField, locale: Locale): z.ZodTypeAny {
  const v = field.validation ?? {};

  switch (field.type) {
    case "checkbox": {
      // docs/03 (görev #1): ÜRÜN-İÇİ checkbox alanları HER ZAMAN opsiyoneldir; bir
      // boolean tikinin işaretlenmesi zorunlu kılınamaz (KVKK rıza kutuları AYRI —
      // buildFormSchema'da ayrıca eklenir ve zorunludur). Böylece SGK gibi alanlar
      // işaretlenmese de form geçerli olur.
      return z.boolean().optional().default(false);
    }

    case "number": {
      let s = z.coerce.number({ error: msg("number", locale) });
      if (v.min !== undefined) s = s.min(v.min, msg("min", locale));
      if (v.max !== undefined) s = s.max(v.max, msg("max", locale));
      return field.required ? s : s.optional();
    }

    case "email": {
      const s = z.string().email(msg("email", locale));
      return field.required
        ? z.string().min(1, msg("required", locale)).email(msg("email", locale))
        : optionalString(s);
    }

    case "tel": {
      // Esnek telefon: en az 10 rakam (boşluk/+/-/parantez serbest).
      const s = z
        .string()
        .refine((val) => (val.match(/\d/g)?.length ?? 0) >= 10, msg("tel", locale));
      return field.required ? requiredString(locale).pipe(s) : optionalString(s);
    }

    case "tcKimlik": {
      const s = z.string().regex(/^\d{11}$/, msg("tcKimlik", locale));
      return field.required ? requiredString(locale).pipe(s) : optionalString(s);
    }

    case "plaka": {
      // Esnek plaka: 2 rakam + harf + rakam (boşluk serbest). TODO(doc): kesin desen.
      const s = z
        .string()
        .regex(/^\d{2}\s?[A-Za-zçğıöşüÇĞİÖŞÜ]{1,4}\s?\d{1,5}$/, msg("plaka", locale));
      return field.required ? requiredString(locale).pipe(s) : optionalString(s);
    }

    case "select":
    case "radio": {
      const values = (field.options ?? []).map((o) => o.value);
      if (values.length > 0) {
        const e = z.enum(values as [string, ...string[]]);
        return field.required ? e : e.optional();
      }
      return field.required ? requiredString(locale) : z.string().optional();
    }

    case "province":
    case "district":
    case "neighborhood": {
      // Zincirleme adres (docs/03): değerler dinamik (il/ilçe ID'si veya mahalle adı),
      // statik enum yapılamaz → serbest string olarak doğrulanır. province/district
      // genelde zorunlu, neighborhood opsiyonel (definitions.ts'e göre).
      return field.required ? requiredString(locale) : z.string().optional();
    }

    case "date": {
      const s = z.string();
      return field.required ? requiredString(locale).pipe(s) : optionalString(s);
    }

    case "file": {
      // Aşama 1: gerçek upload yok. Şema tarafında FileList/File opsiyonel tutulur;
      // boyut kontrolü tarayıcıda çalışır. Gönderim Aşama 2'de Storage'a bağlanır.
      // TODO(doc): Aşama 2 — Supabase Storage upload + zorunluluk netleşince güncellenir.
      const fileCheck = z.custom<File | undefined>(
        (val) => {
          if (val == null) return !field.required;
          if (!(val instanceof File)) return false;
          if (v.maxSizeMb && val.size > v.maxSizeMb * 1024 * 1024) return false;
          return true;
        },
        { message: msg("fileSize", locale) },
      );
      return fileCheck.optional();
    }

    case "text":
    default: {
      let s = z.string();
      if (v.minLength !== undefined) s = s.min(v.minLength, msg("minLength", locale));
      if (v.maxLength !== undefined) s = s.max(v.maxLength, msg("maxLength", locale));
      if (v.pattern) s = s.regex(new RegExp(v.pattern), msg("required", locale));
      return field.required ? s.min(1, msg("required", locale)) : optionalString(s);
    }
  }
}

/** Zorunlu metin: boş olamaz. */
function requiredString(locale: Locale) {
  return z.string().min(1, msg("required", locale));
}

/** Opsiyonel metin: boş string'i undefined'a indirger, doluysa kuralı uygular. */
function optionalString(inner: z.ZodTypeAny) {
  return z
    .union([z.literal(""), inner])
    .optional()
    .transform((val) => (val === "" ? undefined : val));
}

/**
 * Ürün alanlarından + (gerekiyorsa) KVKK rıza kutularından Zod şeması üretir.
 * @param fields Ürünün form alanları (definitions.ts).
 * @param locale Hata mesajı dili.
 * @param sensitive true ise 2. (özel nitelikli veri) rıza kutusu eklenir.
 */
export function buildFormSchema(fields: ProductField[], locale: Locale, sensitive: boolean) {
  const shape: Record<string, z.ZodTypeAny> = {};
  // Koşullu (showIf) alanları belirle; bunlar TEMELDE opsiyonel üretilir (gizliyken
  // doğrulamayı bozmasın), zorunluluk superRefine ile koşula göre uygulanır.
  const conditionalFields = fields.filter((f) => f.showIf);

  for (const field of fields) {
    if (field.showIf) {
      // Görünürken doğrulanacak; gizliyken pas geçilecek → temel şema "required false".
      shape[field.name] = fieldSchema({ ...field, required: false }, locale);
    } else {
      shape[field.name] = fieldSchema(field, locale);
    }
  }

  // KVKK açık rıza kutusu — zorunlu (docs/03/06). Form alanlarından AYRI tutulur.
  shape.kvkkConsent = z
    .boolean()
    .refine((val) => val === true, { message: msg("required", locale) });

  if (sensitive) {
    // docs/06: özel nitelikli veri (sağlık/hayat) için AYRI açık rıza.
    shape.sensitiveConsent = z
      .boolean()
      .refine((val) => val === true, { message: msg("required", locale) });
  }

  const base = z.object(shape);
  if (conditionalFields.length === 0) return base;

  // docs/03: koşullu alanlar GÖRÜNÜR ve ZORUNLU iken boşsa hata; gizliyken atlanır.
  return base.superRefine((data, ctx) => {
    const values = data as Record<string, unknown>;
    for (const field of conditionalFields) {
      if (!field.required) continue;
      if (!isFieldVisible(field, values)) continue;
      const value = values[field.name];
      const empty =
        value === undefined ||
        value === null ||
        value === "" ||
        (typeof value === "number" && Number.isNaN(value));
      if (empty) {
        ctx.addIssue({
          code: "custom",
          path: [field.name],
          message: msg("required", locale),
        });
      }
    }
  });
}

export type FormValues = Record<string, unknown>;
