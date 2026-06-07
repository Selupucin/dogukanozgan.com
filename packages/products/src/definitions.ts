// @do/products — ürün tanımları (TEK KAYNAK, A yaklaşımı).
// Kaynak: docs/01 "A Yaklaşımı", docs/03 (ürün/form alanları), docs/02 (slug/rota).
//
// ⚠️ Aşama 1: Aşağıdaki ürünler ve form alanları docs/03'teki TASLAK tablolara
// göre tanımlanmıştır. Nihai (gerçek) alanlar Doğukan'dan gelince güncellenecek.
// Yeni ürün eklemek = bu nesneye yeni bir kayıt eklemek. Her // TODO(doc):
// işareti, dökümanda "netleşecek" olarak işaretli noktayı belirtir.

import type { ProductDefinition, ProductCatalog, ProductField, LocalizedSlug } from "./types";

/** Desteklenen diller (slug eşlemesi için). docs/07. */
export type ProductLocale = keyof LocalizedSlug; // "tr" | "en"

// ─────────────────────────────────────────────────────────────────────────────
// Ortak alanlar (docs/03 "Ortak Kurallar — Tüm Formlarda")
// Ad Soyad + Telefon zorunlu, E-posta opsiyonel.
// NOT: KVKK rıza kutusu(ları) form alanı OLARAK tutulmaz; AutoForm bileşeni
// üründeki `sensitive` bayrağına göre rıza kutularını otomatik ekler (docs/03/06).
// ─────────────────────────────────────────────────────────────────────────────

const adSoyad: ProductField = {
  name: "adSoyad",
  type: "text",
  required: true,
  label: { tr: "Ad Soyad", en: "Full Name" },
  placeholder: { tr: "Adınız ve soyadınız", en: "Your full name" },
  validation: { minLength: 2, maxLength: 80 },
};

const telefon: ProductField = {
  name: "telefon",
  type: "tel",
  required: true,
  label: { tr: "Telefon", en: "Phone" },
  placeholder: { tr: "05xx xxx xx xx", en: "05xx xxx xx xx" },
};

// docs/03 "🔧 netleşecek": e-posta zorunlu mu opsiyonel mi → şimdilik opsiyonel.
// TODO(doc): E-posta zorunluluğu netleşince `required` güncellenir.
const eposta: ProductField = {
  name: "eposta",
  type: "email",
  required: false,
  label: { tr: "E-posta", en: "Email" },
  placeholder: { tr: "ornek@eposta.com", en: "you@example.com" },
};

/**
 * İl seçimi — `province` tipi (81 il @do/products/locations'tan otomatik gelir).
 * docs/03 "Zincirleme adres". Değer olarak il ID'si (string) saklanır.
 */
const il: ProductField = {
  name: "il",
  type: "province",
  required: true,
  label: { tr: "İl", en: "Province" },
};

/**
 * Zincirleme adres alanları (docs/03): İl → İlçe → Mahalle.
 * İlçe ile (il'e bağlı) ve mahalle (ilçe'ye bağlı) seçildiği üst alan değişince sıfırlanır.
 * İl/ilçe verisi pakette gömülü; mahalle sunucu API route'undan talebe göre gelir.
 * DASK/Konut formlarında kullanılır.
 */
const ilceCascade: ProductField = {
  name: "ilce",
  type: "district",
  required: true,
  label: { tr: "İlçe", en: "District" },
  cascade: { parent: "il" },
};

const mahalleCascade: ProductField = {
  name: "mahalle",
  type: "neighborhood",
  required: false,
  label: { tr: "Mahalle", en: "Neighborhood" },
  cascade: { parent: "ilce" },
};

// ─────────────────────────────────────────────────────────────────────────────
// Ürünler (docs/03 ürün listesi — taslak alanlar)
// ─────────────────────────────────────────────────────────────────────────────

