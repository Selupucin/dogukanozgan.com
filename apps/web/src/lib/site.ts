// Site geneli sabitler — iletişim, anlaşmalı şirketler, sosyal medya, NAP.
// Kaynak: docs/02 (İletişim Bilgileri), docs/07 (Yerel SEO / NAP tutarlılığı),
// docs/09 (anlaşmalı şirket güven şeridi).
//
// Gerçek ofis konumu/koordinatı Doğukan'dan teyit edildi (2026-06-10, Akplan Sigorta).

/** Birincil iletişim kanalları (docs/02 — teyit edilmiş bilgiler). */
export const contact = {
  /** WhatsApp + telefon. docs/02: +90 546 527 28 82 */
  phoneDisplay: "0546 527 28 82",
  phoneE164: "+905465272882",
  /** wa.me uluslararası format (başında + olmadan). */
  whatsapp: "905465272882",
  email: "dogukanozgan@akplansigorta.com.tr",
  address: {
    // Gerçek ofis adresi (Doğukan onayladı, 2026-06-10) — Akplan Sigorta bünyesinde.
    street: "Büyükdere Cad. Kuğu İş Hanı No:81 Asma Kat 2",
    district: "Şişli",
    city: "İstanbul",
    country: "TR",
    postalCode: "34387",
  },
  /** Tam adres tek satır (NAP — footer/iletişim/JSON-LD tutarlı). */
  fullAddress: "Mecidiyeköy Mah., Büyükdere Cad., Kuğu İş Hanı No:81, Asma Kat 2, Şişli / İstanbul",
  /** Ofis konumu (Akplan Sigorta Aracılık Hizmetleri) — JSON-LD geo + harita pini. */
  geo: { lat: 41.066876, lng: 28.9994269 },
} as const;

/** Google Maps gömme URL'i — resmi "Embed a map" (pb=) URL'i; etiketli işletme pini
 *  (Akplan Sigorta Aracılık Hizmetleri), API key gerektirmez. */
export const mapEmbedUrl =
  "https://www.google.com/maps/embed?pb=!1m14!1m8!1m3!1d188.0063525076916!2d28.999446081595785!3d41.06677086891817!3m2!1i1024!2i768!4f13.1!3m3!1m2!1s0x14cab78273f8de7f%3A0x417e3d042ec12171!2sAkplan%20Sigorta%20Arac%C4%B1l%C4%B1k%20Hizmetleri!5e0!3m2!1str!2sus!4v1781082804145!5m2!1str!2sus";

/** "Haritada Aç / Yol tarifi" — Doğukan'ın paylaştığı resmi işletme konum linki. */
export const mapLinkUrl = "https://maps.app.goo.gl/jjxuS7UgeYc7ECrn9";

/** Çalışma saatleri (sitedeki "Hafta içi 09:00–18:00" ile birebir) — JSON-LD
 *  openingHoursSpecification kaynağı. Hafta içi = Pzt–Cuma. */
export const openingHours = {
  dayOfWeek: ["Monday", "Tuesday", "Wednesday", "Thursday", "Friday"],
  opens: "09:00",
  closes: "18:00",
} as const;

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
 * Sosyal medya linkleri (footer + JSON-LD sameAs). Gerçek hesaplar (2026-06-10).
 * docs/07: marka-entity sosyal profilleri sameAs ile Google'a bildirilir.
 */
export const social = {
  instagram: "https://www.instagram.com/mdgksigortacim/",
  linkedin: "https://www.linkedin.com/in/dogukan-%C3%B6zgan-214508207/",
  facebook: "https://www.facebook.com/profile.php?id=61584745201761",
} as const;

/** Kuruluş/marka. */
export const brandName = "Doğukan Özgan";
export const siteUrl = "https://dogukanozgan.com";
