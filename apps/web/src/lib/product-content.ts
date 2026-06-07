// Ürün TANIM/REKLAM sayfası içerikleri (docs/02 "Ürün tanım/reklam", docs/03).
// Tanım sayfası ürünü TANITIR: ne işe yarar, kapsam/teminat öne çıkanları, avantajlar,
// kısa ürün SSS'i. Bu içerik formdan ayrıdır (form = definitions.ts alanları).
//
// ⚠️ YER TUTUCU İÇERİK: Aşağıdaki metinler docs/03 taslak ürün tanımlarına göre makul
// şekilde yazılmış PLACEHOLDER'lardır. Doğukan'ın gerçek ürün/kapsam metinleri gelince
// güncellenecek (tek dosyadan). TODO(doc): docs/03 "🔧 netleşecekler" — gerçek teminat
// listeleri, avantajlar ve ürün SSS içerikleri.

import type { Locale } from "@/i18n/routing";

type L = Record<Locale, string>;

export interface ProductContent {
  /** Sayfa üstü kısa tanıtım (description'a ek, "ne işe yarar"). */
  intro: L;
  /**
   * Akıcı TANITIM PARAGRAFI — şık "lead" blok olarak gösterilir (docs/09 dili:
   * büyük puntolu giriş cümlesi + yumuşak kart/zemin + ikon).
   * ⚠️ YER TUTUCU metin. TODO(doc): Doğukan'ın gerçek tanıtım metni gelince güncellenir.
   */
  lead: L;
  /** "Neyi kapsar / teminat öne çıkanları" maddeleri. */
  coverage: L[];
  /** "Avantajlar / neden bu ürün" maddeleri (başlık + metin). */
  advantages: { title: L; body: L }[];
  /** Ürüne özel kısa SSS (FAQ JSON-LD'ye de beslenir — docs/07). */
  faq: { q: L; a: L }[];
}

// Tüm ürünlerde paylaşılan "neden Doğukan ile" mesajı tanım sayfasında zaten ayrı
// bir bölümle (about değerleriyle paralel) gösterilir; burada ürüne özel içerik var.

const trafik: ProductContent = {
  intro: {
    tr: "Trafik sigortası (zorunlu mali sorumluluk), bir kazada karşı tarafa verebileceğiniz maddi ve bedeni zararları yasal limitler dahilinde güvence altına alır. Araç sahibi olan herkes için zorunludur.",
    en: "Traffic insurance (compulsory motor third-party liability) covers, within legal limits, the material and bodily damage you may cause to others in an accident. It is mandatory for every vehicle owner.",
  },
  lead: {
    tr: "Direksiyona her geçtiğinizde sadece kendinizi değil, yoldaki herkesi de düşünürsünüz. Zorunlu trafik sigortası, beklenmedik bir anda ortaya çıkan sorumluluğu sizin için güvenceye alır; biz de 20'den fazla şirketin tarifesini plakanıza göre karşılaştırıp en uygun primi sizin adınıza buluruz.",
    en: "Every time you get behind the wheel, you think not only of yourself but of everyone on the road. Compulsory traffic insurance secures the liability that can arise in an instant; we compare the tariffs of 20+ companies for your plate and find the most suitable premium on your behalf.",
  },
  coverage: [
    {
      tr: "Karşı araç ve mülke verilen maddi zararlar",
      en: "Material damage to the other vehicle and property",
    },
    {
      tr: "Üçüncü kişilerin bedeni zararları (yaralanma/sağlık giderleri)",
      en: "Bodily injury to third parties (injury / medical costs)",
    },
    {
      tr: "Yasal teminat limitleri kapsamında tazminat",
      en: "Compensation within statutory coverage limits",
    },
  ],
  advantages: [
    {
      title: { tr: "Zorunlu ve hızlı", en: "Mandatory and fast" },
      body: {
        tr: "Plakanıza göre 20+ şirketin tarifesini karşılaştırıp en uygun primi buluyoruz.",
        en: "We compare 20+ companies' tariffs for your plate and find the most suitable premium.",
      },
    },
    {
      title: { tr: "Anında poliçe", en: "Instant policy" },
      body: {
        tr: "Onayınızla poliçeniz hızlıca düzenlenir, e-posta ve WhatsApp ile iletilir.",
        en: "With your approval your policy is issued quickly and sent via email and WhatsApp.",
      },
    },
  ],
  faq: [
    {
      q: {
        tr: "Trafik sigortası fiyatını neden hesaplayıcı vermiyor?",
        en: "Why isn't there a price calculator for traffic insurance?",
      },
      a: {
        tr: "Trafik sigortası primi resmî tarifeye, plakaya ve hasarsızlık basamağınıza bağlıdır; gerçekçi rakam için bilgilerinizi bırakın, size net teklifi sunalım.",
        en: "The traffic premium depends on the official tariff, plate and your no-claims tier; for a realistic figure leave your details and we'll provide an exact quote.",
      },
    },
    {
      q: {
        tr: "Ruhsat fotoğrafı yüklemek zorunlu mu?",
        en: "Is uploading the registration photo mandatory?",
      },
      a: {
        tr: "Zorunlu değil ama yüklerseniz teklif süreci hızlanır.",
        en: "It is not mandatory, but uploading it speeds up the quote process.",
      },
    },
  ],
};

