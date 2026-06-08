// @do/db — Sunucu-tarafı dosya yükleme doğrulaması (MIME + magic-byte).
// Kaynak: docs/13 §K2 (dosya türü doğrulanmıyordu), docs/06 §5b (yüklenen dosyalar),
// docs/04 (Asset.mimeType / Asset.sizeBytes).
//
// AMAÇ (docs/13 §K2):
//   Boyut zaten sunucuda kontrol ediliyordu; ANCAK dosya TÜRÜ doğrulanmıyordu.
//   `accept="image/*"` ve istemcinin verdiği `file.type` YALNIZCA tarayıcı ipucudur ve
//   güvenilemez. Bu modül, dosyanın İLK BYTE'larından (içerik imzası / "magic byte")
//   gerçek türü belirler ve izinli beyaz liste ile karşılaştırır.
//
// GÜVENLİK PRENSİPLERİ:
//   - İstemcinin `file.type`'ına ASLA güvenme; MIME imzadan türetilir.
//   - SVG / HTML / JS / her türlü betik KESİNLİKLE reddedilir (beyaz listede yoktur;
//     `image/svg+xml` ayrıca açıkça reddedilir — SVG metin tabanlıdır, içine script
//     gömülebilir ve Blob "public" servis edildiğinde XSS taşıyabilir).
//   - Bu doğrulama SUNUCUDA KESİNDİR: istemci tüm kontrolleri atlasa bile geçersiz
//     dosya reddedilir. İstemci tarafı doğrulama yalnızca UX içindir.
//   - YENİ BAĞIMLILIK YOK: imza kontrolü inline (ilk byte'lar) yapılır.
//
// NOT (docs/13 §Y1 ayrı batch): Bu modül Blob `access` modunu DEĞİŞTİRMEZ; yalnız
// içerik-türü doğrulaması ekler. Public→private/imzalı erişim ayrı turda ele alınır.

/** İzinli kısa tür anahtarları (çağıran `allowed` ile sınırlar). */
export type AllowedFileType = "jpeg" | "png" | "webp" | "pdf";

/** Kısa anahtar → kanonik (beyaz liste) MIME tipi. */
const MIME_BY_TYPE: Record<AllowedFileType, string> = {
  jpeg: "image/jpeg",
  png: "image/png",
  webp: "image/webp",
  pdf: "application/pdf",
};

/**
 * Açıkça reddedilen MIME'ler (beyaz listede zaten yok; ekstra savunma + net hata).
 * SVG metin tabanlı vektör formatıdır ve içine `<script>` gömülebilir → "public" Blob
 * üzerinden servis edildiğinde XSS riski taşır (docs/13 §K2).
 */
const EXPLICITLY_DENIED_MIMES = new Set<string>([
  "image/svg+xml",
  "text/html",
  "application/xhtml+xml",
  "text/javascript",
  "application/javascript",
  "application/xml",
  "text/xml",
]);

/** Doğrulanacak dosya için minimum arayüz (File ile uyumlu). */
export interface ValidatableFile {
  arrayBuffer(): Promise<ArrayBuffer>;
  /** İstemcinin beyanı — GÜVENİLMEZ; yalnızca ön-eleme/log için. */
  type: string;
  name: string;
  size: number;
}

export interface ValidateUploadOptions {
  /** İzin verilen tür anahtarları (en az biri). */
  allowed: AllowedFileType[];
  /** Azami boyut (MB). */
  maxSizeMb: number;
}

export type ValidateUploadResult = { ok: true; mime: string } | { ok: false; reason: string };

/**
 * Bir baytın belirli bir ofsetten itibaren beklenen imza ile eşleşip eşleşmediği.
 * `expected` içindeki `null` = "herhangi bir bayt" (joker, ör. WEBP'in dosya boyutu alanı).
 */
function matchesSignature(bytes: Uint8Array, offset: number, expected: (number | null)[]): boolean {
  if (bytes.length < offset + expected.length) return false;
  for (let i = 0; i < expected.length; i++) {
    const e = expected[i];
    if (e === null) continue; // joker
    if (bytes[offset + i] !== e) return false;
  }
  return true;
}