const trafik: ProductDefinition = {
  slug: "trafik", // docs/03 §1 (= slugs.tr, kanonik)
  slugs: { tr: "trafik", en: "traffic" }, // docs/03 slug eşleme tablosu
  name: { tr: "Trafik Sigortası", en: "Traffic Insurance" },
  description: {
    tr: "Zorunlu trafik sigortanız için 20+ şirketten en uygun teklifi karşılaştırın.",
    en: "Compare the most suitable offer from 20+ companies for your mandatory traffic insurance.",
  },
  icon: "Car",
  hasCalculator: false, // docs/03: fiyat resmî tarifeye bağlı, hesaplanamaz
  fields: [
    adSoyad,
    telefon,
    {
      name: "tcKimlik",
      type: "tcKimlik",
      required: true,
      label: { tr: "TC Kimlik No", en: "ID Number" },
      placeholder: { tr: "11 haneli", en: "11 digits" },
    },
    {
      name: "plaka",
      type: "plaka",
      required: true,
      label: { tr: "Plaka", en: "License Plate" },
      placeholder: { tr: "34 ABC 123", en: "34 ABC 123" },
    },
    {
      name: "dogumTarihi",
      type: "date",
      required: true,
      label: { tr: "Doğum Tarihi", en: "Date of Birth" },
    },
    {
      name: "ruhsatTarihi",
      type: "date",
      required: false,
      label: { tr: "Ruhsat / Tescil Tarihi", en: "Registration Date" },
    },
    // docs/03: fotoğraf yükleme VAR; zorunlu mu opsiyonel mi 🔧 netleşecek.
    // Upload MANTIĞI Aşama 2'de (Supabase Storage). Şimdilik alan TİPİ yer alır.
    // TODO(doc): Ruhsat fotoğrafı zorunlu mu? Aşama 2'de upload bağlanacak.
    {
      name: "ruhsatFoto",
      type: "file",
      required: false,
      label: { tr: "Ruhsat / Araç Fotoğrafı", en: "Registration / Vehicle Photo" },
      help: {
        tr: "Ruhsatınızın fotoğrafını yüklerseniz teklif süreci hızlanır.",
        en: "Uploading your registration photo speeds up the quote process.",
      },
      validation: { accept: "image/*", maxSizeMb: 10 },
    },
    eposta,
  ],
};

const saglik: ProductDefinition = {
  slug: "saglik", // docs/03 §2 (= slugs.tr, kanonik)
  slugs: { tr: "saglik", en: "health" }, // docs/03 slug eşleme tablosu
  name: { tr: "Sağlık Sigortası", en: "Health Insurance" },
  description: {
    tr: "Özel ve tamamlayıcı sağlık sigortasında size en uygun planı birlikte seçelim.",
    en: "Let's choose the most suitable private or complementary health plan together.",
  },
  icon: "HeartPulse",
  sensitive: true, // docs/03: kronik hastalık = özel nitelikli veri → 2. rıza
  hasCalculator: true,
  calculator: "saglik",
  fields: [
    adSoyad,
    telefon,
    {
      name: "dogumTarihi",
      type: "date",
      required: true,
      label: { tr: "Doğum Tarihi", en: "Date of Birth" },
      help: { tr: "Yaş hesaplaması için.", en: "Used to calculate age." },
    },
    {
      name: "cinsiyet",
      type: "radio",
      required: true,
      label: { tr: "Cinsiyet", en: "Gender" },
      options: [
        { value: "kadin", label: { tr: "Kadın", en: "Female" } },
        { value: "erkek", label: { tr: "Erkek", en: "Male" } },
      ],
    },
    {
      name: "sgk",
      type: "checkbox",
      // docs/03: SGK'lı olmak zorunlu DEĞİL — kişi sigortalı olmayabilir. Bu yüzden
      // OPSİYONEL: işaretlenmese de form geçerlidir (TSS/Özel ayrımı bilgilendiricidir).
      required: false,
      label: { tr: "SGK'lıyım (TSS/Özel ayrımı)", en: "I have SGK coverage (TSS/Private)" },
    },
    {
      name: "sigara",
      type: "checkbox",
      required: false,
      label: { tr: "Sigara kullanıyorum", en: "I am a smoker" },
    },
    // Sağlık verisi (özel nitelikli) → sensitive: true.
    {
      name: "kronikHastalik",
      type: "radio",
      required: false,
      sensitive: true,
      label: { tr: "Mevcut kronik hastalık", en: "Existing chronic illness" },
      options: [
        { value: "yok", label: { tr: "Yok", en: "None" } },
        { value: "var", label: { tr: "Var", en: "Yes" } },
      ],
    },
    il,
    {
      name: "kapsam",
      type: "radio",
      required: true,
      label: { tr: "Kapsam", en: "Coverage" },
      options: [
        { value: "bireysel", label: { tr: "Bireysel", en: "Individual" } },
        { value: "aile", label: { tr: "Aile", en: "Family" } },
      ],
    },
    {
      name: "kisiSayisi",
      type: "number",
      // docs/03 "Koşullu alan görünürlüğü": yalnızca kapsam = "aile" iken görünür.
      // Görünür olduğunda zorunludur; gizliyken doğrulamaya dahil edilmez.
      required: true,
      label: { tr: "Aile kişi sayısı", en: "Number of family members" },
      validation: { min: 1, max: 12 },
      showIf: { field: "kapsam", equals: "aile" },
    },
  ],
};

