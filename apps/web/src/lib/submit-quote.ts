"use server";

// Teklif gönderimi — Server Action.
// Kaynak: docs/03 (form→DB eşlemesi), docs/04 (QuoteRequest + payload JSON + Asset),
// docs/06 (KVKK rıza + kanıt + özel nitelikli veri + rate limit).
//
// AKIŞ:
//  1) Rate limit (IP başına) — spam koruması (docs/06 §6).
//  2) FormData → değer nesnesi (dosya alanları File olarak ayrılır).
//  3) buildFormSchema ile SUNUCU TARAFINDA yeniden DOĞRULA (istemciye güvenme).
//  4) KVKK rıza kontrolü: kvkkConsent zorunlu; ürün/alan sensitive ise sensitiveConsent
//     da zorunlu (sunucuda da). Yoksa REDDET.
//  5) QuoteRequest oluştur: ortak alanlar sütun, ürüne özel alanlar `payload` JSON.
//     Rıza kanıtı (consentAt/Ip/UserAgent) kaydedilir.
//  6) Dosyaları private bucket'a yükle + Asset kaydı (Supabase yoksa zarifçe atla).
//
// ⚠️ Gizli anahtarlar (service role) yalnızca burada/@do/db'de, asla istemcide.

import { headers } from "next/headers";
import {
  prisma,
  uploadToStorage,
  isStorageConfigured,
  validateUpload,
  Prisma,
  generateUniqueTrackingCode,
  createNotification,
} from "@do/db";
import { sendQuoteReceived, isEmailConfigured } from "@do/email";
import { getProduct } from "@do/products";
import { getProvinces, getDistricts } from "@do/products/locations";
import type { ProductDefinition, ProductField } from "@do/products";
import { buildFormSchema } from "@/components/auto-form/schema";
import { routing } from "@/i18n/routing";
import { rateLimit } from "./rate-limit";

type Locale = (typeof routing.locales)[number];

export interface SubmitQuoteResult {
  ok: boolean;
  /** Kullanıcıya gösterilecek hata anahtarı (mesajlar i18n'den). */
  error?:
    | "rateLimited"
    | "unknownProduct"
    | "validation"
    | "consentRequired"
    | "sensitiveConsentRequired"
    | "invalidFile"
    | "server";
  /** validation hatalarında alan bazlı mesajlar (opsiyonel). */
  fieldErrors?: Record<string, string>;
  quoteId?: string;
  /** Durum-takip kodu (K30) — başarı ekranında müşteriye gösterilir. */
  trackingCode?: string;
}

// Rate limit politikası: 15 dakikalık pencerede IP başına 8 gönderim.
// TODO(doc): Üretim eşiği netleşince ayarlanır (docs/06 §6).
const RATE_LIMIT = { limit: 8, windowMs: 15 * 60 * 1000 };

// İstemci tarafıyla aynı; honeypot alan adı (botlar doldurursa reddet).
const HONEYPOT_FIELD = "website";

