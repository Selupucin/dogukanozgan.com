// Sunucu logları için basit hata redaksiyonu (docs/13 §D3 — log PII sızıntısı).
//
// İLKE: Ham hata nesnesini doğrudan loglamak (console.error(err)), PII içeren
// alanları (form değerleri, dosya içeriği, DB kayıt verisi) sunucu loglarına
// taşıyabilir. Bu yardımcı YALNIZCA hata türünü/mesajını (+ varsa `code`) çıkarır;
// nested payload/PII loglanmaz. Aşırı mühendislik yok — sınırlı, güvenli özet.

/**
 * Hatadan PII-içermeyen kısa bir özet üretir. Error ise `İsim: mesaj` (+ code);
 * değilse yalnızca tür adı. Hata mesajları geliştirici-tanımlı olup kullanıcı
 * verisi taşımaz; yine de yalnızca message alınır, tüm nesne değil.
 */
export function safeErrorMessage(err: unknown): string {
  if (err instanceof Error) {
    const code = (err as { code?: unknown }).code;
    const codePart = typeof code === "string" || typeof code === "number" ? ` [${code}]` : "";
    return `${err.name}: ${err.message}${codePart}`;
  }
  if (typeof err === "string") return err;
  return `non-Error thrown (${typeof err})`;
}

/**
 * Etiketli, sanitize edilmiş sunucu hata logu (docs/13 §D3). Ham `err` nesnesini
 * loglamak yerine bunu kullan; PII içeren alanlar loglanmaz.
 */
export function logError(scope: string, err: unknown): void {
  console.error(`${scope} ${safeErrorMessage(err)}`);
}