const saglik: ProductContent = {
  intro: {
    tr: "Özel ve tamamlayıcı sağlık sigortası, SGK'nın karşılamadığı veya kısmen karşıladığı tedavi giderlerinizi güvence altına alır; özel hastanelere erişiminizi kolaylaştırır.",
    en: "Private and complementary health insurance covers treatment costs that SGK does not or only partly covers, and eases your access to private hospitals.",
  },
  lead: {
    tr: "Sağlık, ertelenemeyecek tek konudur. Doğru sağlık sigortası, hastalandığınızda nereye gideceğinizi ve cebinizden ne çıkacağını dert etmeden, en iyi tedaviye odaklanmanızı sağlar. Bireysel mi aile kapsamı mı, tamamlayıcı mı tam kapsam mı — bütçenize ve beklentinize en uygun planı birlikte, sade bir dille seçeriz.",
    en: "Health is the one thing that cannot wait. The right health plan lets you focus on the best treatment without worrying about where to go or what comes out of your pocket. Individual or family, complementary or full cover — we choose the plan that best fits your budget and expectations together, in plain language.",
  },
  coverage: [
    {
      tr: "Yatarak tedavi (ameliyat, hastane) giderleri",
      en: "Inpatient treatment (surgery, hospital) costs",
    },
    {
      tr: "Ayakta tedavi (muayene, tahlil, görüntüleme)",
      en: "Outpatient treatment (consultation, lab, imaging)",
    },
    {
      tr: "Tamamlayıcı (TSS) ile anlaşmalı kurumlarda düşük katkı payı",
      en: "Low co-payment at contracted institutions with complementary (TSS) plans",
    },
  ],
  advantages: [
    {
      title: { tr: "Size uygun plan", en: "A plan that fits you" },
      body: {
        tr: "Bireysel veya aile kapsamına, bütçenize ve beklentinize göre en doğru planı birlikte seçeriz.",
        en: "We choose the right plan together based on individual or family coverage, your budget and expectations.",
      },
    },
    {
      title: { tr: "Şeffaf teminat", en: "Transparent coverage" },
      body: {
        tr: "Limitleri, bekleme sürelerini ve istisnaları sade bir dille anlatırız.",
        en: "We explain limits, waiting periods and exclusions in plain language.",
      },
    },
  ],
  faq: [
    {
      q: {
        tr: "TSS ile özel sağlık sigortası farkı nedir?",
        en: "What is the difference between TSS and private health insurance?",
      },
      a: {
        tr: "Tamamlayıcı Sağlık Sigortası (TSS) SGK'yı tamamlar ve anlaşmalı kurumlarda düşük maliyet sunar; özel sağlık sigortası daha geniş kapsam ve hastane ağı sağlar.",
        en: "Complementary Health Insurance (TSS) supplements SGK with low cost at contracted institutions; private health insurance offers broader coverage and hospital network.",
      },
    },
    {
      q: { tr: "Sağlık bilgilerim güvende mi?", en: "Is my health data safe?" },
      a: {
        tr: "Evet. Sağlık verisi özel nitelikli kişisel veridir; yalnızca ayrı açık rızanızla, en aza indirilerek ve erişim kısıtlı şekilde işlenir.",
        en: "Yes. Health data is special-category personal data; it is processed only with your separate explicit consent, minimised and with restricted access.",
      },
    },
  ],
};

