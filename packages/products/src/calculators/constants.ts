// @do/products/calculators — HESAPLAYICI SABİTLERİ (TEK DEĞİŞİM NOKTASI).
// Kaynak: docs/03 "Hesaplayıcılar", docs/08 Aşama 4.
//
// ⚠️⚠️ YER TUTUCU FORMÜL KATSAYILARI ⚠️⚠️
// Aşağıdaki tüm sayısal değerler YAKLAŞIK / TAHMİNİ'dir ve gerçek mevzuat / tarife
// DEĞİLDİR. Gerçek katsayı, oran ve limitler Doğukan'dan gelince YALNIZCA BU DOSYA
// güncellenecek; hesaplama fonksiyonları (formulas.ts) değişmeden kalacak şekilde
// tasarlandı. Her değer // TODO(doc): ile işaretlidir.
//
// Sonuç ekranlarında docs/03 gereği "Tahmini değerdir" uyarısı ZORUNLU gösterilir.

// ─────────────────────────────────────────────────────────────────────────────
// BES — Bireysel Emeklilik Birikim Hesaplayıcı sabitleri
// docs/03: "%30 devlet katkısı" + bileşik getiri.
// ─────────────────────────────────────────────────────────────────────────────
export const BES = {
  /** Devlet katkısı oranı. docs/03: %30. */
  // TODO(doc): Güncel mevzuata göre teyit edilecek (oran değişebilir). Site sahibi notu:
  // devlet katkısı oranı %30 KALIR (katkının kendi getirisi düşük olsa da oran budur).
  stateContributionRate: 0.3,

  /**
   * Devlet katkısının (yalnızca devlet katkısı kısmının) varsayılan getiri oranı.
   * Site sahibi notu: "devlet katkısının getirisi ancak %10'larda" → bilgi amaçlı
   * sabit. ⚠️ Şu an MODELE DAHİL DEĞİL (formülü karmaşıklaştırmamak için); ileride
   * istenirse calculateBes içinde devlet katkısı bu oranla ayrı büyütülebilir.
   */
  // TODO(doc): Devlet katkısının ayrı getiri oranı modele dahil edilecek mi? (mali müşavir teyidi)
  stateContributionReturnRate: 0.1,

  /**
   * Devlet katkısı yıllık üst sınırı (TL). Gerçek limit yıllık brüt asgari ücrete
   * endekslidir ve her yıl güncellenir → yer tutucu sabit.
   */
  // TODO(doc): Güncel yıllık devlet katkısı üst sınırı (asgari ücrete endeksli) girilecek.
  annualStateContributionCap: 45000,

  /** Hesaplayıcıda varsayılan tahmini yıllık getiri oranı (%). Kullanıcı değiştirebilir. */
  // TODO(doc): Gerçekçi varsayılan getiri beklentisi netleşecek. Site sahibi örnek varsayımı: %50.
  defaultAnnualReturnRate: 0.5,

  /** Getiri oranı slider/girdi sınırları (%). Üst sınır site sahibi örneğine göre %120. */
  minAnnualReturnRate: 0,
  // TODO(doc): Üst getiri sınırı (%120) site sahibi örnek varsayımı; mevzuat/aktüeryal değer değil.
  maxAnnualReturnRate: 1.2,

  /**
   * Enflasyon varsayımı (reel/bugünkü değer hesabı için). Kullanıcı değiştirebilir.
   * Site sahibi örnek varsayımı: %32,5.
   */
  // TODO(doc): Enflasyon varsayımı örnek değerdir; resmî/gerçek oran değildir.
  defaultInflationRate: 0.325,
  minInflationRate: 0,
  maxInflationRate: 2.0,

  /** Süre (yıl) girdi sınırları. */
  minYears: 1,
  maxYears: 40,
  defaultYears: 10,

  /** Aylık katkı girdi sınırları (TL). Varsayılan site sahibi örneğine göre 7.500. */
  minMonthly: 100,
  maxMonthly: 1_000_000,
  // TODO(doc): Varsayılan aylık katkı (7.500) site sahibi örnek varsayımıdır.
  defaultMonthly: 7500,

  /**
   * Toplu (tek seferlik) yatırım girdi sınırları (TL). Site sahibi notu: toplu
   * yatırım modunda asgari giriş 1.000.000 TL.
   */
  // TODO(doc): Toplu yatırım alt sınırı (1.000.000) site sahibi örnek varsayımıdır.
  minLumpSum: 1_000_000,
  defaultLumpSum: 1_000_000,
  maxLumpSum: 100_000_000,
} as const;

