// @do/products — ürün + form alanı tip tanımları (A yaklaşımı).
// Kaynak: docs/01 "A Yaklaşımı", docs/03 (ürün/form), docs/07 (çift dilli içerik).
//
// Aşama 1: Tip sistemi, otomatik form üretimi (RHF + Zod) için gerekli tüm
// alan metadata'sını taşıyacak şekilde genişletildi. Nihai form alanlarının
// İÇERİĞİ (hangi ürün hangi alanı içerir) hâlâ TASLAKTIR — Doğukan'dan gelince
// definitions.ts güncellenecek. // TODO(doc): docs/03 "netleşecekler".

/** İki dilli metin (TR varsayılan, EN ikincil). Bkz. docs/07. */
export interface LocalizedText {
  tr: string;
  en: string;
}

/**
 * Bir form alanının desteklenen girdi tipleri.
 * Kaynak: docs/03 "Alan Tipleri (Form Builder Sözlüğü)" — birebir.
 */
export type FieldType =
  | "text"
  | "tel"
  | "email"
  | "number"
  | "date"
  | "select"
  | "radio"
  | "checkbox"
  | "tcKimlik"
  | "plaka"
  | "file"
  // Zincirleme (cascade) adres seçimi — docs/03 "Zincirleme adres":
  // province (il) → district (ilçe, il'e bağlı) → neighborhood (mahalle, ilçe'ye bağlı).
  // İl/ilçe verisi pakette gömülü; mahalle sunucu API route'undan talebe göre gelir.
  | "province"
  | "district"
  | "neighborhood";

/** select / radio alanları için tek seçenek. */
export interface FieldOption {
  value: string;
  label: LocalizedText;
}

/**
 * Alan validasyon kuralları. Zod şeması bu metadata'dan TÜRETİLİR
 * (bkz. apps/web .../auto-form/schema.ts). Hepsi opsiyoneldir; verilmezse
 * yalnızca `required` kuralı uygulanır.
 */
export interface FieldValidation {
  /** number için alt/üst sınır. */
  min?: number;
  max?: number;
  /** text için uzunluk sınırı. */
  minLength?: number;
  maxLength?: number;
  /** Serbest regex (string'e uygulanır). */
  pattern?: string;
  /** file: kabul edilen MIME/uzantı (ör. "image/*"). */
  accept?: string;
  /** file: azami boyut (MB). */
  maxSizeMb?: number;
}

/**
 * Koşullu görünürlük kuralı (docs/03 "Koşullu alan görünürlüğü").
 * Alan, yalnızca `field` adlı BAŞKA bir alanın değeri `equals` ile eşleşince gösterilir.
 * `equals` dizi ise herhangi biriyle eşleşmesi yeterlidir.
 * Gizliyken: alan render EDİLMEZ ve Zod doğrulamasına DAHİL EDİLMEZ (zorunlu olsa bile).
 * Örn. saglik "kişi sayısı" yalnız kapsam="aile" iken görünür.
 */
export interface FieldVisibility {
  field: string;
  equals: string | string[];
}

/**
 * Zincirleme (cascade) bağımlılık (docs/03 "Zincirleme adres").
 * district alanı bir province alanına, neighborhood alanı bir district alanına bağlanır.
 * `parent` üst alanın `name`'idir; üst değişince bu alan sıfırlanır.
 */
export interface FieldCascade {
  parent: string;
}

