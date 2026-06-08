// Site geneli sabitler — iletişim, anlaşmalı şirketler, sosyal medya, NAP.
// Kaynak: docs/02 (İletişim Bilgileri), docs/07 (Yerel SEO / NAP tutarlılığı),
// docs/09 (anlaşmalı şirket güven şeridi).
//
// ⚠️ YER TUTUCULAR: Aşağıdaki bazı değerler docs'ta "🔧 netleşecek" işaretli.
// TODO(doc): Gerçek anlaşmalı sigorta şirketleri listesi (docs/09), sosyal medya
// hesapları ve harita koordinatları (docs/02) Doğukan'dan gelince güncellenecek.

/** Birincil iletişim kanalları (docs/02 — teyit edilmiş bilgiler). */
export const contact = {
  /** WhatsApp + telefon. docs/02: +90 546 527 28 82 */
  phoneDisplay: "0546 527 28 82",
  phoneE164: "+905465272882",
  /** wa.me uluslararası format (başında + olmadan). */
  whatsapp: "905465272882",
  email: "dogukanozgan@akplansigorta.com.tr",
  address: {
    street: "Mecidiyeköy Mah. Büyükdere Cad. Kuğu İş Hanı No:81 D:4",
    district: "Şişli",
    city: "İstanbul",
    country: "TR",
    postalCode: "34387",
  },
  /** Tam adres tek satır. */
  fullAddress: "Mecidiyeköy Mah. Büyükdere Cad. Kuğu İş Hanı No:81 D:4, Şişli/İstanbul",
} as const;

/** Google Maps gömme URL'i (adrese göre arama — koordinat gelince değişir).
 *  TODO(doc): Gerçek konum koordinatları/Place ID gelince embed güncellenecek. */
export const mapEmbedUrl =
  "https://www.google.com/maps?q=" + encodeURIComponent(contact.fullAddress) + "&output=embed";

export const mapLinkUrl =
  "https://www.google.com/maps/search/?api=1&query=" + encodeURIComponent(contact.fullAddress);

/**
 * Anlaşmalı sigorta şirketleri (güven şeridi — docs/09).
 * Doğukan'ın GERÇEK anlaşmalı şirket listesi (2026-06-08).
 * Not: Logo görselleri istenirse ileride eklenir; şu an metin tabanlı şerit.
 */
export const partnerCompanies: string[] = [
  "Quick Sigorta",
  "Ethica Sigorta",
  "Acıbadem Sigorta",
  "Anadolu Sigorta",
  "Allianz",
  "Sompo Sigorta",
  "Türk Nippon Sigorta",
  "Unico Sigorta",
  "Koru Sigorta",
  "HDI Sigorta",
  "HDI Fiba Emeklilik",
  "Aksigorta",
  "Doğa Sigorta",
  "Türkiye Sigorta",
  "AXA",
  "Atlas Sigorta",
  "HepiYi Sigorta",
  "Neova Sigorta",
  "Ray Sigorta",
  "Ankara Sigorta",
  "Mapfre",
  "Zurich Sigorta",
];

/**
 * Sosyal medya linkleri (footer). ⚠️ YER TUTUCU (# placeholder).
 * TODO(doc): Gerçek sosyal medya hesapları gelince href güncellenecek (docs/07).
 */
export const social = {
  instagram: "#",
  linkedin: "#",
  facebook: "#",
} as const;

/** Kuruluş/marka. */
export const brandName = "Doğukan Özgan";
export const siteUrl = "https://dogukanozgan.com";