// ─────────────────────────────────────────────────────────────────────────────
// SAĞLIK — Prim tahmin hesaplayıcısı sabitleri
// docs/03 §2: yaş / poliçe türü (TSS / ÖSS) / kapsam (bireysel/aile)
//   + ÖSS opsiyonel yurt dışı teminatı → kaba aylık aralık.
// ─────────────────────────────────────────────────────────────────────────────
export const SAGLIK = {
  /** Kaba aylık taban prim (TL) — tahmini. */
  // TODO(doc): Gerçek taban prim ve tüm katsayılar Doğukan'dan / tarifeden gelecek.
  // Site sahibi isteğiyle taban 2 KATINA çıkarıldı (600 → 1200); formül (formulas.ts)
  // lineer olduğundan tüm sağlık prim tahminleri (aylık/yıllık + aralık) iki katına çıkar.
  // Hâlâ YER TUTUCU / tahmini; sonuç ekranında "Tahmini değerdir" uyarısı korunur.
  basePremiumMonthly: 1200,

  /** Yaşa göre çarpan. Yaş arttıkça prim artar (basit lineer yer tutucu). */
  // TODO(doc): Gerçek yaş-prim eğrisi (yaş bandı tablosu) ile değiştirilecek.
  perYearOver18Factor: 0.03, // 18 yaş üstü her yıl için +%3

  /** TSS (tamamlayıcı, SGK'lı) primi ÖSS'ye göre daha düşük → indirim çarpanı. */
  // TODO(doc): TSS / ÖSS ayrımının gerçek etkisi netleşecek.
  tssDiscountFactor: 0.6, // TSS ~ ÖSS'nin %60'ı (kaba)

  /**
   * ÖSS (özel) yurt dışı teminatı seçilirse uygulanan prim çarpanı (yer tutucu).
   * docs/03 §2: yurt dışı teminatı yalnız ÖSS'de seçilebilir; TSS'de YOK.
   */
  // TODO(doc): ÖSS yurt dışı teminatı gerçek prim etkisi netleşecek (yer tutucu 1.25).
  ossAbroadFactor: 1.25, // yurt dışı teminatı ~ +%25 (kaba)

  /** Aile kapsamında ek kişi başına çarpan. */
  // TODO(doc): Aile/kişi sayısı gerçek fiyatlama mantığı netleşecek.
  perExtraPersonFactor: 0.7, // her ek kişi taban primin %70'i kadar ekler

  /** Tahmini aralık genişliği (±). Sonuç tek sayı değil bir ARALIK olarak verilir. */
  rangeSpread: 0.2, // ±%20

  /** Girdi sınırları. */
  minAge: 0,
  maxAge: 99,
  defaultAge: 30,
  maxPeople: 12,
} as const;