/** Tek bir form alanı tanımı. */
export interface ProductField {
  /** payload JSON anahtarı ile birebir eşleşir (kararlı tutulmalı). */
  name: string;
  type: FieldType;
  required: boolean;
  label: LocalizedText;
  /** Girdi içi ipucu metni (opsiyonel). */
  placeholder?: LocalizedText;
  /** Etiket altı açıklayıcı yardım metni (opsiyonel). */
  help?: LocalizedText;
  /** "select" / "radio" tipleri için seçenekler. */
  options?: FieldOption[];
  /** Tip-spesifik validasyon kuralları. */
  validation?: FieldValidation;
  /**
   * Bu alan özel nitelikli kişisel veri mi (sağlık vb.)? KVKK 2. rıza tetikler.
   * Kaynak: docs/03 "özel durum", docs/06.
   */
  sensitive?: boolean;
  /**
   * Koşullu görünürlük (docs/03). Verilirse alan yalnızca koşul sağlanınca gösterilir
   * ve gizliyken doğrulamaya dahil edilmez.
   */
  showIf?: FieldVisibility;
  /**
   * Zincirleme adres bağımlılığı (docs/03). district/neighborhood alanlarında üst alanı
   * (il/ilçe) belirtir; üst seçim değişince bu alan otomatik sıfırlanır.
   */
  cascade?: FieldCascade;
  /**
   * Yalnızca `file` alanları için: true ise, kullanıcı yükleme butonuna basınca ÖNCE
   * "Ruhsat/araç fotoğrafı nasıl çekilir?" rehber modalı açılır; "Anladım" denince native
   * dosya seçici açılır. Trafik/Kasko ruhsat fotoğrafı alanlarında kullanılır (docs/03 §1/§6).
   * Bayrak yoksa normal (rehbersiz) dosya seçimi yapılır.
   */
  captureGuide?: boolean;
  /**
   * Form bölümü (docs/03 "Form bölümleri"). Alanlar başlıklı bölümlere gruplanır:
   *  - "kisi": Kişi bilgileri (Ad Soyad + TC Kimlik No) — "Kişi Bilgileri".
   *  - "iletisim": Telefon + E-posta — "İletişim".
   *  - "detay": Ürüne özel bilgiler ("Sigorta Bilgileri").
   * Verilmezse alan "detay" bölümünde sayılır.
   *
   * 2 adımlı (wizard) formda (docs/09 form UX):
   *  - Adım 1 ("Sigorta Bilgileri"): "detay" bölümü alanları.
   *  - Adım 2 ("İletişim Bilgileri"): "kisi" + "iletisim" alt başlıkları (+ KVKK rıza).
   * Bölüm sırası adım 2 içinde: kisi → iletisim.
   */
  section?: "kisi" | "iletisim" | "detay";
}

/**
 * Hesaplayıcı türü. Formüller Aşama 4'te `calculators/` altında YER TUTUCU olarak
 * uygulandı (formulas.ts + constants.ts). Bkz. docs/03, docs/08 Aşama 4.
 */
// TODO(doc): Gerçek katsayı/oran/limitler Doğukan'dan gelince calculators/constants.ts
// güncellenir (tek değişim noktası); formulas.ts ve bu tip değişmez.
export type CalculatorKind = "bes" | "saglik" | "hayat";

/**
 * Yerelleştirilmiş slug'lar (i18n). TR slug KANONİKTİR (eski URL/301 hedefleri TR).
 * EN sayfalar EN slug ile yayınlanır. Kaynak: docs/03 "Yerelleştirilmiş slug'lar".
 */
export interface LocalizedSlug {
  tr: string;
  en: string;
}

/** Tek bir sigorta ürünü tanımı. */
export interface ProductDefinition {
  /**
   * Kanonik URL slug'ı = `slugs.tr` (geriye dönük uyum; mevcut kullanımlar
   * `product.slug` ile TR kanonik slug'ı alır). Anlamlı URL (ör. "trafik").
   */
  slug: string;
  /** Locale -> slug eşlemesi (ör. { tr: "trafik", en: "traffic" }). docs/03. */
  slugs: LocalizedSlug;
  name: LocalizedText;
  /** Kart/SEO için kısa açıklama. */
  description: LocalizedText;
  /** Liste/kart ikonu — lucide-react ikon anahtarı (string). */
  icon: string;
  /**
   * Bu üründe özel nitelikli veri (sağlık/hayat) toplanıyor mu?
   * true ise formda KVKK 2. (özel nitelikli) rıza kutusu gösterilir. docs/06.
   */
  sensitive?: boolean;
  /** Ürün, hesaplayıcıya sahip mi? (docs/03 hesaplayıcı durumu) */
  hasCalculator: boolean;
  /** hasCalculator true ise hangi hesaplayıcı kullanılır. */
  calculator?: CalculatorKind;
  /** Ürüne özel form alanları; `payload` JSON anahtarları ile birebir eşleşir. */
  fields: ProductField[];
}

/** Slug'a göre indekslenmiş ürün kataloğu. */
export type ProductCatalog = Record<string, ProductDefinition>;