const bireyselEmeklilik: ProductContent = {
  intro: {
    tr: "Bireysel Emeklilik Sistemi (BES), düzenli birikimlerinize %30 devlet katkısı ekleyerek uzun vadede daha büyük bir emeklilik birikimi oluşturmanızı sağlar.",
    en: "The Private Pension System (BES) adds a 30% state contribution to your regular savings, helping you build a larger retirement fund over the long term.",
  },
  lead: {
    tr: "Geleceğinizi bugünden kurmak, küçük ama düzenli adımlarla başlar. BES'te her ödemenize eklenen %30 devlet katkısı ve bileşik getiri, zamanla fark yaratan bir birikime dönüşür. Aşağıdaki hesaplayıcıyla aylık ödemenize ve süreye göre tahmini birikiminizi saniyeler içinde görebilir, ardından size en uygun planı birlikte kurabiliriz.",
    en: "Building your future starts today, with small but steady steps. In BES, the 30% state contribution added to every payment, together with compound returns, turns into savings that make a real difference over time. With the calculator below you can see your estimated savings in seconds based on your monthly payment and term, then we build the right plan together.",
  },
  coverage: [
    { tr: "Katkılarınıza %30 devlet katkısı", en: "30% state contribution on your payments" },
    {
      tr: "Çeşitli risk profillerine uygun fon seçenekleri",
      en: "Fund options for various risk profiles",
    },
    { tr: "Esnek ödeme ve ara verme imkânı", en: "Flexible payments and the option to pause" },
  ],
  advantages: [
    {
      title: { tr: "Hesaplayıcı ile öngörü", en: "Foresight with the calculator" },
      body: {
        tr: "Aylık ödeme ve süreye göre tahmini birikiminizi anında görebilirsiniz.",
        en: "See your estimated savings instantly based on monthly payment and term.",
      },
    },
    {
      title: { tr: "Uzun vadeli avantaj", en: "Long-term advantage" },
      body: {
        tr: "Erken başlamak, bileşik getiri sayesinde birikiminizi belirgin şekilde büyütür.",
        en: "Starting early grows your savings notably thanks to compound returns.",
      },
    },
  ],
  faq: [
    {
      q: { tr: "Devlet katkısı oranı nedir?", en: "What is the state contribution rate?" },
      a: {
        tr: "Mevcut düzenlemede katkı paylarınıza %30 devlet katkısı eklenir (güncel mevzuata göre teyit edilir).",
        en: "Under current regulation a 30% state contribution is added to your payments (confirmed per current legislation).",
      },
    },
    {
      q: { tr: "Birikimime ara verebilir miyim?", en: "Can I pause my contributions?" },
      a: {
        tr: "Evet, sistem esnektir; ödemelere ara verebilir, tutarınızı güncelleyebilirsiniz.",
        en: "Yes, the system is flexible; you can pause payments and update your amount.",
      },
    },
  ],
};