export async function submitQuoteRequest(formData: FormData): Promise<SubmitQuoteResult> {
  try {
    const hdrs = await headers();
    const ip = clientIp(hdrs);
    const userAgent = hdrs.get("user-agent") ?? null;

    // 1) Rate limit (IP başına).
    const rl = rateLimit(`quote:${ip}`, RATE_LIMIT);
    if (!rl.ok) {
      return { ok: false, error: "rateLimited" };
    }

    // Basit honeypot spam koruması: gizli alan doluysa bot kabul et (sessiz başarı
    // dönmek yerine reddediyoruz; UI bunu "server" olarak gösterir).
    if (typeof formData.get(HONEYPOT_FIELD) === "string" && formData.get(HONEYPOT_FIELD)) {
      return { ok: false, error: "server" };
    }

    // 2) Ürün + locale.
    const slug = String(formData.get("__slug") ?? "");
    const product = getProduct(slug);
    if (!product) {
      return { ok: false, error: "unknownProduct" };
    }
    const locale = normalizeLocale(formData.get("__locale"));

    const sensitive = isSensitiveProduct(product);

    // FormData → değer nesnesi (dosyalar ayrı tutulur).
    const { values, files } = parseFormData(formData, product);

    // 3) Sunucu tarafı doğrulama (istemci ile AYNI şema).
    const schema = buildFormSchema(product.fields, locale, sensitive);
    const parsed = schema.safeParse(values);
    if (!parsed.success) {
      const fieldErrors: Record<string, string> = {};
      for (const issue of parsed.error.issues) {
        const key = String(issue.path[0] ?? "_");
        if (!fieldErrors[key]) fieldErrors[key] = issue.message;
      }
      // 4) Rıza eksikliği özel hata olarak ayrıştırılır (UI net mesaj verir).
      if (fieldErrors.kvkkConsent) return { ok: false, error: "consentRequired", fieldErrors };
      if (sensitive && fieldErrors.sensitiveConsent) {
        return { ok: false, error: "sensitiveConsentRequired", fieldErrors };
      }
      return { ok: false, error: "validation", fieldErrors };
    }

    const data = parsed.data as Record<string, unknown>;

    // 4b) Rıza kontrolü (defansif — şema zaten zorunlu kılar ama sunucuda da teyit).
    if (data.kvkkConsent !== true) {
      return { ok: false, error: "consentRequired" };
    }
    if (sensitive && data.sensitiveConsent !== true) {
      return { ok: false, error: "sensitiveConsentRequired" };
    }

    // 4c) DOSYA TÜRÜ DOĞRULAMASI (docs/13 §K2) — KAYITTAN ÖNCE.
    // Sunucuda KESİN: istemci atlasa bile geçersiz dosya tüm gönderimi reddeder.
    // İstemcinin file.type'ına GÜVENİLMEZ; tür imzadan (magic-byte) belirlenir.
    // Doğrulanmış MIME, Blob contentType'ı olarak kullanılmak üzere saklanır.
    const validatedFiles: { parsed: ParsedFile; mime: string }[] = [];
    for (const f of files) {
      const result = await validateUpload(f.file, {
        allowed: [...QUOTE_FILE_ALLOWED],
        maxSizeMb: f.maxSizeMb,
      });
      if (!result.ok) {
        // Net hata: yalnız JPG/PNG/WEBP kabul edilir (kullanıcı mesajı i18n'den;
        // ham `reason` yalnız sunucu logu için, kullanıcıya gösterilmez).
        console.warn(`[submit-quote] geçersiz dosya (${f.field}): ${result.reason}`);
        return { ok: false, error: "invalidFile" };
      }
      validatedFiles.push({ parsed: f, mime: result.mime });
    }

    // 5) Ortak alanları payload'dan AYIR (docs/04: ortak=sütun, gerisi=JSON).
    const { common, payload } = splitCommonFields(product, data);

    // Durum-takip kodu (K30): kısa, tahmin-edilemez, benzersiz. Müşteri durum
    // sorgu sayfasında bu kodu kullanır.
    const trackingCode = await generateUniqueTrackingCode();

    const quote = await prisma.quoteRequest.create({
      data: {
        product: product.slug,
        locale,
        trackingCode,
        // source varsayılan WEB (şema). Açıkça belirtmeye gerek yok.
        fullName: common.fullName,
        phone: common.phone,
        email: common.email ?? null,
        // ürüne özel alanlar (TC, plaka, m² vb.) — docs/04. Prisma Json input cast'i.
        payload: payload as Prisma.InputJsonValue,
        // KVKK rıza KANITI (docs/06 §2): rıza verildi + zaman + IP + UA.
        consentKvkk: true,
        consentSensitive: sensitive ? true : false,
        consentAt: new Date(),
        consentIp: ip,
        consentUserAgent: userAgent,
      },
    });

    // 6) Dosya yükleme (trafik ruhsat foto vb.) → Vercel Blob + Asset (K25).
    // Blob token yoksa ZARİFÇE atla; teklif yine de kaydedilmiş olur (feature flag).
    // Dosyalar 4c'de zaten doğrulandı; contentType = İMZA-DOĞRULANMIŞ MIME (docs/13 §K2).
    if (validatedFiles.length > 0 && isStorageConfigured()) {
      for (const { parsed: f, mime } of validatedFiles) {
        try {
          const path = buildAssetPath(product.slug, quote.id, f.file.name);
          const uploaded = await uploadToStorage({
            path,
            body: await f.file.arrayBuffer(),
            // İstemcinin file.type'ı DEĞİL; doğrulanmış MIME (docs/13 §K2).
            contentType: mime,
          });
          await prisma.asset.create({
            data: {
              quoteId: quote.id,
              // K25: Vercel Blob — tahmin-edilemez token'lı URL doğrudan saklanır ve
              // YALNIZCA kimlik doğrulanmış admin ekranında gösterilir (docs/06 §5b).
              path: uploaded.path,
              url: uploaded.url,
              kind: f.kind,
              // İmza-doğrulanmış MIME saklanır (istemci beyanı değil).
              mimeType: mime,
              sizeBytes: f.file.size,
            },
          });
        } catch (err) {
          // Tek dosya hatası tüm gönderimi düşürmesin; teklif zaten kayıtlı.
          console.error("[submit-quote] asset upload failed:", err);
        }
      }
    }

    // 7) Admin bildirimi (K29) — yan etki; HATA TEKLİFİ DÜŞÜRMESİN (yut + logla).
    try {
      await createNotification({
        type: "TEKLIF",
        title: `Yeni teklif talebi: ${productName(product, locale)}`,
        body: `${common.fullName} — ${common.phone}`,
        relatedId: quote.id,
      });
    } catch (err) {
      console.error("[submit-quote] notification create failed:", err);
    }

    // 8) Müşteriye "Teklif Alındı" e-postası + takip kodu (K30) — flag'li; e-posta
    //    yoksa veya gönderim hatasıysa AKIŞ KIRILMAZ (yut + logla).
    if (common.email && isEmailConfigured()) {
      try {
        await sendQuoteReceived({
          to: common.email,
          productName: productName(product, locale),
          code: trackingCode,
          statusUrl: buildStatusUrl(trackingCode, locale),
          locale,
        });
      } catch (err) {
        console.error("[submit-quote] sendQuoteReceived failed:", err);
      }
    }

    return { ok: true, quoteId: quote.id, trackingCode };
  } catch (err) {
    console.error("[submit-quote] unexpected error:", err);
    return { ok: false, error: "server" };
  }
}