// ─────────────────────────────────────────────────────────────────────────────
// HAYAT — Prim tahmin hesaplayıcısı sabitleri
// docs/03: yaş / teminat tutarı / süre (yıl) / sigara → kaba prim tahmini.
// ─────────────────────────────────────────────────────────────────────────────
export const HAYAT = {
  /**
   * Teminat başına yıllık taban oran. Yıllık prim ~ teminat × bu oran × yaş/süre çarpanları.
   * Örn. 0.004 → 1.000.000 TL teminat için tabanda 4.000 TL/yıl.
   */
  // TODO(doc): Gerçek aktüeryal oran (mortalite tablosu) ile değiştirilecek.
  annualRatePerCoverage: 0.004,

  /** Yaşa göre artış: 30 yaş referans, her yıl için risk artışı. */
  // TODO(doc): Gerçek yaş-mortalite eğrisi girilecek.
  referenceAge: 30,
  perYearOverReferenceFactor: 0.04, // referans yaş üstü her yıl +%4

  /** Sigara kullananlar için risk çarpanı. */
  // TODO(doc): Gerçek sigara risk yüklemesi netleşecek.
  smokerFactor: 1.5,

  /** Uzun süreli poliçelerde küçük indirim (yıl başına). */
  // TODO(doc): Süreye bağlı fiyatlama gerçek mantıkla değişecek.
  perYearTermDiscount: 0.005, // her yıl için %0.5 indirim (azami sınırlı)
  maxTermDiscount: 0.15,

  /** Tahmini aralık genişliği (±). */
  rangeSpread: 0.2,

  /** Girdi sınırları. */
  minAge: 18,
  maxAge: 75,
  defaultAge: 30,
  minCoverage: 50_000,
  maxCoverage: 10_000_000,
  defaultCoverage: 500_000,
  minYears: 1,
  maxYears: 30,
  defaultYears: 10,
} as const;

// ─────────────────────────────────────────────────────────────────────────────
// HAYAT_VERGI — Birikimli hayat sigortası VERGİ AVANTAJI hesaplayıcısı sabitleri
// (docs/03 Hayat — "Birikim & Vergi Avantajı" modu). Basit yer tutucu:
//   yıllıkAvantaj ≈ indirilebilirPrim × gelirVergisiDilimiOranı
//
// ⚠️⚠️ Gerçek GVK (Gelir Vergisi Kanunu) bireysel sigorta/BES prim indirim kuralları,
// indirilebilir tutar oranı ve üst sınırı BELİRSİZ → aşağıdaki değerler YER TUTUCU'dur.
// Site sahibi gerçek mevzuat / mali müşavir teyidiyle YALNIZCA bu blok güncellenecek.
// ─────────────────────────────────────────────────────────────────────────────
export const HAYAT_VERGI = {
  /**
   * Ödenen primin vergiden indirilebilir kabul edilen oranı (yer tutucu).
   * Şu an %100 (tamamı indirilebilir varsayımı) — basit tutmak için.
   */
  // TODO(doc): Gerçek GVK indirim oranı (indirilebilir prim oranı) teyit edilecek (mali müşavir).
  deductibleRate: 1.0,

  /**
   * Yıllık indirilebilir prim ÜST SINIRI (TL). 0 → sınır YOK (yer tutucu).
   * Gerçek mevzuatta brüt asgari ücrete endeksli bir tavan bulunur.
   */
  // TODO(doc): Yıllık indirim üst sınırı (asgari ücrete endeksli) teyit edilecek (mali müşavir).
  annualDeductionCap: 0,

  /** Gelir vergisi dilimi seçenekleri (oran). docs/03: %15 / %20 / %27 / %35 / %40. */
  // TODO(doc): Güncel gelir vergisi tarifesi dilim oranları teyit edilecek.
  taxBracketRates: [0.15, 0.2, 0.27, 0.35, 0.4] as const,
  defaultTaxBracketRate: 0.2,

  /** Birikim/prim tutarı girdi sınırları (TL, yıllık). */
  minAnnualPremium: 0,
  maxAnnualPremium: 10_000_000,
  defaultAnnualPremium: 60_000,

  /** Süre (yıl) girdi sınırları. docs/03: 5–12 yıl vurgusu. */
  minYears: 5,
  maxYears: 12,
  defaultYears: 10,
} as const;

// NOT (Konut/DASK): docs/03 "🔧 opsiyonel — istenirse". Bu aşamada ATLANDI.
// TODO(doc): Konut/DASK hesaplayıcısı istenirse buraya KONUT sabitleri eklenip
// formulas.ts'e saf fonksiyon yazılacak (m² × birim_fiyat × bölge_katsayısı).
