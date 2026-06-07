// payload (JSON) → okunabilir etiketli alan listesi.
// Kaynak: docs/04 "payload JSON ... definitions.ts ile birebir eşleşir", docs/05
// "Tüm form alanları — definitions.ts'teki etiketlerle okunabilir biçimde".
//
// payload anahtarları ProductField.name ile eşleşir. Ortak alanlar (ad/telefon/
// e-posta) ayrı sütundadır → payload'da YOKTUR; burada yalnızca ürüne özel alanlar
// gösterilir. Bilinmeyen anahtarlar (definisyon değişmişse) ham gösterilir.

import { getProduct } from "@do/products";
import type { ProductField } from "@do/products";

export interface DisplayField {
  /** payload anahtarı. */
  key: string;
  /** TR etiket (definitions.ts'ten; yoksa anahtarın kendisi). */
  label: string;
  /** İnsan-okunur değer (seçenek etiketi çözülmüş, boolean Evet/Hayır vb.). */
  value: string;
  /** Bu alan özel nitelikli (sağlık) mi? UI uyarı işareti için. */
  sensitive: boolean;
}

/** Tek bir alan değerini, alan tanımına göre okunabilir metne çevirir. */
function formatValue(
  field: ProductField | undefined,
  raw: unknown,
  data?: Record<string, unknown>,
): string {
  if (raw === null || raw === undefined || raw === "") return "—";

  // Boolean (checkbox) → Evet / Hayır.
  if (typeof raw === "boolean") return raw ? "Evet" : "Hayır";

  // Zincirleme adres (il/ilçe) → ID yerine submit sırasında çözülmüş `<ad>Adi` göster.
  if (field && (field.type === "province" || field.type === "district") && data) {
    const name = data[`${field.name}Adi`];
    if (typeof name === "string" && name) return name;
  }

  // select/radio → seçenek etiketini (TR) çöz.
  if (field?.options && (field.type === "select" || field.type === "radio")) {
    const opt = field.options.find((o) => o.value === String(raw));
    if (opt) return opt.label.tr;
  }

  // date → yerel TR tarih (ISO string veya Date).
  if (field?.type === "date") {
    const d = new Date(String(raw));
    if (!Number.isNaN(d.getTime())) {
      return d.toLocaleDateString("tr-TR", { year: "numeric", month: "long", day: "numeric" });
    }
  }

  return String(raw);
}

/**
 * Bir teklifin payload'ını, ürün tanımının alan SIRASINA göre etiketli listeye çevirir.
 * Tanımda olmayan ama payload'da bulunan anahtarlar sona "ham" eklenir.
 */
export function describePayload(productSlug: string, payload: unknown): DisplayField[] {
  const product = getProduct(productSlug);
  const data: Record<string, unknown> =
    payload && typeof payload === "object" && !Array.isArray(payload)
      ? (payload as Record<string, unknown>)
      : {};

  const result: DisplayField[] = [];
  const seen = new Set<string>();

  if (product) {
    for (const field of product.fields) {
      // Ortak alanlar (ad/telefon/e-posta) ve dosya alanları payload'da değildir.
      if (field.type === "file") continue;
      if (field.name === "adSoyad" || field.type === "tel" || field.type === "email") continue;
      if (!(field.name in data)) continue;

      seen.add(field.name);
      // Zincirleme adreste ID'nin yanındaki çözülmüş ad anahtarını (örn. ilAdi) gizle
      // — ham anahtar olarak tekrar listelenmesin (değer zaten il/ilçe satırında görünür).
      if (field.type === "province" || field.type === "district") {
        seen.add(`${field.name}Adi`);
      }
      result.push({
        key: field.name,
        label: field.label.tr,
        value: formatValue(field, data[field.name], data),
        sensitive: Boolean(field.sensitive),
      });
    }
  }

  // Tanımda olmayan kalan anahtarlar (şema değişmişse) — ham gösterilir.
  for (const [key, value] of Object.entries(data)) {
    if (seen.has(key)) continue;
    result.push({
      key,
      label: key,
      value: formatValue(undefined, value, data),
      sensitive: false,
    });
  }

  return result;
}