const bireyselEmeklilik: ProductDefinition = {
  slug: "bireysel-emeklilik", // docs/03 §3 (= slugs.tr, kanonik)
  slugs: { tr: "bireysel-emeklilik", en: "private-pension" }, // docs/03 slug eşleme
  name: { tr: "Bireysel Emeklilik (BES)", en: "Private Pension (BES)" },
  description: {
    tr: "Devlet katkısıyla geleceğinizi bugünden planlayın; birikiminizi hesaplayın.",
    en: "Plan your future today with state contribution; calculate your savings.",
  },
  icon: "PiggyBank",
  hasCalculator: true,
  calculator: "bes",
  fields: [
    adSoyad,
    telefon,
    {
      name: "yas",
      type: "number",
      required: true,
      label: { tr: "Yaş", en: "Age" },
      validation: { min: 18, max: 99 },
    },
    {
      name: "aylikTutar",
      type: "number",
      required: true,
      label: { tr: "Aylık ödemek istenen tutar (TL)", en: "Desired monthly contribution (TRY)" },
      validation: { min: 0 },
    },
    {
      name: "hedef",
      type: "radio",
      required: false,
      label: { tr: "Hedef", en: "Goal" },
      options: [
        { value: "emeklilik", label: { tr: "Emeklilik", en: "Retirement" } },
        { value: "birikim", label: { tr: "Birikim", en: "Savings" } },
      ],
    },
  ],
};

const hayat: ProductDefinition = {
  slug: "hayat", // docs/03 §4 (= slugs.tr, kanonik)
  slugs: { tr: "hayat", en: "life" }, // docs/03 slug eşleme tablosu
  name: { tr: "Hayat Sigortası", en: "Life Insurance" },
  description: {
    tr: "Sevdiklerinizi güvence altına alın; teminat, süre ve yaşınıza göre teklifinizi alın.",
    en: "Protect your loved ones; get a quote based on coverage, term and your age.",
  },
  icon: "HeartHandshake",
  // docs/03 §4 Not: "Sağlık durumu" sorulursa özel nitelikli veri → 2. rıza.
  // Hayat sigortasında sigara/sağlık beyanı alındığından sensitive: true.
  sensitive: true,
  hasCalculator: true,
  calculator: "hayat",
  fields: [
    adSoyad,
    telefon,
    {
      name: "dogumTarihi",
      type: "date",
      required: true,
      label: { tr: "Doğum Tarihi", en: "Date of Birth" },
      help: { tr: "Yaş hesaplaması için.", en: "Used to calculate age." },
    },
    {
      name: "cinsiyet",
      type: "radio",
      required: false,
      label: { tr: "Cinsiyet", en: "Gender" },
      options: [
        { value: "kadin", label: { tr: "Kadın", en: "Female" } },
        { value: "erkek", label: { tr: "Erkek", en: "Male" } },
      ],
    },
    {
      name: "teminatTutari",
      type: "number",
      required: false,
      label: { tr: "Teminat tutarı (istenen, TL)", en: "Desired coverage amount (TRY)" },
      validation: { min: 0 },
    },
    {
      name: "sure",
      type: "number",
      required: false,
      label: { tr: "Süre (yıl)", en: "Term (years)" },
      validation: { min: 1, max: 40 },
    },
    {
      name: "amac",
      type: "radio",
      required: false,
      label: { tr: "Amaç", en: "Purpose" },
      options: [
        { value: "kredi", label: { tr: "Kredi", en: "Loan" } },
        { value: "birikim", label: { tr: "Birikim", en: "Savings" } },
        { value: "koruma", label: { tr: "Koruma", en: "Protection" } },
      ],
    },
    {
      name: "sigara",
      type: "checkbox",
      required: false,
      // Sağlık/yaşam tarzı beyanı → özel nitelikli veriye yakın; sensitive işaretli.
      sensitive: true,
      label: { tr: "Sigara kullanıyorum", en: "I am a smoker" },
    },
  ],
};