const hayat: ProductContent = {
  intro: {
    tr: "Hayat sigortası, beklenmedik bir durumda sevdiklerinizin maddi geleceğini güvence altına alır; kredi teminatından birikime kadar farklı amaçlara uyarlanabilir.",
    en: "Life insurance secures the financial future of your loved ones in an unexpected event; it can be tailored from loan protection to savings.",
  },
  lead: {
    tr: "Hayat sigortası, en zor anda sevdiklerinize bırakabileceğiniz en somut güvencedir. İster bir kredinin teminatı, ister ailenizin geleceği için bir koruma kalkanı olsun — teminat tutarını, süreyi ve amacı ihtiyacınıza göre birlikte kurgularız. Aşağıdaki hesaplayıcıyla yaşınıza ve teminatınıza göre tahmini primi önceden görebilirsiniz.",
    en: "Life insurance is the most tangible security you can leave your loved ones in the hardest moment. Whether as collateral for a loan or a shield for your family's future, we shape the coverage amount, term and purpose around your needs. With the calculator below you can preview an estimated premium based on your age and coverage.",
  },
  coverage: [
    {
      tr: "Vefat durumunda belirlenen teminatın ödenmesi",
      en: "Payment of the agreed coverage in case of death",
    },
    { tr: "Kredi bağlantılı teminat seçenekleri", en: "Loan-linked coverage options" },
    {
      tr: "İsteğe bağlı ek teminatlar (kaza, maluliyet vb.)",
      en: "Optional riders (accident, disability, etc.)",
    },
  ],
  advantages: [
    {
      title: { tr: "Amaca göre kurgu", en: "Designed by purpose" },
      body: {
        tr: "Kredi, koruma veya birikim hedefinize göre teminat ve süreyi birlikte belirleriz.",
        en: "We set coverage and term together based on your loan, protection or savings goal.",
      },
    },
    {
      title: { tr: "Tahmini prim", en: "Estimated premium" },
      body: {
        tr: "Hesaplayıcı ile yaş, teminat ve süreye göre yaklaşık primi önceden görün.",
        en: "See an approximate premium upfront by age, coverage and term with the calculator.",
      },
    },
  ],
  faq: [
    {
      q: { tr: "Sağlık beyanı gerekir mi?", en: "Is a health declaration required?" },
      a: {
        tr: "Bazı durumlarda sigara/sağlık beyanı istenir; bu bilgiler özel nitelikli sayılır ve ayrı açık rıza ile işlenir.",
        en: "In some cases a smoking/health declaration is requested; this is special-category data processed with separate explicit consent.",
      },
    },
    {
      q: {
        tr: "Kredi için hayat sigortası şart mı?",
        en: "Is life insurance required for a loan?",
      },
      a: {
        tr: "Bazı kredilerde teminat olarak istenebilir; size en uygun kredi bağlantılı poliçeyi karşılaştırırız.",
        en: "Some loans may require it as security; we compare the most suitable loan-linked policy for you.",
      },
    },
  ],
};

const konut: ProductContent = {
  intro: {
    tr: "Konut sigortası, evinizi ve eşyalarınızı yangın, hırsızlık, su baskını gibi risklere karşı korur; DASK'a ek olarak kapsamlı güvence sağlar.",
    en: "Home insurance protects your home and belongings against risks such as fire, theft and flooding, providing comprehensive cover in addition to DASK.",
  },
  lead: {
    tr: "Eviniz sadece dört duvar değil; emeğinizin ve anılarınızın biriktiği yer. Konut sigortası, yangından su baskınına, hırsızlıktan cam kırılmasına kadar pek çok riske karşı hem yapınızı hem eşyalarınızı güvenceye alır. Brüt m², yapı tarzı ve eşya bedelinize göre dengeli bir teminatı birlikte kurgularız.",
    en: "Your home is more than four walls; it is where your effort and memories accumulate. Home insurance secures both your structure and your belongings against many risks, from fire and flooding to theft and glass breakage. We design balanced coverage together based on your gross m², construction type and contents value.",
  },
  coverage: [
    { tr: "Yangın, infilak, duman zararları", en: "Fire, explosion and smoke damage" },
    { tr: "Hırsızlık ve su baskını (dahili su)", en: "Theft and water damage (internal water)" },
    { tr: "Eşya ve isteğe bağlı ek teminatlar", en: "Contents and optional additional covers" },
  ],
  advantages: [
    {
      title: { tr: "İhtiyaca özel kapsam", en: "Coverage tailored to needs" },
      body: {
        tr: "Brüt m², yapı tarzı ve eşya bedelinize göre dengeli bir teminat kurgularız.",
        en: "We design balanced coverage based on your gross m², construction type and contents value.",
      },
    },
    {
      title: { tr: "Ev sahibi/kiracı ayrımı", en: "Owner / tenant distinction" },
      body: {
        tr: "Mülk tipinize uygun en doğru poliçeyi öneririz.",
        en: "We recommend the most suitable policy for your property type.",
      },
    },
  ],
  faq: [
    {
      q: {
        tr: "Konut sigortası DASK'ın yerine geçer mi?",
        en: "Does home insurance replace DASK?",
      },
      a: {
        tr: "Hayır. DASK zorunlu deprem sigortasıdır; konut sigortası bunu tamamlayan geniş kapsamlı bir poliçedir.",
        en: "No. DASK is mandatory earthquake insurance; home insurance is a broader policy that complements it.",
      },
    },
    {
      q: {
        tr: "Kiracı olarak konut sigortası yaptırabilir miyim?",
        en: "Can I get home insurance as a tenant?",
      },
      a: {
        tr: "Evet, eşyalarınızı kapsayan kiracı dostu poliçeler mevcuttur.",
        en: "Yes, tenant-friendly policies covering your contents are available.",
      },
    },
  ],
};

