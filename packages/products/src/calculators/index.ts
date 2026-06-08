// @do/products/calculators — hesaplayıcı mantığı (BES, Sağlık, Hayat).
// Kaynak: docs/03, docs/08 Aşama 4.
//
// ⚠️ Aşama 4: Hesaplayıcı iskeleti YER TUTUCU FORMÜL'lerle kuruldu.
//   - formulas.ts → saf hesaplama fonksiyonları (yan etkisiz).
//   - constants.ts → TÜM katsayı/oran/limitler (TEK DEĞİŞİM NOKTASI).
// Gerçek formüller Doğukan'dan gelince YALNIZCA constants.ts güncellenir.
// Sonuç ekranlarında docs/03 gereği "Tahmini değerdir" uyarısı ZORUNLU.

export {
  calculateBes,
  calculateSaglik,
  calculateHayat,
  calculateHayatVergi,
  type BesInput,
  type BesResult,
  type SaglikInput,
  type HayatInput,
  type HayatVergiInput,
  type HayatVergiResult,
  type PremiumRange,
} from "./formulas";

export { BES, SAGLIK, HAYAT, HAYAT_VERGI } from "./constants";