// ── Yardımcılar ───────────────────────────────────────────────────────────────

interface ParsedFile {
  field: string;
  file: File;
  kind: string;
  /** Alanın izin verdiği azami boyut (MB); doğrulamada kullanılır (docs/13 §K2). */
  maxSizeMb: number;
}

// Teklif foto yüklemede izin verilen türler (docs/13 §K2): yalnız görseller.
// Poliçe belgesi (PDF) admin tarafında ayrı doğrulanır.
const QUOTE_FILE_ALLOWED = ["jpeg", "png", "webp"] as const;
// Alan tanımında maxSizeMb yoksa kullanılacak güvenli üst sınır.
const DEFAULT_MAX_SIZE_MB = 10;

function parseFormData(
  formData: FormData,
  product: ProductDefinition,
): { values: Record<string, unknown>; files: ParsedFile[] } {
  const values: Record<string, unknown> = {};
  const files: ParsedFile[] = [];

  const fieldByName = new Map(product.fields.map((f) => [f.name, f]));

  // Konsent alanları (form alanlarından ayrı).
  values.kvkkConsent = toBool(formData.get("kvkkConsent"));
  if (isSensitiveProduct(product)) {
    values.sensitiveConsent = toBool(formData.get("sensitiveConsent"));
  }

  for (const field of product.fields) {
    const raw = formData.get(field.name);

    if (field.type === "file") {
      if (raw instanceof File && raw.size > 0) {
        files.push({
          field: field.name,
          file: raw,
          kind: assetKind(field),
          maxSizeMb: field.validation?.maxSizeMb ?? DEFAULT_MAX_SIZE_MB,
        });
        // Şema `file` alanını File | undefined bekler → değeri ilet.
        values[field.name] = raw;
      } else {
        values[field.name] = undefined;
      }
      continue;
    }

    if (field.type === "checkbox") {
      values[field.name] = toBool(raw);
      continue;
    }

    // Diğer tüm alanlar string olarak gelir; boş string'i undefined yapma işini
    // şema (optionalString) zaten hallediyor. number coerce şema tarafında.
    values[field.name] = raw == null ? undefined : String(raw);
  }

  // fieldByName yalnızca olası ileri kullanım için; şimdilik kullanılmıyor.
  void fieldByName;

  return { values, files };
}