// ─────────────────────────────────────────────────────────────────────────────
// Yeni ürünler — DASK, Kasko, Seyahat (docs/03). ⚠️ TASLAK içerik.
// TODO(doc): Doğukan'ın gerçek teminat/avantaj/SSS metinleri gelince güncellenir.
// ─────────────────────────────────────────────────────────────────────────────

const dask: ProductContent = {
  intro: {
    tr: "DASK (Zorunlu Deprem Sigortası), deprem ve deprem kaynaklı risklere karşı konutunuzun yapısını yasal teminat limitlerinde güvence altına alan zorunlu bir sigortadır.",
    en: "DASK (Compulsory Earthquake Insurance) is a mandatory policy that secures the structure of your home against earthquake and earthquake-related risks within statutory coverage limits.",
  },
  lead: {
    tr: "Deprem bir ihtimal değil, hazırlıklı olmamız gereken bir gerçek. DASK, konutunuzun yapısını deprem ve deprem kaynaklı yangın, infilak, tsunami ve heyelan risklerine karşı güvenceye alır; üstelik tapu ve abonelik işlemleri için de zorunludur. Birkaç bilgiyle poliçenizi hızlıca düzenleyelim.",
    en: "An earthquake is not a possibility but a reality we must be prepared for. DASK secures your home's structure against earthquake and earthquake-related fire, explosion, tsunami and landslide risks; it is also mandatory for title-deed and utility transactions. Let's arrange your policy quickly with a few details.",
  },
  coverage: [
    {
      tr: "Deprem ve deprem kaynaklı yangın, infilak, tsunami, yer kayması",
      en: "Earthquake and earthquake-related fire, explosion, tsunami and landslide",
    },
    {
      tr: "Binanın taşıyıcı ve taşıyıcı olmayan yapı elemanları",
      en: "Load-bearing and non-load-bearing structural elements of the building",
    },
    {
      tr: "Azami teminat limiti kapsamında yapısal hasar",
      en: "Structural damage within the maximum coverage limit",
    },
  ],
  advantages: [
    {
      title: { tr: "Zorunlu ve hızlı", en: "Mandatory and fast" },
      body: {
        tr: "Tapu ve abonelik işlemleri için gereken DASK poliçenizi kısa sürede düzenleriz.",
        en: "We issue the DASK policy required for title-deed and utility transactions quickly.",
      },
    },
    {
      title: { tr: "Resmî tarife güvencesi", en: "Official tariff assurance" },
      body: {
        tr: "DASK primleri resmî tarifeye göre belirlenir; doğru bilgiyle doğru primi öderiz.",
        en: "DASK premiums are set by the official tariff; with correct details you pay the correct premium.",
      },
    },
  ],
  faq: [
    {
      q: {
        tr: "DASK ile konut sigortası aynı şey mi?",
        en: "Are DASK and home insurance the same?",
      },
      a: {
        tr: "Hayır. DASK yalnızca deprem riskini ve binanın yapısını kapsar; konut sigortası ise yangın, hırsızlık, su baskını ve eşya gibi daha geniş riskleri kapsayan tamamlayıcı bir poliçedir.",
        en: "No. DASK covers only earthquake risk and the building's structure; home insurance is a complementary policy covering broader risks such as fire, theft, flooding and contents.",
      },
    },
    {
      q: { tr: "DASK zorunlu mu?", en: "Is DASK mandatory?" },
      a: {
        tr: "Evet. Meskenler için DASK zorunludur ve tapu işlemleri ile su/elektrik aboneliklerinde aranır.",
        en: "Yes. DASK is mandatory for dwellings and is required for title-deed transactions and water/electricity subscriptions.",
      },
    },
  ],
};