const konut: ProductDefinition = {
  slug: "konut", // docs/03 §5 (= slugs.tr, kanonik)
  // docs/03: EN slug "home-insurance" (yalın "home" anasayfayla karışmasın diye).
  slugs: { tr: "konut", en: "home-insurance" },
  name: { tr: "Konut Sigortası", en: "Home Insurance" },
  description: {
    tr: "Eviniz ve eşyalarınız için kapsamlı koruma; size özel teklif alın.",
    en: "Comprehensive protection for your home and belongings; get a tailored quote.",
  },
  icon: "Home",
  // docs/03: Konut hesaplayıcısı 🔧 netleşecek → şimdilik yok.
  // TODO(doc): Konut/DASK hesaplayıcısı istenirse Aşama 4'te eklenir.
  hasCalculator: false,
  fields: [
    adSoyad,
    telefon,
    // docs/03: Zincirleme adres — İl → İlçe → Mahalle (il/ilçe zorunlu, mahalle ops.).
    il,
    ilceCascade,
    mahalleCascade,
    {
      name: "brutM2",
      type: "number",
      required: true,
      label: { tr: "Brüt m²", en: "Gross m²" },
      validation: { min: 1, max: 2000 },
    },
    {
      name: "yapiTarzi",
      type: "select",
      required: true,
      label: { tr: "Yapı tarzı", en: "Construction type" },
      options: [
        { value: "betonarme", label: { tr: "Betonarme", en: "Reinforced concrete" } },
        { value: "yigma", label: { tr: "Yığma", en: "Masonry" } },
        { value: "celik", label: { tr: "Çelik", en: "Steel" } },
      ],
    },
    {
      name: "binaYasi",
      type: "number",
      required: true,
      label: { tr: "Bina yaşı / inşaat yılı", en: "Building age / construction year" },
      validation: { min: 0 },
    },
    {
      name: "kat",
      type: "number",
      required: false,
      label: { tr: "Bulunduğu kat", en: "Floor" },
    },
    {
      name: "mulkTipi",
      type: "radio",
      required: true,
      label: { tr: "Mülk tipi", en: "Property type" },
      options: [
        { value: "evSahibi", label: { tr: "Ev sahibi", en: "Owner" } },
        { value: "kiraci", label: { tr: "Kiracı", en: "Tenant" } },
      ],
    },
    {
      name: "esyaBedeli",
      type: "number",
      required: false,
      label: { tr: "Eşya bedeli (TL)", en: "Contents value (TRY)" },
      validation: { min: 0 },
    },
  ],
};

// ─────────────────────────────────────────────────────────────────────────────
// Yeni ürünler (docs/03 "🔮 Olası Ek Ürünler" → tanımlandı): DASK, Kasko, Seyahat.
// ⚠️ TASLAK alanlar — // TODO(doc): nihai alanlar Doğukan'dan gelince güncellenir.
// Üçü de hesaplayıcısız (hasCalculator: false).
// ─────────────────────────────────────────────────────────────────────────────

