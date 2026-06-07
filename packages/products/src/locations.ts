// @do/products/locations — Türkiye idari birim verisi (il / ilçe / mahalle).
//
// Kaynak: turkiye-api (ubeydeozdmr/turkiye-api, MIT) verisi indirilip yer/ada göre
// sadeleştirildi (id+ad). Veri TR collator ile alfabetik sıralanmıştır.
//   - tr-provinces.json: 81 il  → [{ id, name }]
//   - tr-districts.json: il → ilçeler → { [provinceId]: [{ id, name }] }
//   - tr-neighborhoods.json: ilçe → mahalleler → { [districtId]: [name, ...] }
//
// ⚠️ ÖNEMLİ: Mahalle dosyası ~387 KB. İSTEMCİ paketine GİRMEMESİ için bu dosya
// YALNIZCA sunucu API route'undan (apps/web .../api/locations) okunur — UI mahalleyi
// talebe göre fetch eder. İl/ilçe küçük olduğundan istemciye gömülebilir.
//
// TODO(doc): Veri yıllık idari değişikliklerle güncellenebilir; tek kaynak bu dosyalar
// + process betiği (geçmiş kayıtta belirtildi). docs/03 "Zincirleme adres".

import provincesData from "./data/tr-provinces.json";
import districtsData from "./data/tr-districts.json";

export interface TrProvince {
  id: number;
  name: string;
}
export interface TrDistrict {
  id: number;
  name: string;
}

const provinces = provincesData as TrProvince[];
const districtsByProvince = districtsData as Record<string, TrDistrict[]>;

/** 81 il (alfabetik). */
export function getProvinces(): TrProvince[] {
  return provinces;
}

/** Verilen ilin (provinceId) ilçeleri (alfabetik); yoksa boş dizi. */
export function getDistricts(provinceId: number | string): TrDistrict[] {
  return districtsByProvince[String(provinceId)] ?? [];
}

/** Bir il var mı? (validasyon için). */
export function isValidProvinceId(provinceId: number | string): boolean {
  return provinces.some((p) => String(p.id) === String(provinceId));
}