const kasko: ProductContent = {
  intro: {
    tr: "Kasko sigortası, aracınızın kendi hasarlarını (çarpma, çarpışma, yanma, çalınma vb.) isteğe bağlı ve geniş kapsamlı şekilde güvence altına alır.",
    en: "Comprehensive auto insurance optionally and broadly secures damage to your own vehicle (collision, fire, theft, etc.).",
  },
  lead: {
    tr: "Trafik sigortası karşı tarafı korur; kasko ise asıl sizin aracınızı düşünür. Çarpma, çarpışma, yangın, hırsızlık ve doğal afetlerden cam, anahtar kaybı gibi günlük aksiliklere kadar pek çok riske karşı aracınızı güvenceye alır. 20'den fazla şirketin teklifini karşılaştırıp ihtiyacınıza en uygun kasko paketini birlikte seçeriz.",
    en: "Traffic insurance protects the other party; comprehensive auto insurance thinks of your own vehicle. It secures your car against many risks, from collision, fire, theft and natural disasters to everyday mishaps like glass damage or lost keys. We compare offers from 20+ companies and choose the package that best fits your needs together.",
  },
  coverage: [
    {
      tr: "Çarpma, çarpışma, devrilme ve yanma hasarları",
      en: "Impact, collision, rollover and fire damage",
    },
    { tr: "Hırsızlık ve hırsızlığa teşebbüs", en: "Theft and attempted theft" },
    {
      tr: "Doğal afet, sel ve isteğe bağlı ek teminatlar (cam, ikame araç vb.)",
      en: "Natural disasters, flood and optional riders (glass, replacement vehicle, etc.)",
    },
  ],
  advantages: [
    {
      title: { tr: "İhtiyaca özel paket", en: "A package for your needs" },
      body: {
        tr: "Ek teminatları (ikame araç, cam, mini onarım) ihtiyacınıza göre seçer, gereksiz maliyeti eleriz.",
        en: "We select riders (replacement vehicle, glass, minor repair) per your needs and cut unnecessary cost.",
      },
    },
    {
      title: { tr: "20+ şirket karşılaştırması", en: "20+ company comparison" },
      body: {
        tr: "Aracınıza göre tüm tarifeleri karşılaştırıp en avantajlı kaskoyu buluruz.",
        en: "We compare all tariffs for your vehicle and find the most advantageous cover.",
      },
    },
  ],
  faq: [
    {
      q: { tr: "Kasko zorunlu mu?", en: "Is comprehensive auto insurance mandatory?" },
      a: {
        tr: "Hayır, kasko isteğe bağlıdır; ancak aracınızın kendi hasarlarını trafik sigortası karşılamadığı için güçlü bir koruma sağlar.",
        en: "No, it is optional; but it provides strong protection since traffic insurance does not cover damage to your own vehicle.",
      },
    },
    {
      q: {
        tr: "Trafik sigortam varken kasko gerekir mi?",
        en: "Do I need it if I have traffic insurance?",
      },
      a: {
        tr: "Trafik sigortası yalnızca karşı tarafa verdiğiniz zararı karşılar; kendi aracınızın hasarı için kasko gerekir.",
        en: "Traffic insurance only covers damage you cause to others; for damage to your own vehicle you need comprehensive cover.",
      },
    },
  ],
};