/**
 * Dosyanın ilk byte'larından gerçek türünü belirler (magic-byte). Tanınmayan/izinsiz
 * imzalar için `null` döner. İstemcinin beyan ettiği MIME burada KULLANILMAZ.
 *
 * İmzalar:
 *  - JPEG:  FF D8 FF
 *  - PNG:   89 50 4E 47 0D 0A 1A 0A  ("\x89PNG\r\n\x1a\n")
 *  - WEBP:  offset 0 "RIFF" (52 49 46 46) + offset 8 "WEBP" (57 45 42 50)
 *  - PDF:   25 50 44 46 2D  ("%PDF-")
 */
export function detectFileType(bytes: Uint8Array): AllowedFileType | null {
  // JPEG: FF D8 FF
  if (matchesSignature(bytes, 0, [0xff, 0xd8, 0xff])) return "jpeg";

  // PNG: 89 50 4E 47 0D 0A 1A 0A
  if (matchesSignature(bytes, 0, [0x89, 0x50, 0x4e, 0x47, 0x0d, 0x0a, 0x1a, 0x0a])) {
    return "png";
  }

  // WEBP: "RIFF" .... "WEBP" (dosya-boyutu alanı [4..8) joker).
  if (
    matchesSignature(bytes, 0, [0x52, 0x49, 0x46, 0x46]) && // "RIFF"
    matchesSignature(bytes, 8, [0x57, 0x45, 0x42, 0x50]) // "WEBP"
  ) {
    return "webp";
  }

  // PDF: "%PDF-"
  if (matchesSignature(bytes, 0, [0x25, 0x50, 0x44, 0x46, 0x2d])) return "pdf";

  return null;
}

/**
 * Bir yüklenen dosyayı SUNUCUDA doğrular (boyut + içerik imzası). İstemcinin
 * `file.type`'ına GÜVENMEZ; gerçek türü ilk byte'lardan belirler.
 *
 * @returns `{ ok: true, mime }` — `mime` İMZADAN türetilmiş kanonik MIME'dir;
 *          Storage `contentType`'ı olarak BU kullanılmalıdır (istemci beyanı değil).
 *          Geçersizse `{ ok: false, reason }` (kullanıcıya net mesaj türetilebilir).
 */
export async function validateUpload(
  file: ValidatableFile,
  opts: ValidateUploadOptions,
): Promise<ValidateUploadResult> {
  // 0) Erken kontroller.
  if (!opts.allowed || opts.allowed.length === 0) {
    return { ok: false, reason: "no-allowed-types" };
  }
  if (file.size <= 0) {
    return { ok: false, reason: "empty-file" };
  }

  // 1) Boyut (sunucuda kesin).
  const maxBytes = opts.maxSizeMb * 1024 * 1024;
  if (file.size > maxBytes) {
    return { ok: false, reason: "too-large" };
  }

  // 2) İstemci beyanı açıkça yasaklı bir tür mü? (ekstra savunma; asıl karar imzada).
  const declared = (file.type || "").toLowerCase().split(";")[0]!.trim();
  if (declared && EXPLICITLY_DENIED_MIMES.has(declared)) {
    return { ok: false, reason: "denied-type" };
  }

  // 3) İçerik imzası (magic-byte). İlk 16 bayt WEBP "RIFF....WEBP" dahil tüm
  //    imzaları kapsamaya yeter.
  let head: Uint8Array;
  try {
    const buf = await file.arrayBuffer();
    head = new Uint8Array(buf).subarray(0, 16);
  } catch {
    return { ok: false, reason: "read-error" };
  }

  const detected = detectFileType(head);
  if (detected === null) {
    // Tanınmayan imza (SVG/HTML/JS/metin dahil her şey buraya düşer) → reddet.
    return { ok: false, reason: "unsupported-signature" };
  }

  // 4) İmzadan belirlenen tür, çağıranın izin verdiği beyaz listede mi?
  if (!opts.allowed.includes(detected)) {
    return { ok: false, reason: "type-not-allowed" };
  }

  // 5) Geçerli: MIME İMZADAN gelir (istemci beyanı DEĞİL).
  return { ok: true, mime: MIME_BY_TYPE[detected] };
}
