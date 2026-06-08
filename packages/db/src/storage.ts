// @do/db — Vercel Blob depolama yardımcıları (yükleme + silme). — K25
// Kaynak: docs/04 "Dosya Depolama Notu (Vercel Blob)", docs/06 §5b + §6
// (token sadece sunucuda).
//
// TASARIM:
// - Ruhsat/araç fotoğrafları KİŞİSEL VERİDİR. Vercel Blob URL'leri tahmin-edilemez
//   rastgele token içerir AMA "public-stil"dir (imzalı/süreli değildir). Bu nedenle
//   bu URL'ler YALNIZCA kimlik doğrulanmış admin ekranında gösterilir, indekslenmez ve
//   işlem sonrası silinebilir (docs/06 §5b artık-risk notu).
// - Yükleme web app'ten (server action), görüntüleme admin'den yapılır; ikisi de aynı
//   Blob store'a `BLOB_READ_WRITE_TOKEN` ile bağlanır.
// - `@vercel/blob` paketi kullanılır (`put` / `del`). Env yoksa zarifçe devre dışı
//   kalır (feature flag).
//
// ⚠️ GÜVENLİK: BLOB_READ_WRITE_TOKEN YALNIZCA sunucuda kullanılır. Bu modül hiçbir
// zaman istemci bileşenine import EDİLMEMELİDİR ("server-only" sınırı).

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
 * üretilir (`buildAssetPath`). `access: "public"` Blob'un tek erişim modudur; URL
 * yine de tahmin-edilemez token içerir (docs/06 §5b notu geçerli).
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

/** Storage yapılandırılmamışken fırlatılır — feature-flag ile ayırt edilebilir. */
export class StorageNotConfiguredError extends Error {
  constructor() {
    super("Vercel Blob is not configured (missing BLOB_READ_WRITE_TOKEN).");
    this.name = "StorageNotConfiguredError";
  }
}
