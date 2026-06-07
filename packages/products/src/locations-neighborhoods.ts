// @do/products/locations/neighborhoods — SUNUCU TARAFI mahalle verisi.
//
// ⚠️ Bu modül ~387 KB veri içerir; YALNIZCA sunucuda (API route) import edilmelidir.
// İstemci bileşenleri mahalleyi /api/locations route'undan fetch eder, bu modülü
// DOĞRUDAN import ETMEZ (aksi halde istemci paketi şişer). docs/03 "Zincirleme adres".

import neighborhoodsData from "./data/tr-neighborhoods.json";

const neighborhoodsByDistrict = neighborhoodsData as Record<string, string[]>;

/** Verilen ilçenin (districtId) mahalleleri (alfabetik); yoksa boş dizi. */
export function getNeighborhoods(districtId: number | string): string[] {
  return neighborhoodsByDistrict[String(districtId)] ?? [];
}