const seyahat: ProductContent = {
  intro: {
    tr: "Seyahat sağlık sigortası, yurt dışı seyahatleriniz boyunca olası sağlık giderlerinizi güvence altına alır ve Schengen başta olmak üzere vize başvurularında talep edilir.",
    en: "Travel health insurance secures potential medical expenses during your trips abroad and is required for visa applications, notably Schengen.",
  },
  lead: {
    tr: "Yurt dışında her şey yolunda gitsin diye yola çıkarız; ama beklenmedik bir sağlık sorunu en güzel seyahati gölgeleyebilir. Seyahat sağlık sigortası, yurt dışındaki acil tedavi ve sağlık giderlerinizi karşılar, çoğu vize başvurusunda da zorunludur. Gideceğiniz ülke ve tarihlere göre poliçenizi dakikalar içinde hazırlayalım.",
    en: "We set off hoping everything goes smoothly abroad; but an unexpected health issue can overshadow the best trip. Travel health insurance covers your emergency treatment and medical expenses abroad and is mandatory for most visa applications. Let's prepare your policy in minutes based on your destination and dates.",
  },
  coverage: [
    {
      tr: "Yurt dışında acil tıbbi tedavi ve hastane giderleri",
      en: "Emergency medical treatment and hospital costs abroad",
    },
    {
      tr: "Tıbbi nakil ve gerektiğinde ülkeye geri dönüş",
      en: "Medical transport and repatriation when needed",
    },
    {
      tr: "Vize (Schengen vb.) için gerekli minimum teminat",
      en: "Minimum coverage required for visas (Schengen, etc.)",
    },
  ],
  advantages: [
    {
      title: { tr: "Vize uyumlu poliçe", en: "Visa-compliant policy" },
      body: {
        tr: "Schengen ve diğer vize başvuruları için gerekli teminat limitlerini sağlayan poliçeyi hazırlarız.",
        en: "We prepare a policy meeting the coverage limits required for Schengen and other visa applications.",
      },
    },
    {
      title: { tr: "Seyahatinize göre süre", en: "Term to match your trip" },
      body: {
        tr: "Tek seyahat veya yıllık çoklu seyahat seçenekleriyle ihtiyacınıza uygun süreyi seçeriz.",
        en: "With single-trip or annual multi-trip options, we choose the term that suits you.",
      },
    },
  ],
  faq: [
    {
      q: { tr: "Schengen vizesi için zorunlu mu?", en: "Is it mandatory for a Schengen visa?" },
      a: {
        tr: "Evet. Schengen vize başvurularında belirli bir teminat limitine sahip seyahat sağlık sigortası talep edilir.",
        en: "Yes. Schengen visa applications require travel health insurance with a certain coverage limit.",
      },
    },
    {
      q: {
        tr: "Mevcut sağlık durumum soruluyor mu?",
        en: "Are my existing health conditions asked?",
      },
      a: {
        tr: "Standart başvuruda sağlık beyanı alınmaz; teklif için yalnızca tarih, ülke ve kişi bilgileriniz yeterlidir.",
        en: "A standard application does not require a health declaration; only your dates, destination and traveller details are needed for a quote.",
      },
    },
  ],
};