/** Ortak (sütun) alanları payload'dan ayırır. docs/03 ortak kurallar + docs/04. */
function splitCommonFields(
  product: ProductDefinition,
  data: Record<string, unknown>,
): {
  common: { fullName: string; phone: string; email?: string };
  payload: Record<string, unknown>;
} {
  const payload: Record<string, unknown> = {};
  let fullName = "";
  let phone = "";
  let email: string | undefined;

  for (const field of product.fields) {
    const value = data[field.name];
    if (value === undefined) continue;

    // Ortak alanlar tip ile değil ANLAM ile eşlenir; definitions.ts'te ad/telefon/
    // e-posta alanları sabit isimlerle (adSoyad/telefon/eposta) ve tiplerle tanımlı.
    // TODO(doc): Ad-soyad alan adı definitions.ts'te "adSoyad" sabittir; değişirse güncellenir.
    if (field.name === "adSoyad" || field.name === "fullName") {
      fullName = String(value);
      continue;
    }
    if (field.type === "tel") {
      phone = String(value);
      continue;
    }
    if (field.type === "email") {
      email = value === "" ? undefined : String(value);
      continue;
    }
    // Zincirleme adres (docs/03): il/ilçe ID olarak gelir → admin'de okunaklı olsun diye
    // ID + çözümlenmiş AD birlikte saklanır. Mahalle zaten ad olarak gelir.
    if (field.type === "province") {
      const id = String(value);
      payload[field.name] = id;
      const name = getProvinces().find((p) => String(p.id) === id)?.name;
      if (name) payload[`${field.name}Adi`] = name;
      continue;
    }
    if (field.type === "district") {
      const id = String(value);
      payload[field.name] = id;
      // İlçe adı için üst ilin ID'si gerekir (cascade.parent).
      const parentId = field.cascade?.parent ? data[field.cascade.parent] : undefined;
      if (parentId !== undefined) {
        const name = getDistricts(String(parentId)).find((d) => String(d.id) === id)?.name;
        if (name) payload[`${field.name}Adi`] = name;
      }
      continue;
    }

    // Geri kalan her şey (TC, plaka, tarih, sayı, seçim, mahalle adı, dosya HARİÇ) payload.
    if (field.type !== "file") {
      payload[field.name] = value;
    }
  }

  return { common: { fullName, phone, email }, payload };
}

/** Ürünün locale'e göre görünen adı (e-posta/bildirim için). */
function productName(product: ProductDefinition, locale: Locale): string {
  return product.name[locale] ?? product.name.tr;
}

/**
 * Müşterinin durum sorgu sayfasının tam URL'i (K30). Kod query parametresi olarak
 * eklenir; sayfa otomatik doldurabilir. EN'de yol "/quote-status" (docs/12 §3).
 * TODO(doc): Durum sayfası rotası web-builder tarafından eklenecek (routing.ts);
 * yol değişirse buradaki segment güncellenir.
 */
function buildStatusUrl(code: string, locale: Locale): string {
  const base = (process.env.NEXT_PUBLIC_SITE_URL ?? "https://dogukanozgan.com").replace(/\/+$/, "");
  const segment = locale === "en" ? "quote-status" : "teklif-durumu";
  return `${base}/${locale}/${segment}?code=${encodeURIComponent(code)}`;
}

function isSensitiveProduct(product: ProductDefinition): boolean {
  return Boolean(product.sensitive || product.fields.some((f) => f.sensitive));
}

function assetKind(field: ProductField): string {
  // docs/04: Asset.kind "ruhsat" | "arac" | "belge" ... Alan adına göre kaba eşleme.
  const n = field.name.toLowerCase();
  if (n.includes("ruhsat")) return "ruhsat";
  if (n.includes("arac")) return "arac";
  return "belge";
}

function buildAssetPath(slug: string, quoteId: string, originalName: string): string {
  const safe = originalName.replace(/[^a-zA-Z0-9._-]/g, "_").slice(-60);
  const unique = `${Date.now()}-${Math.random().toString(36).slice(2, 8)}`;
  return `${slug}/${quoteId}/${unique}-${safe}`;
}

function toBool(v: FormDataEntryValue | null): boolean {
  if (v == null) return false;
  const s = String(v).toLowerCase();
  return s === "true" || s === "on" || s === "1" || s === "yes";
}

function normalizeLocale(v: FormDataEntryValue | null): Locale {
  const s = typeof v === "string" ? v : "";
  return (routing.locales as readonly string[]).includes(s) ? (s as Locale) : routing.defaultLocale;
}

function clientIp(hdrs: Headers): string {
  // Vercel: x-forwarded-for ilk IP gerçek istemcidir.
  const fwd = hdrs.get("x-forwarded-for");
  if (fwd) return fwd.split(",")[0]!.trim();
  return hdrs.get("x-real-ip") ?? "unknown";
}
