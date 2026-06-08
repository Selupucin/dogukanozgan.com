// Form girdi maskeleri — yeniden kullanılabilir, saf yardımcılar.
// Kaynak: docs/09 "Form alanları" (maskeleme notu), docs/06 (TC/telefon kişisel veri).
//
// İki maske desteklenir:
//  - Telefon (TR cep): canlı `0 (5XX) XXX XX XX` biçimi. Sadece rakam kabul, fazla hane
//    engellenir. Görünür değer okunur biçimde kalır (payload'a da bu format gider).
//  - TC Kimlik No: 11 hane, sadece rakam, GÖRSEL GRUPLAMA YOK (kullanıcı isteği), fazla
//    hane engellenir. Ayrıca TC algoritma (checksum) doğrulaması.
//
// Maskeler "kontrollü input" mantığıyla çalışır: ham girişten yalnızca rakamları alır,
// 11/10 haneye kırpar ve biçimli string döndürür. Zod doğrulaması da bu helper'ları
// kullanır (schema.ts), böylece tek kaynak.

/** Yalnızca rakamları döndürür. */
export function digitsOnly(value: string): string {
  return value.replace(/\D+/g, "");
}

// ─────────────────────────────────────────────────────────────────────────────
// Telefon (TR cep): 0 (5XX) XXX XX XX
// ─────────────────────────────────────────────────────────────────────────────

/**
 * Ham/karışık girişi `0 (5XX) XXX XX XX` biçimine dönüştürür.
 * - Sadece rakam alınır, ilk 11 hane kullanılır (fazlası atılır).
 * - Kullanıcı baştaki "0"ı yazmasa da "5..." ile başlarsa otomatik "0" eklenir.
 * - Kısmi girişte mümkün olduğunca biçimlenir (canlı maske).
 */
export function formatPhone(value: string): string {
  let d = digitsOnly(value);
  // "5XX..." şeklinde baştan 0 olmadan girilirse 0 ekle (cep numarası varsayımı).
  if (d.length > 0 && d[0] !== "0") d = "0" + d;
  // En fazla 11 hane (0 + 10).
  d = d.slice(0, 11);

  if (d.length === 0) return "";

  const rest = d.slice(1); // baştaki 0 dışındaki haneler (en çok 10)
  const a = rest.slice(0, 3); // 5XX
  const b = rest.slice(3, 6); // XXX
  const c = rest.slice(6, 8); // XX
  const e = rest.slice(8, 10); // XX

  let out = "0";
  if (rest.length > 0) out += ` (${a}`;
  if (a.length === 3) out += ")";
  if (b) out += ` ${b}`;
  if (c) out += ` ${c}`;
  if (e) out += ` ${e}`;
  return out;
}

/** Telefon: TR cep biçimine uygun mu (tam 11 hane, 05 ile başlar). */
export function isValidPhone(value: string): boolean {
  const d = digitsOnly(value);
  return /^05\d{9}$/.test(d);
}

// ─────────────────────────────────────────────────────────────────────────────
// TC Kimlik No: 11 hane, gruplama YOK
// ─────────────────────────────────────────────────────────────────────────────

/** TC girişini maskeler: sadece rakam, en çok 11 hane, gruplama yok. */
export function formatTc(value: string): string {
  return digitsOnly(value).slice(0, 11);
}

/**
 * TC Kimlik No algoritma (checksum) doğrulaması.
 * Kurallar: 11 hane, ilk hane 0 olamaz; 10. hane = ((1+3+5+7+9. haneler toplamı)*7 -
 * (2+4+6+8. haneler toplamı)) mod 10; 11. hane = ilk 10 hanenin toplamı mod 10.
 */
export function isValidTc(value: string): boolean {
  const d = digitsOnly(value);
  if (!/^\d{11}$/.test(d)) return false;
  if (d[0] === "0") return false;

  const n = d.split("").map(Number);
  const oddSum = n[0]! + n[2]! + n[4]! + n[6]! + n[8]!; // 1,3,5,7,9. haneler
  const evenSum = n[1]! + n[3]! + n[5]! + n[7]!; // 2,4,6,8. haneler
  const tenth = (oddSum * 7 - evenSum) % 10;
  if (((tenth % 10) + 10) % 10 !== n[9]!) return false;

  const firstTenSum = n.slice(0, 10).reduce((a, b) => a + b, 0);
  if (firstTenSum % 10 !== n[10]!) return false;

  return true;
}

// ─────────────────────────────────────────────────────────────────────────────
// Binlik ayırıcı (para alanları) — hesaplayıcılar için (docs/03 görev #7).
// tr-TR: binlik NOKTA. Örn. 7500 → "7.500", 10000 → "10.000".
// ─────────────────────────────────────────────────────────────────────────────

/**
 * Ham girişi tr-TR binlik (nokta) ayırıcıyla biçimler. Sadece rakam alınır.
 * Boş girişte boş string döner (kullanıcı alanı tamamen silebilsin).
 */
export function formatThousands(value: string): string {
  const d = digitsOnly(value);
  if (d === "") return "";
  // Baştaki sıfırları sadeleştir (ama "0" tek başına kalsın).
  const normalized = d.replace(/^0+(?=\d)/, "");
  return normalized.replace(/\B(?=(\d{3})+(?!\d))/g, ".");
}

/** Binlik-biçimli string'i ham sayıya çevirir (ayırıcıları kaldırır). */
export function parseThousands(value: string): number {
  const d = digitsOnly(value);
  return d === "" ? NaN : Number(d);
}