const dask: ProductDefinition = {
  slug: "dask", // kanonik (= slugs.tr)
  // docs/03: EN slug — DASK marka adı yaygın, ancak EN okur için açıklayıcı
  // "compulsory-earthquake" tercih edildi (SEO + niyet netliği).
  slugs: { tr: "dask", en: "compulsory-earthquake" },
  name: { tr: "Zorunlu Deprem Sigortası (DASK)", en: "Compulsory Earthquake Insurance (DASK)" },
  description: {
    tr: "Konutunuz için zorunlu deprem sigortası (DASK) poliçenizi hızlıca düzenleyelim.",
    en: "Let's quickly arrange your compulsory earthquake (DASK) policy for your home.",
  },
  icon: "Building2",
  hasCalculator: false, // docs/03: DASK tarifesi 🔧 netleşecek → şimdilik hesaplayıcı yok
  // TODO(doc): DASK alanları TASLAK — nihai alanlar netleşecek (docs/03).
  fields: [
    adSoyad,
    telefon,
    // docs/03: Zincirleme adres — İl → İlçe → Mahalle (il/ilçe zorunlu, mahalle ops.).
    il,
    ilceCascade,
    mahalleCascade,
    {
      name: "binaYapiTarzi",
      type: "select",
      required: true,
      label: { tr: "Bina yapı tarzı", en: "Building construction type" },
      options: [
        { value: "betonarme", label: { tr: "Betonarme", en: "Reinforced concrete" } },
        { value: "yigma", label: { tr: "Yığma", en: "Masonry" } },
        { value: "diger", label: { tr: "Diğer", en: "Other" } },
      ],
    },
    {
      name: "brutM2",
      type: "number",
      required: true,
      label: { tr: "Brüt m²", en: "Gross m²" },
      validation: { min: 1, max: 2000 },
    },
    {
      name: "binaInsaYili",
      type: "number",
      required: true,
      label: { tr: "Bina inşa yılı", en: "Year of construction" },
      validation: { min: 1900, max: 2100 },
    },
    {
      name: "katSayisi",
      type: "number",
      required: false,
      label: { tr: "Bina kat sayısı", en: "Number of floors" },
      validation: { min: 1, max: 100 },
    },
    {
      name: "daireKati",
      type: "number",
      required: false,
      label: { tr: "Dairenin bulunduğu kat", en: "Floor of the flat" },
    },
    eposta,
  ],
};

const kasko: ProductDefinition = {
  slug: "kasko", // kanonik (= slugs.tr)
  // docs/03: EN slug — "kasko" tek kelime uluslararası anlaşılır değil; açıklayıcı
  // "comprehensive-auto" tercih edildi.
  slugs: { tr: "kasko", en: "comprehensive-auto" },
  name: { tr: "Kasko Sigortası", en: "Comprehensive Auto Insurance" },
  description: {
    tr: "Aracınız için kapsamlı kasko teminatında 20+ şirketten en uygun teklifi karşılaştırın.",
    en: "Compare the best comprehensive auto cover from 20+ companies for your vehicle.",
  },
  icon: "CarFront",
  hasCalculator: false, // docs/03: kasko primi şirkete/araca bağlı → hesaplayıcı yok
  // TODO(doc): Kasko alanları TASLAK — nihai alanlar netleşecek (docs/03).
  fields: [
    adSoyad,
    telefon,
    {
      name: "plaka",
      type: "plaka",
      required: true,
      label: { tr: "Plaka", en: "License Plate" },
      placeholder: { tr: "34 ABC 123", en: "34 ABC 123" },
    },
    {
      name: "marka",
      type: "text",
      required: true,
      label: { tr: "Araç markası", en: "Vehicle make" },
      placeholder: { tr: "Örn. Renault", en: "e.g. Renault" },
    },
    {
      name: "model",
      type: "text",
      required: true,
      label: { tr: "Model", en: "Model" },
      placeholder: { tr: "Örn. Clio", en: "e.g. Clio" },
    },
    {
      name: "modelYili",
      type: "number",
      required: true,
      label: { tr: "Model yılı", en: "Model year" },
      validation: { min: 1950, max: 2100 },
    },
    {
      name: "kullanimTarzi",
      type: "radio",
      required: true,
      label: { tr: "Kullanım tarzı", en: "Usage type" },
      options: [
        { value: "hususi", label: { tr: "Hususi", en: "Private" } },
        { value: "ticari", label: { tr: "Ticari", en: "Commercial" } },
      ],
    },
    {
      name: "dogumTarihi",
      type: "date",
      required: true,
      label: { tr: "Doğum Tarihi", en: "Date of Birth" },
    },
    // docs/03: Trafik'teki gibi ruhsat + araç fotoğrafı (opsiyonel; teklifi hızlandırır).
    // Yükleme Aşama 2 altyapısıyla (Vercel Blob) çalışır. // TODO(doc): zorunluluk netleşecek.
    {
      name: "ruhsatFoto",
      type: "file",
      required: false,
      label: { tr: "Ruhsat Fotoğrafı", en: "Registration Photo" },
      help: {
        tr: "Ruhsatınızın fotoğrafını yüklerseniz teklif süreci hızlanır.",
        en: "Uploading your registration photo speeds up the quote process.",
      },
      validation: { accept: "image/*", maxSizeMb: 10 },
    },
    {
      name: "aracFoto",
      type: "file",
      required: false,
      label: { tr: "Araç Fotoğrafı", en: "Vehicle Photo" },
      help: {
        tr: "Aracınızın fotoğrafı, doğru teklif için yardımcı olur.",
        en: "A photo of your vehicle helps us prepare an accurate quote.",
      },
      validation: { accept: "image/*", maxSizeMb: 10 },
    },
    eposta,
  ],
};

