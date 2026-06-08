// @do/db — Vercel Blob depolama yardımcıları (yükleme + silme). — K25
// Kaynak: docs/04 "Dosya Depolama Notu (Vercel Blob)", docs/06 §5b + §6
// (token sadece sunucuda).
//
// TASARIM (docs/13 §Y1 güncel):
// - Ruhsat/araç fotoğrafları + poliçe belgesi KİŞİSEL/ÖZEL NİTELİKLİ VERİDİR. Vercel Blob
//   yalnız `access:"public"` modunu destekler (private read GA değil) → blob PRIVATE
//   YAPILAMAZ. URL tahmin-edilemez token içerse de imzasız/süresizdir.
// - BU NEDENLE: ham blob URL'i (Asset.url) İSTEMCİYE HİÇ İFŞA EDİLMEZ. Erişim sunucu-tarafı
//   KONTROLLÜ ROTALARLA verilir:
//     • Müşteri (poliçe): kısa ömürlü İMZALI/SÜRELİ link → /police-indir?token=... (web)
//       (token: file-access.ts → signFileToken/verifyFileToken).
//     • Admin (her dosya): AUTH-GATED proxy → /dosya/<assetId> (admin).
//   Her iki rota da blob içeriğini SUNUCUDA `fetchBlobContent` ile çekip STREAM eder;
//   ham blob URL'i yanıta/HTML'e/redirect'e ASLA sızmaz (docs/06 §5b güncel).
// - Yükleme web app'ten (server action), görüntüleme kontrollü rotalardan; ikisi de aynı
//   Blob store'a `BLOB_READ_WRITE_TOKEN` ile bağlanır.
// - `@vercel/blob` paketi kullanılır (`put` / `del`). Env yoksa zarifçe devre dışı
//   kalır (feature flag).
//
// ⚠️ GÜVENLİK: BLOB_READ_WRITE_TOKEN + Asset.url YALNIZCA sunucuda kullanılır. Bu modül
// hiçbir zaman istemci bileşenine import EDİLMEMELİDİR ("server-only" sınırı).

import { put, del } from "@vercel/blob";

/**
 * Blob içindeki yol öneki (ruhsat/araç fotoğrafları). Blob'da "bucket" yoktur;
 * bu önek yalnızca pathname düzeni içindir.
 */
export const STORAGE_PREFIX = "quote-assets";

/** Vercel Blob yapılandırması mevcut mu? (feature flag) */
export function isStorageConfigured(): boolean {
  return Boolean(process.env.BLOB_READ_WRITE_TOKEN);
}

export interface UploadInput {
  /** Blob içindeki tam pathname (ör. "trafik/<quoteId>/<uuid>-ruhsat.jpg"). */
  path: string;
  /**
   * Dosya içeriği. ArrayBuffer / Uint8Array kabul edilir (Vercel Blob `put` bunları
   * çalışma zamanında destekler).
   */
  body: ArrayBuffer | Uint8Array;
  /**
   * İçerik tipi (MIME). ZORUNLU ve İMZA-DOĞRULANMIŞ olmalıdır (docs/13 §K2):
   * çağıran taraf önce `validateUpload` ile dosyayı doğrular ve dönen `mime` değerini
   * BURAYA verir. İstemcinin beyan ettiği `file.type` ASLA doğrudan geçirilmemelidir.
   * İmza doğrulaması burada DEĞİL çağıranlarda yapılır; storage yalnız temiz bir
   * contentType'ı zorunlu kılar.
   */
  contentType: string;
}

export interface UploadResult {
  /** Blob pathname (silme için saklanır → Asset.path). */
  path: string;
  /** Blob URL (tahmin-edilemez token; doğrudan erişilir → Asset.url). */
  url: string;
}