// ─────────────────────────────────────────────────────────────────────────────
// Kurumsal Anlaşma (docs/03 §9). Bireysel ürünlerden farklı: bir LEAD/iletişim
// ürünü. ⚠️ TASLAK içerik. TODO(doc): Doğukan'ın gerçek kurumsal teklif metni gelince
// güncellenir.
// ─────────────────────────────────────────────────────────────────────────────
const kurumsal: ProductContent = {
  intro: {
    tr: "Kurumsal anlaşma; çalışanlarınızın sağlık ve hayat sigortasından araç filonuzun kasko/trafiğine, iş yeri poliçenize kadar şirketinizin tüm sigorta ihtiyaçlarını tek elden, avantajlı koşullarla yönetmenizi sağlar.",
    en: "A corporate agreement lets you manage all your company's insurance needs from a single point on favourable terms — from employee health and life cover to your fleet's auto policies and workplace insurance.",
  },
  lead: {
    tr: "Bir şirketi büyüten, çalışanları ve işini güvende hissetmesidir. Kurumsal anlaşmayla; ekibinizin sağlık ve hayat güvencesini, araç filonuzu ve iş yerinizi tek bir muhatapla, toplu ölçeğin getirdiği avantajlı koşullarla planlarız. İhtiyacınızı birlikte dinler, 20'den fazla şirketin tekliflerini firmanız için karşılaştırır, size özel bir çözüm kurgularız. Birkaç bilgiyi bırakın; kurumsal teklifiniz için sizi arayalım.",
    en: "What grows a company is people and a business that feel secure. With a corporate agreement we plan your team's health and life cover, your vehicle fleet and your workplace through a single point of contact, on the favourable terms that scale brings. We listen to your needs, compare 20+ companies' offers for your firm and build a tailored solution. Leave a few details and we'll call you for your corporate quote.",
  },
  coverage: [
    {
      tr: "Çalışanlara grup sağlık ve hayat sigortası",
      en: "Group health and life insurance for employees",
    },
    {
      tr: "Araç filosu için toplu kasko / trafik poliçeleri",
      en: "Bulk comprehensive / traffic policies for the vehicle fleet",
    },
    {
      tr: "İş yeri, sorumluluk ve diğer kurumsal teminatlar",
      en: "Workplace, liability and other corporate covers",
    },
  ],
  advantages: [
    {
      title: { tr: "Tek muhatap, toplu çözüm", en: "One contact, bulk solution" },
      body: {
        tr: "Tüm kurumsal poliçelerinizi tek elden yönetir, süreçleri sizin için sadeleştiririz.",
        en: "We manage all your corporate policies from one point and simplify the process for you.",
      },
    },
    {
      title: { tr: "Ölçeğe özel avantaj", en: "Scale-based advantage" },
      body: {
        tr: "Toplu poliçelerde 20+ şirketi karşılaştırıp firmanıza özel avantajlı koşulları buluruz.",
        en: "For bulk policies we compare 20+ companies and find favourable terms tailored to your firm.",
      },
    },
  ],
  faq: [
    {
      q: {
        tr: "Kaç çalışandan itibaren kurumsal anlaşma yapılır?",
        en: "From how many employees is a corporate agreement possible?",
      },
      a: {
        tr: "Ekip büyüklüğünüze göre esnek çözümler sunuyoruz; küçük ekipler için de avantajlı kurumsal paketler mümkündür. Detay için iletişime geçin.",
        en: "We offer flexible solutions based on your team size; advantageous corporate packages are possible for small teams too. Get in touch for details.",
      },
    },
    {
      q: {
        tr: "Hem çalışanları hem araçları aynı anlaşmaya dahil edebilir miyim?",
        en: "Can I include both employees and vehicles in the same agreement?",
      },
      a: {
        tr: "Evet. Sağlık/hayat, kasko/trafik ve iş yeri teminatlarını tek bir kurumsal çözümde birleştirebiliriz.",
        en: "Yes. We can combine health/life, auto and workplace covers in a single corporate solution.",
      },
    },
  ],
};

/** Slug (kanonik = TR) -> tanım sayfası içeriği. Bilinmeyen ürün için undefined. */
const byCanonicalSlug: Record<string, ProductContent> = {
  trafik,
  kasko,
  saglik,
  "bireysel-emeklilik": bireyselEmeklilik,
  hayat,
  konut,
  dask,
  seyahat,
  kurumsal,
};

export function getProductContent(canonicalSlug: string): ProductContent | undefined {
  return byCanonicalSlug[canonicalSlug];
}