const seyahat: ProductDefinition = {
  slug: "seyahat", // kanonik (= slugs.tr)
  slugs: { tr: "seyahat", en: "travel" },
  name: { tr: "Seyahat Sağlık Sigortası", en: "Travel Health Insurance" },
  description: {
    tr: "Yurt dışı seyahatleriniz ve vize başvurularınız için seyahat sağlık sigortanızı alın.",
    en: "Get travel health insurance for your trips abroad and visa applications.",
  },
  icon: "Plane",
  // NOT: Seyahatte sağlık VERİSİ sorulmuyor (sadece tarih/ülke/amaç) → sensitive DEĞİL.
  hasCalculator: false,
  // TODO(doc): Seyahat alanları TASLAK — nihai alanlar netleşecek (docs/03).
  fields: [
    adSoyad,
    telefon,
    {
      name: "dogumTarihi",
      type: "date",
      required: true,
      label: { tr: "Doğum Tarihi", en: "Date of Birth" },
    },
    {
      name: "gidilecekUlkeBolge",
      type: "text",
      required: true,
      label: { tr: "Gidilecek ülke / bölge", en: "Destination country / region" },
      placeholder: { tr: "Örn. Schengen / Almanya", en: "e.g. Schengen / Germany" },
    },
    {
      name: "baslangicTarihi",
      type: "date",
      required: true,
      label: { tr: "Seyahat başlangıç tarihi", en: "Trip start date" },
    },
    {
      name: "bitisTarihi",
      type: "date",
      required: true,
      label: { tr: "Seyahat bitiş tarihi", en: "Trip end date" },
    },
    {
      name: "kisiSayisi",
      type: "number",
      required: true,
      label: { tr: "Kişi sayısı", en: "Number of people" },
      validation: { min: 1, max: 20 },
    },
    {
      name: "seyahatAmaci",
      type: "radio",
      required: false,
      label: { tr: "Seyahat amacı", en: "Purpose of travel" },
      options: [
        { value: "turistik", label: { tr: "Turistik", en: "Tourism" } },
        { value: "is", label: { tr: "İş", en: "Business" } },
        { value: "egitim", label: { tr: "Eğitim", en: "Education" } },
      ],
    },
    eposta,
  ],
};