/**
 * Bir dosyayı Vercel Blob'a yükler. Token yoksa hata fırlatır
 * (çağıran taraf feature-flag ile bunu zarifçe yakalamalı).
 *
 * Not: `addRandomSuffix: false` — yükleme yolları çağıran tarafça zaten benzersiz
 * üretilir (`buildAssetPath`). `access: "public"` Blob'un TEK erişim modudur (private
 * read desteklenmez); URL tahmin-edilemez token içerir AMA imzasız/süresizdir → bu yüzden
 * ham URL istemciye ifşa EDİLMEZ, erişim kontrollü proxy/imzalı link ile verilir
 * (docs/13 §Y1, docs/06 §5b — `fetchBlobContent` + file-access.ts).
 */
export async function uploadToStorage(input: UploadInput): Promise<UploadResult> {
  if (!isStorageConfigured()) {
    throw new StorageNotConfiguredError();
  }

  // docs/13 §K2: contentType zorunlu ve temiz olmalı (imza-doğrulanmış MIME).
  // Çağıran `validateUpload` çalıştırmadan/contentType vermeden buraya gelmemeli.
  const contentType = (input.contentType || "").trim();
  if (!contentType) {
    throw new Error(
      "uploadToStorage: contentType zorunludur (imza-doğrulanmış MIME). " +
        "Önce validateUpload ile doğrulayın (docs/13 §K2).",
    );
  }

  const pathname = `${STORAGE_PREFIX}/${input.path}`;
  // Vercel Blob `put` Buffer/Blob/Stream kabul eder; ArrayBuffer/Uint8Array'i Buffer'a çevir.
  const bytes = input.body instanceof Uint8Array ? input.body : new Uint8Array(input.body);
  const result = await put(pathname, Buffer.from(bytes), {
    access: "public",
    addRandomSuffix: false,
    contentType,
    token: process.env.BLOB_READ_WRITE_TOKEN,
  });

  return { path: result.pathname, url: result.url };
}

/**
 * Bir veya birden çok Blob nesnesini kalıcı olarak siler (KVKK imha).
 * `urlsOrPaths` Asset.url (tam Blob URL) veya pathname olabilir; `del` her ikisini
 * de kabul eder.
 */
export async function deleteFromStorage(urlsOrPaths: string[]): Promise<void> {
  const targets = urlsOrPaths.filter(Boolean);
  if (targets.length === 0) return;
  if (!isStorageConfigured()) {
    throw new StorageNotConfiguredError();
  }

  await del(targets, { token: process.env.BLOB_READ_WRITE_TOKEN });
}

export interface BlobContent {
  /** Ham içerik (stream'e/Response'a verilebilir). */
  body: ArrayBuffer;
  /** Blob'un servis ettiği içerik tipi (yoksa application/octet-stream). */
  contentType: string;
}

/**
 * Bir blob'un içeriğini SUNUCUDA çeker (docs/13 §Y1 kontrollü proxy/indirme için).
 *
 * `url` HAM blob URL'idir (Asset.url) ve YALNIZCA SUNUCUDA kullanılır — bu fonksiyonun
 * dönüşü istemciye STREAM edilir, ham URL asla istemciye/HTML'e/redirect'e sızdırılmaz.
 * Çağıran rotalar (admin /dosya/[assetId], web /police-indir) erişim kontrolünü (auth /
 * imzalı token) KENDİLERİ yapar; bu fonksiyon yalnız içeriği getirir.
 *
 * İçerik bulunamaz/erişilemezse hata fırlatır (çağıran 404/502'ye çevirir).
 */
export async function fetchBlobContent(url: string): Promise<BlobContent> {
  // Not: cache devre dışı — Next çağıran rotalar zaten `force-dynamic`/`no-store`.
  const res = await fetch(url);
  if (!res.ok) {
    throw new Error(`fetchBlobContent: blob fetch failed (${res.status}).`);
  }
  const contentType = res.headers.get("content-type") || "application/octet-stream";
  const body = await res.arrayBuffer();
  return { body, contentType };
}

/** Storage yapılandırılmamışken fırlatılır — feature-flag ile ayırt edilebilir. */
export class StorageNotConfiguredError extends Error {
  constructor() {
    super("Vercel Blob is not configured (missing BLOB_READ_WRITE_TOKEN).");
    this.name = "StorageNotConfiguredError";
  }
}