// ─────────────────────────────────────────────────────────────────────────────
// Kurumsal Anlaşma (docs/00 K16, docs/03 §9) — KATALOĞUN EN SONUNDA.
// Firmasındaki kişileri/araçları topluca sigortalatmak için iletişime geçmek
// isteyenlere yönelik bir LEAD ürünü. Hesaplayıcı YOK; yalnızca temel iletişim
// alanları + opsiyonel not. Bireysel ürünlerden ayrı, kurumsal bir lead kanalı.
// ─────────────────────────────────────────────────────────────────────────────
const kurumsal: ProductDefinition = {
  slug: "kurumsal", // kanonik (= slugs.tr)
  slugs: { tr: "kurumsal", en: "corporate" },
  name: { tr: "Kurumsal Anlaşma", en: "Corporate Agreement" },
  description: {
    tr: "Çalışanlarınız, araç filonuz ve iş yeriniz için kurumsal sigorta anlaşması; toplu çözüm için iletişime geçin.",
    en: "Corporate insurance agreement for your employees, vehicle fleet and workplace; get in touch for a tailored bulk solution.",
  },
  icon: "Building",
  hasCalculator: false,
  fields: [
    adSoyad,
    {
      name: "firmaAdi",
      type: "text",
      required: true,
      label: { tr: "Firma Adı", en: "Company Name" },
      placeholder: { tr: "Şirketinizin adı", en: "Your company's name" },
      validation: { minLength: 2, maxLength: 120 },
    },
    telefon,
    { ...eposta, required: false },
    {
      name: "mesaj",
      type: "text",
      required: false,
      label: { tr: "Kısa not (opsiyonel)", en: "Short note (optional)" },
      placeholder: {
        tr: "İhtiyacınızı kısaca yazabilirsiniz (örn. 25 çalışan + 4 araç).",
        en: "Briefly describe your need (e.g. 25 employees + 4 vehicles).",
      },
      validation: { maxLength: 500 },
    },
  ],
};

/**
 * Tüm sigorta ürünleri slug -> tanım eşlemesi.
 * Yeni ürün eklemek = buraya bir nesne eklemek (bkz. docs/01).
 * TODO(doc): Ferdi Kaza, İş Yeri vb. ileride eklenecek (docs/03 "🔮 Olası Ek Ürünler").
 * Hayat → Aşama 4'te; DASK/Kasko/Seyahat → bu görevde eklendi (docs/03).
 */
export const products: ProductCatalog = {
  [trafik.slug]: trafik,
  [kasko.slug]: kasko,
  [saglik.slug]: saglik,
  [bireyselEmeklilik.slug]: bireyselEmeklilik,
  [hayat.slug]: hayat,
  [konut.slug]: konut,
  [dask.slug]: dask,
  [seyahat.slug]: seyahat,
  // EN SONDA — kurumsal lead ürünü (docs/03 §9).
  [kurumsal.slug]: kurumsal,
};

/** Slug'a göre ürün getirir (yoksa undefined). */
export function getProduct(slug: string): ProductDefinition | undefined {
  return products[slug];
}

/** Tüm ürünlerin dizi hâli (listeleme/sitemap için). */
export function getAllProducts(): ProductDefinition[] {
  return Object.values(products);
}

/** Tüm ürün slug'ları (KANONİK = TR; generateStaticParams TR için). */
export function getAllProductSlugs(): string[] {
  return Object.keys(products);
}

// ─────────────────────────────────────────────────────────────────────────────
// Yerelleştirilmiş slug yardımcıları (i18n). docs/03 slug eşleme tablosu.
// TR kanoniktir; EN sayfalar EN slug ile yayınlanır.
// ─────────────────────────────────────────────────────────────────────────────

/** Bir ürünün verilen locale'deki slug'ını döndürür (ör. trafik → traffic). */
export function getLocalizedSlug(product: ProductDefinition, locale: ProductLocale): string {
  return product.slugs[locale];
}

/**
 * Verilen locale + YEREL slug'tan ürünü bulur (ör. en/traffic → trafik ürünü).
 * Bulunamazsa undefined. Rota çözümünde kullanılır.
 */
export function getProductByLocalizedSlug(
  locale: ProductLocale,
  slug: string,
): ProductDefinition | undefined {
  return getAllProducts().find((p) => p.slugs[locale] === slug);
}

/** Bir locale için TÜM yerel ürün slug'ları (generateStaticParams için). */
export function getLocalizedProductSlugs(locale: ProductLocale): string[] {
  return getAllProducts().map((p) => p.slugs[locale]);
}
