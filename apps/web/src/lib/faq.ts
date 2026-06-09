// SSS (Sıkça Sorulan Sorular) — TEK KAYNAK (TR + EN).
// Anasayfa SSS bölümü, /planlar SSS bölümü, /sss sayfası ve FAQPage JSON-LD
// (docs/07) buradan beslenir.
// docs/02: "SSS — Var; hem ayrı sayfa hem anasayfada bölüm." + "ürün bazında da
// gösterilebilir." docs/03: ürün listesi (Trafik, Kasko, Sağlık, BES, Hayat,
// Konut, DASK, Seyahat, Kurumsal).
//
// YAPI (bu görevde kategorilendirildi):
//  - `generalFaqs`  → kategorisiz "Genel" sorular. Anasayfa + /planlar bu kısa
//    listeyi kullanır (DOKUNULMADI — eski 6 soru korundu).
//  - `faqCategories` → /sss sayfası için KATEGORİLİ tam liste: "Genel" + her
//    ürün için 3–5 anlamlı, genel-bilgilendirici soru-cevap (TR + EN).
//  - `faqs` → geriye dönük uyumluluk için `generalFaqs` rumuzu (anasayfa/planlar/
//    ürün accordion'ları bu adı kullanıyordu; davranış değişmedi).
//
// İçerik Doğukan'ın çoklu şirket acentesi konumlandırmasına göre, kurumsal/kişisel
// olmayan dille yazılmıştır (docs/00). Kesin rakam/oran VERİLMEZ — genel bilgilendirici.
// TODO(doc): Doğukan onayı ile soru/cevaplar genişletilebilir (docs/02 "🔧 netleşecek").

import type { Locale } from "@/i18n/routing";

export interface FaqItem {
  q: Record<Locale, string>;
  a: Record<Locale, string>;
}

/** Bir SSS kategorisi: başlık (TR+EN) + soru-cevap listesi. */
export interface FaqCategory {
  /** Kararlı kimlik (anchor/JSON-LD/test için). */
  id: string;
  title: Record<Locale, string>;
  items: FaqItem[];
}

// ─────────────────────────────────────────────────────────────────────────────
// GENEL — kategorisiz sorular. Anasayfa + /planlar bu listeyi gösterir.
// (Eski 6 soru AYNEN korundu; sıra ve metin değişmedi.)
// ─────────────────────────────────────────────────────────────────────────────
export const generalFaqs: FaqItem[] = [
  {
    q: {
      tr: "Teklif almak ücretli mi?",
      en: "Is getting a quote free?",
    },
    a: {
      tr: "Hayır. Teklif almak tamamen ücretsizdir ve sizi hiçbir şekilde bağlamaz. Bilgilerinizi bırakın, en uygun teklifi karşılaştırıp size dönelim.",
      en: "No. Getting a quote is completely free and puts you under no obligation. Leave your details and we will compare the best offers and get back to you.",
    },
  },
  {
    q: {
      tr: "Hangi sigorta şirketleriyle çalışıyorsunuz?",
      en: "Which insurance companies do you work with?",
    },
    a: {
      tr: "Tek bir şirkete bağlı değiliz. Türkiye'nin önde gelen birçok sigorta şirketinin acenteliğini yapıyoruz; bu sayede 20'den fazla şirketin fiyatını sizin için karşılaştırarak en avantajlı poliçeyi buluyoruz.",
      en: "We are not tied to a single company. We act as an agency for many of Türkiye's leading insurers, so we compare prices from 20+ companies to find you the most advantageous policy.",
    },
  },
  {
    q: {
      tr: "Teklifim ne kadar sürede hazır olur?",
      en: "How quickly is my quote ready?",
    },
    a: {
      tr: "Çoğu branşta talebinizi aldıktan kısa süre sonra sizi arıyor veya WhatsApp üzerinden dönüş yapıyoruz. Sağlık ve hayat gibi detay gerektiren ürünlerde süreç biraz uzayabilir.",
      en: "For most branches we call you or reach out via WhatsApp shortly after receiving your request. For products requiring more detail, such as health and life, it may take a little longer.",
    },
  },
  {
    q: {
      tr: "Verilerim güvende mi?",
      en: "Is my data safe?",
    },
    a: {
      tr: "Evet. Verileriniz yalnızca teklif hazırlamak amacıyla, 6698 sayılı KVKK'ya uygun şekilde işlenir. Sağlık gibi özel nitelikli veriler için ayrıca açık rızanız alınır ve erişim sınırlı tutulur.",
      en: "Yes. Your data is processed solely to prepare a quote, in compliance with Turkish Law No. 6698 (KVKK). For special-category data such as health, your explicit consent is obtained separately and access is restricted.",
    },
  },
  {
    q: {
      tr: "Mevcut poliçemi sizinle yenileyebilir miyim?",
      en: "Can I renew my existing policy with you?",
    },
    a: {
      tr: "Tabii ki. Mevcut poliçenizin bilgilerini paylaşmanız yeterli; yenileme döneminde alternatif şirketlerin fiyatlarını karşılaştırıp en uygun seçeneği sunarız.",
      en: "Of course. Just share your current policy details; at renewal time we compare alternative companies' prices and present the most suitable option.",
    },
  },
  {
    q: {
      tr: "Hasar anında ne yapmalıyım?",
      en: "What should I do in case of a claim?",
    },
    a: {
      tr: "Hasar durumunda bizi telefon veya WhatsApp üzerinden arayın; süreci baştan sona sizin adınıza takip eder, ilgili sigorta şirketiyle iletişimi yönetiriz.",
      en: "In case of a claim, call us by phone or WhatsApp; we follow the process end to end on your behalf and manage communication with the relevant insurer.",
    },
  },
];

/**
 * Geriye dönük uyumluluk: anasayfa, /planlar ve ürün sayfaları `faqs`'ü kullanır.
 * Davranış değişmedi (kısa "Genel" liste). /sss sayfası `faqCategories` kullanır.
 */
export const faqs: FaqItem[] = generalFaqs;

// ─────────────────────────────────────────────────────────────────────────────
// /sss sayfası — "Genel" kategorisi (kısa listeyi genişleten ek sorular).
// docs/02: ücretsiz mi, nasıl çalışır, teklif süreci, KVKK/gizlilik, ödeme, iptal.
// generalFaqs'teki 6 soru + aşağıdaki ek sorular = "Genel" kategorisi.
// ─────────────────────────────────────────────────────────────────────────────
const genelEkstra: FaqItem[] = [
  {
    q: {
      tr: "Teklif sürecimi nasıl işliyor?",
      en: "How does the quote process work?",
    },
    a: {
      tr: "İlgili ürünün formunu doldurursunuz, biz de birlikte çalıştığımız şirketlerin tekliflerini sizin için karşılaştırırız. Ardından telefon veya WhatsApp ile size en uygun seçenekleri sunar, tercihinizle birlikte poliçenizi düzenleriz.",
      en: "You fill in the form for the relevant product and we compare the offers from the companies we work with for you. We then present the most suitable options by phone or WhatsApp and, once you decide, issue your policy.",
    },
  },
  {
    q: {
      tr: "Acenteden poliçe almak daha mı pahalı?",
      en: "Is buying a policy through an agency more expensive?",
    },
    a: {
      tr: "Hayır. Acente hizmeti için sizden ayrıca bir ücret alınmaz; poliçe priminiz sigorta şirketinin tarifesiyle aynıdır. Çok sayıda şirketi karşılaştırdığımız için çoğu zaman daha uygun seçeneği bulmanıza yardımcı oluruz.",
      en: "No. There is no separate fee for the agency service; your premium is the same as the insurer's tariff. Because we compare many companies, we often help you find a more advantageous option.",
    },
  },
  {
    q: {
      tr: "Ödemeyi nasıl yapabilirim?",
      en: "How can I pay?",
    },
    a: {
      tr: "Ödeme, poliçeyi düzenleyen sigorta şirketinin sunduğu yöntemlerle yapılır; birçok üründe peşin veya taksitli ödeme seçenekleri bulunur. Size özel ödeme seçeneklerini teklif aşamasında netleştiririz.",
      en: "Payment is made through the methods offered by the insurer issuing the policy; many products offer single or installment payment options. We clarify the payment options available to you during the quote stage.",
    },
  },
  {
    q: {
      tr: "Poliçemi iptal edebilir veya değiştirebilir miyim?",
      en: "Can I cancel or change my policy?",
    },
    a: {
      tr: "Poliçe iptali ve değişiklikleri, ilgili sigorta şirketinin koşullarına ve yasal mevzuata tabidir. Talebinizi bize ilettiğinizde süreci sizin adınıza takip eder, şirketle iletişimi yönetiriz.",
      en: "Policy cancellations and changes are subject to the relevant insurer's terms and the applicable regulations. When you send us your request, we follow the process on your behalf and manage communication with the company.",
    },
  },
  {
    q: {
      tr: "Teklif talebimin durumunu nasıl takip ederim?",
      en: "How do I track the status of my quote request?",
    },
    a: {
      tr: "Teklif talebinizi aldığımızda size bir takip kodu iletiriz. Bu kodla teklif durumu sayfasından talebinizin güncel durumunu sorgulayabilirsiniz; bu sayfada yalnızca ürün, durum ve tarih bilgisi gösterilir.",
      en: "When we receive your request we send you a tracking code. Using this code you can check the current status of your request on the quote-status page, which displays only the product, status and date.",
    },
  },
];

// ─────────────────────────────────────────────────────────────────────────────
// ÜRÜN BAZLI kategoriler (docs/03 ürünleri). Her kategoride 3–5 genel-bilgilendirici
// soru. Kesin prim/oran VERİLMEZ. Sıra definitions.ts katalog sırasıyla uyumludur.
// ─────────────────────────────────────────────────────────────────────────────

const trafikFaqs: FaqItem[] = [
  {
    q: {
      tr: "Trafik sigortası zorunlu mu?",
      en: "Is traffic insurance mandatory?",
    },
    a: {
      tr: "Evet. Karayollarında trafiğe çıkan tüm motorlu araçlar için zorunlu mali sorumluluk (trafik) sigortası kanunen gereklidir. Poliçesiz araç kullanımı idari yaptırımlara yol açabilir.",
      en: "Yes. Compulsory motor third-party liability (traffic) insurance is required by law for all motor vehicles used on public roads. Driving without a policy may lead to administrative penalties.",
    },
  },
  {
    q: {
      tr: "Trafik sigortası neleri karşılar?",
      en: "What does traffic insurance cover?",
    },
    a: {
      tr: "Trafik sigortası, kazada karşı tarafa (üçüncü kişilere) verilen bedeni ve maddi zararları yasal limitler dâhilinde karşılar. Kendi aracınızdaki hasarı kapsamaz; bunun için kasko gerekir.",
      en: "Traffic insurance covers bodily and material damage caused to the other party (third parties) in an accident, within the legal limits. It does not cover damage to your own vehicle; for that you need comprehensive (kasko) cover.",
    },
  },
  {
    q: {
      tr: "Trafik sigortası primi neye göre belirlenir?",
      en: "How is the traffic insurance premium determined?",
    },
    a: {
      tr: "Prim, ilgili resmî tarife ve hasarsızlık basamağınız (kademe), aracın özellikleri ve kullanım bilgileri gibi etkenlere göre belirlenir. Doğru bilgileri paylaştığınızda size uygun teklifi karşılaştırarak sunarız.",
      en: "The premium is set according to the official tariff and factors such as your no-claims tier, the vehicle's characteristics and usage details. When you share accurate information, we compare and present a suitable offer.",
    },
  },
  {
    q: {
      tr: "Aracımı satarsam trafik poliçem ne olur?",
      en: "What happens to my traffic policy if I sell my vehicle?",
    },
    a: {
      tr: "Araç devrinde poliçeyle ilgili işlemler mevzuata ve sigorta şirketinin koşullarına göre yürür. Satış sonrası bizimle iletişime geçtiğinizde gerekli adımlarda size yardımcı oluruz.",
      en: "On transfer of the vehicle, the policy procedures follow the regulations and the insurer's terms. If you contact us after the sale, we help you with the necessary steps.",
    },
  },
];

const kaskoFaqs: FaqItem[] = [
  {
    q: {
      tr: "Kasko ile trafik sigortası arasındaki fark nedir?",
      en: "What is the difference between kasko and traffic insurance?",
    },
    a: {
      tr: "Zorunlu trafik sigortası karşı tarafın zararını karşılarken, kasko (isteğe bağlı) kendi aracınızda oluşabilecek hasarları teminat kapsamına alır. İkisi birbirini tamamlar.",
      en: "Compulsory traffic insurance covers the other party's loss, while comprehensive (kasko) insurance — which is optional — covers damage that may occur to your own vehicle. The two complement each other.",
    },
  },
  {
    q: {
      tr: "Kasko hangi durumları kapsar?",
      en: "What situations does kasko cover?",
    },
    a: {
      tr: "Kasko genellikle çarpma, çarpışma, yangın, hırsızlık ve doğal afet gibi durumlara karşı teminat sunar. Kapsam, seçtiğiniz pakete ve şirkete göre değişebilir; ek teminatlar eklenebilir.",
      en: "Kasko typically provides cover against situations such as collision, fire, theft and natural disasters. Coverage may vary by the package and company you choose; additional covers can be added.",
    },
  },
  {
    q: {
      tr: "Kasko yaptırmak zorunlu mu?",
      en: "Is kasko insurance mandatory?",
    },
    a: {
      tr: "Hayır, kasko isteğe bağlıdır. Ancak aracınızı kapsamlı şekilde güvence altına almak isterseniz önemli bir korumadır. İhtiyacınıza göre farklı şirketlerin paketlerini karşılaştırarak size sunarız.",
      en: "No, kasko is optional. However, if you want to protect your vehicle comprehensively it is an important safeguard. We compare different companies' packages according to your needs and present them to you.",
    },
  },
  {
    q: {
      tr: "Kasko priminde nelere bakılır?",
      en: "What affects the kasko premium?",
    },
    a: {
      tr: "Aracın marka, model ve yaşı, kullanım tarzı, sürücü bilgileri ve seçilen teminatlar primi etkileyen başlıca unsurlardır. Bilgilerinizi paylaştığınızda size en uygun seçenekleri karşılaştırırız.",
      en: "The make, model and age of the vehicle, usage type, driver details and the chosen coverages are the main factors affecting the premium. Once you share your details, we compare the most suitable options for you.",
    },
  },
];

const saglikFaqs: FaqItem[] = [
  {
    q: {
      tr: "Özel sağlık sigortası ile tamamlayıcı sağlık sigortası arasındaki fark nedir?",
      en: "What is the difference between private and complementary health insurance?",
    },
    a: {
      tr: "Tamamlayıcı sağlık sigortası, SGK ile anlaşmalı kurumlarda SGK'nın karşılamadığı farkları kapsayarak genellikle daha uygun maliyetli olur. Özel sağlık sigortası ise daha geniş kurum ağı ve teminat esnekliği sunar. İhtiyacınıza uygun olanı birlikte belirleriz.",
      en: "Complementary health insurance covers the difference not paid by SGK at contracted institutions and is usually more affordable. Private health insurance offers a wider network of institutions and more flexible coverage. We determine which suits you together.",
    },
  },
  {
    q: {
      tr: "Sağlık beyanı ve sağlık verilerim nasıl korunuyor?",
      en: "How are my health declaration and health data protected?",
    },
    a: {
      tr: "Sağlık bilgileri KVKK kapsamında özel nitelikli veridir. Bu veriler yalnızca teklif ve poliçe süreci için, ayrıca alınan açık rızanızla işlenir; erişim sınırlı tutulur ve gizlilik esas alınır.",
      en: "Health information is special-category data under KVKK. Such data is processed only for the quote and policy process, with your separately obtained explicit consent; access is restricted and confidentiality is maintained.",
    },
  },
  {
    q: {
      tr: "Mevcut bir rahatsızlığım varsa sağlık sigortası yaptırabilir miyim?",
      en: "Can I get health insurance if I have an existing condition?",
    },
    a: {
      tr: "Mevcut rahatsızlıklar şirketten şirkete farklı değerlendirilebilir; bazı durumlar kapsam dışı bırakılabilir veya özel koşullarla teminata alınabilir. Beyanınıza göre uygun seçenekleri sizin için araştırırız.",
      en: "Existing conditions may be assessed differently by each company; some may be excluded or covered under special terms. Based on your declaration, we research suitable options for you.",
    },
  },
  {
    q: {
      tr: "Sağlık sigortasını ailem için de yaptırabilir miyim?",
      en: "Can I take out health insurance for my family too?",
    },
    a: {
      tr: "Evet. Bireysel poliçenin yanı sıra aile kapsamlı planlar da mevcuttur. Aile bireylerinin sayısı ve ihtiyaçlarına göre uygun planları karşılaştırarak size sunarız.",
      en: "Yes. In addition to individual policies, family-wide plans are also available. We compare suitable plans according to the number and needs of family members and present them to you.",
    },
  },
  {
    q: {
      tr: "Tahmini sağlık primini önceden öğrenebilir miyim?",
      en: "Can I find out an estimated health premium in advance?",
    },
    a: {
      tr: "Sağlık hesaplayıcımız size yalnızca tahmini bir fikir vermek içindir; kesin prim, şirket değerlendirmesi ve beyanınıza göre belirlenir. Net teklif için formu doldurmanız yeterlidir.",
      en: "Our health calculator is only intended to give you an estimated idea; the exact premium is set according to the company's assessment and your declaration. To get a precise quote, simply fill in the form.",
    },
  },
];

const besFaqs: FaqItem[] = [
  {
    q: {
      tr: "Bireysel Emeklilik Sistemi (BES) nedir?",
      en: "What is the Private Pension System (BES)?",
    },
    a: {
      tr: "BES, çalışma döneminizde düzenli birikim yaparak emeklilikte ek bir gelir oluşturmanızı sağlayan, devlet katkısıyla desteklenen gönüllü bir sistemdir. Birikiminiz fonlarda değerlendirilir.",
      en: "BES is a voluntary, state-supported system that lets you build regular savings during your working life to create additional income in retirement. Your savings are invested in funds.",
    },
  },
  {
    q: {
      tr: "Devlet katkısı nasıl işliyor?",
      en: "How does the state contribution work?",
    },
    a: {
      tr: "Düzenli katkı paylarınıza, yürürlükteki mevzuatta belirlenen oran ve koşullar çerçevesinde devlet katkısı eklenir. Güncel oran ve hak ediş koşulları için sizi en doğru şekilde bilgilendiririz.",
      en: "A state contribution is added to your regular contributions within the rates and conditions set by the current regulations. We inform you accurately about the current rate and vesting conditions.",
    },
  },
  {
    q: {
      tr: "BES birikimimi ne zaman alabilirim?",
      en: "When can I access my BES savings?",
    },
    a: {
      tr: "Sistemde belirlenen koşulları (örneğin asgari katılım süresi ve yaş) sağladığınızda emeklilik hakkı kazanırsınız. Erken çıkışta devlet katkısının hak ediş durumu mevzuata tabidir.",
      en: "You earn the right to retire once you meet the conditions defined in the system (such as the minimum participation period and age). In case of early exit, the vesting of the state contribution is subject to the regulations.",
    },
  },
  {
    q: {
      tr: "Aylık katkı tutarımı sonradan değiştirebilir miyim?",
      en: "Can I change my monthly contribution later?",
    },
    a: {
      tr: "Genellikle katkı tutarınızı ihtiyaçlarınıza göre güncelleyebilirsiniz. Plan koşullarına bağlı olarak ara verme veya düzenleme seçenekleri için size yol gösteririz.",
      en: "You can usually update your contribution amount according to your needs. Depending on the plan terms, we guide you on options to pause or adjust your contributions.",
    },
  },
  {
    q: {
      tr: "BES hesaplayıcısının sonucu kesin mi?",
      en: "Is the BES calculator result definitive?",
    },
    a: {
      tr: "Hayır, hesaplayıcı yalnızca tahmini bir projeksiyon sunar; gerçek birikim fon getirileri ve mevzuata göre değişir. Size özel bir planlama için iletişime geçmeniz yeterlidir.",
      en: "No, the calculator only provides an estimated projection; actual savings vary with fund returns and the regulations. To plan something tailored to you, simply get in touch.",
    },
  },
];

const hayatFaqs: FaqItem[] = [
  {
    q: {
      tr: "Hayat sigortası ne işe yarar?",
      en: "What is life insurance for?",
    },
    a: {
      tr: "Hayat sigortası, vefat veya poliçede tanımlı durumlarda sevdiklerinize ya da size finansal güvence sağlar. Kredi teminatı, koruma veya birikim amacıyla farklı plan seçenekleri bulunur.",
      en: "Life insurance provides financial security to your loved ones or to you in the event of death or situations defined in the policy. Different plan options exist for loan security, protection or savings purposes.",
    },
  },
  {
    q: {
      tr: "Kredi için hayat sigortası zorunlu mu?",
      en: "Is life insurance mandatory for a loan?",
    },
    a: {
      tr: "Bazı kredi türlerinde bankalar hayat sigortası talep edebilir. Bu durumda sigortayı dilediğiniz acenteden yaptırma hakkınız bulunur; biz de uygun seçenekleri karşılaştırarak size sunarız.",
      en: "For some loan types, banks may require life insurance. In that case you have the right to obtain the insurance from the agency of your choice; we compare suitable options and present them to you.",
    },
  },
  {
    q: {
      tr: "Sağlık durumum ve sigara kullanımım teklifi etkiler mi?",
      en: "Do my health status and smoking affect the quote?",
    },
    a: {
      tr: "Evet, hayat sigortasında yaş, sağlık beyanı ve yaşam tarzı gibi unsurlar değerlendirmeye girer. Bu beyanlar özel nitelikli veri olarak KVKK kapsamında, açık rızanızla ve gizlilikle işlenir.",
      en: "Yes, in life insurance factors such as age, health declaration and lifestyle are taken into account. These declarations are processed as special-category data under KVKK, with your explicit consent and in confidence.",
    },
  },
  {
    q: {
      tr: "Teminat tutarını ve süreyi nasıl belirlemeliyim?",
      en: "How should I decide on the coverage amount and term?",
    },
    a: {
      tr: "Teminat tutarı ve süre; amacınıza (koruma, kredi, birikim), gelir durumunuza ve sorumluluklarınıza göre belirlenir. İhtiyacınızı birlikte değerlendirip size uygun bir planlama öneririz.",
      en: "The coverage amount and term are set according to your purpose (protection, loan, savings), your income and your responsibilities. We assess your needs together and propose a plan suited to you.",
    },
  },
];

const konutFaqs: FaqItem[] = [
  {
    q: {
      tr: "Konut sigortası neleri kapsar?",
      en: "What does home insurance cover?",
    },
    a: {
      tr: "Konut sigortası genellikle yangın, su baskını, hırsızlık gibi risklere karşı binanızı ve dilerseniz eşyalarınızı teminat altına alır. Seçtiğiniz pakete göre ek teminatlar eklenebilir.",
      en: "Home insurance generally covers your building and, if you wish, your belongings against risks such as fire, flooding and theft. Additional covers can be added depending on the package you choose.",
    },
  },
  {
    q: {
      tr: "Konut sigortası ile DASK aynı şey mi?",
      en: "Are home insurance and DASK the same thing?",
    },
    a: {
      tr: "Hayır. DASK yalnızca deprem riskine yönelik zorunlu bir poliçedir ve binayı belirli bir limitle kapsar. Konut sigortası ise isteğe bağlıdır ve çok daha geniş teminatlar sunar; ikisi birlikte tercih edilebilir.",
      en: "No. DASK is a compulsory policy only for earthquake risk and covers the building up to a certain limit. Home insurance is optional and provides much broader cover; the two can be taken together.",
    },
  },
  {
    q: {
      tr: "Kiracıyım, konut sigortası yaptırabilir miyim?",
      en: "I am a tenant, can I get home insurance?",
    },
    a: {
      tr: "Evet. Kiracılar genellikle eşyalarını ve sorumluluklarını güvence altına alan poliçeler tercih eder; bina teminatı ise mülk sahibini ilgilendirir. İhtiyacınıza uygun kapsamı birlikte belirleriz.",
      en: "Yes. Tenants usually prefer policies that secure their belongings and liabilities, while the building cover concerns the owner. We determine the coverage suited to your needs together.",
    },
  },
  {
    q: {
      tr: "Eşya bedeli nasıl belirlenir?",
      en: "How is the contents value determined?",
    },
    a: {
      tr: "Eşya bedeli, evinizdeki eşyaların yaklaşık değerine göre belirlenir ve teminat tutarını etkiler. Doğru bir değerleme, hasar anında eksik teminat yaşanmaması için önemlidir; bu konuda size yardımcı oluruz.",
      en: "The contents value is based on the approximate value of the belongings in your home and affects the coverage amount. An accurate valuation is important to avoid underinsurance in case of a claim; we help you with this.",
    },
  },
];

const daskFaqs: FaqItem[] = [
  {
    q: {
      tr: "DASK zorunlu mu?",
      en: "Is DASK mandatory?",
    },
    a: {
      tr: "Evet. Zorunlu Deprem Sigortası (DASK), kapsamdaki konutlar için yasal olarak gereklidir ve bazı işlemlerde (örneğin abonelik) aranabilir. Poliçenizi hızlıca düzenlemenize yardımcı oluruz.",
      en: "Yes. Compulsory Earthquake Insurance (DASK) is legally required for covered residences and may be requested in certain transactions (such as utility subscriptions). We help you arrange your policy quickly.",
    },
  },
  {
    q: {
      tr: "DASK neyi, ne kadar karşılar?",
      en: "What and how much does DASK cover?",
    },
    a: {
      tr: "DASK, deprem ve depreme bağlı belirli riskler nedeniyle binada oluşan zararları, mevzuatla belirlenen azami teminat limiti dâhilinde karşılar. Limit üstü ve eşya için konut sigortası tamamlayıcı olur.",
      en: "DASK covers damage to the building caused by earthquake and certain earthquake-related risks, up to the maximum coverage limit set by the regulations. For amounts above the limit and for belongings, home insurance is complementary.",
    },
  },
  {
    q: {
      tr: "DASK primi neye göre hesaplanır?",
      en: "How is the DASK premium calculated?",
    },
    a: {
      tr: "DASK primi resmî tarifeye göre; konutun bulunduğu deprem risk bölgesi, yapı tarzı ve brüt yüzölçümü gibi etkenlerle belirlenir. Doğru bilgileri paylaştığınızda poliçenizi düzenleriz.",
      en: "The DASK premium is set by the official tariff, based on factors such as the earthquake risk zone of the residence, the construction type and the gross area. When you share accurate details, we issue your policy.",
    },
  },
  {
    q: {
      tr: "DASK poliçemi her yıl yenilemem gerekir mi?",
      en: "Do I need to renew my DASK policy every year?",
    },
    a: {
      tr: "Evet, DASK poliçeleri genellikle bir yıllıktır ve süre sonunda yenilenmesi gerekir. Yenileme döneminde size hatırlatma yapar, işlemlerinizi kolaylaştırırız.",
      en: "Yes, DASK policies are usually annual and need to be renewed at the end of the term. We remind you at renewal time and make the process easier for you.",
    },
  },
];

const seyahatFaqs: FaqItem[] = [
  {
    q: {
      tr: "Seyahat sağlık sigortası vize için gerekli mi?",
      en: "Is travel health insurance required for a visa?",
    },
    a: {
      tr: "Birçok ülke, özellikle Schengen bölgesi, vize başvurusunda geçerli bir seyahat sağlık sigortası talep eder. Gideceğiniz ülkenin koşullarına uygun poliçeyi sizin için hazırlarız.",
      en: "Many countries, especially the Schengen area, require valid travel health insurance for a visa application. We prepare a policy suited to the requirements of your destination country.",
    },
  },
  {
    q: {
      tr: "Seyahat sağlık sigortası neleri kapsar?",
      en: "What does travel health insurance cover?",
    },
    a: {
      tr: "Poliçe genellikle yurt dışında beklenmedik hastalık veya kaza durumunda tıbbi masrafları, acil tedavi ve kapsama göre ek hizmetleri içerir. Kapsam, seçtiğiniz plana ve süreye göre değişir.",
      en: "The policy generally includes medical expenses in case of unexpected illness or accident abroad, emergency treatment and, depending on coverage, additional services. The scope varies by the plan and duration you choose.",
    },
  },
  {
    q: {
      tr: "Poliçeyi seyahatten ne kadar önce yaptırmalıyım?",
      en: "How far in advance should I take out the policy?",
    },
    a: {
      tr: "Poliçenizi seyahatinizden ve özellikle vize başvurunuzdan önce düzenletmeniz önerilir. Başlangıç ve bitiş tarihlerini paylaşmanız yeterlidir; uygun süreli teklifi sunarız.",
      en: "It is advisable to arrange your policy before your trip and especially before your visa application. Just share your start and end dates and we present an offer for the appropriate duration.",
    },
  },
  {
    q: {
      tr: "Birden fazla kişi için tek poliçe yapılabilir mi?",
      en: "Can a single policy be issued for more than one person?",
    },
    a: {
      tr: "Evet, aile veya grup seyahatlerinde kişi sayısına göre uygun planlar düzenlenebilir. Seyahat bilgilerinizi ve kişi sayısını paylaştığınızda size en uygun seçeneği sunarız.",
      en: "Yes, for family or group trips suitable plans can be arranged according to the number of people. When you share your travel details and the number of people, we present the most suitable option.",
    },
  },
];

const kurumsalFaqs: FaqItem[] = [
  {
    q: {
      tr: "Kurumsal sigorta anlaşması nedir?",
      en: "What is a corporate insurance agreement?",
    },
    a: {
      tr: "Kurumsal anlaşma; çalışanlarınız, araç filonuz ve iş yeriniz için sigorta ihtiyaçlarını toplu olarak ele alan bir çözümdür. İhtiyaçlarınıza göre özel bir planlama oluşturmak için iletişime geçmeniz yeterlidir.",
      en: "A corporate agreement is a solution that handles the insurance needs of your employees, vehicle fleet and workplace collectively. To create a plan tailored to your needs, simply get in touch.",
    },
  },
  {
    q: {
      tr: "Hangi sigorta türleri kurumsal kapsamda değerlendirilebilir?",
      en: "Which insurance types can be considered under a corporate scope?",
    },
    a: {
      tr: "Tamamlayıcı/özel sağlık, hayat, araç (trafik/kasko), iş yeri ve sorumluluk gibi pek çok ürün kurumsal ihtiyaçlara göre bir arada planlanabilir. İhtiyacınızı dinleyip uygun yapıyı öneririz.",
      en: "Many products such as complementary/private health, life, motor (traffic/kasko), workplace and liability can be planned together according to corporate needs. We listen to your needs and propose a suitable structure.",
    },
  },
  {
    q: {
      tr: "Kurumsal teklif süreci nasıl ilerliyor?",
      en: "How does the corporate quote process proceed?",
    },
    a: {
      tr: "Kısa bir not veya iletişim bilgilerinizi bıraktığınızda sizinle iletişime geçer, ihtiyacınızı (örneğin çalışan ve araç sayısı) birlikte netleştiririz. Ardından şirket tekliflerini karşılaştırarak size sunarız.",
      en: "Once you leave a short note or your contact details, we get in touch and clarify your needs together (for example the number of employees and vehicles). We then compare company offers and present them to you.",
    },
  },
];

// ─────────────────────────────────────────────────────────────────────────────
// KATEGORİ LİSTESİ — /sss sayfası bu listeyi gruplu gösterir.
// Sıra: Genel → ürünler (definitions.ts katalog sırası). id'ler kararlı.
// ─────────────────────────────────────────────────────────────────────────────
export const faqCategories: FaqCategory[] = [
  {
    id: "genel",
    title: { tr: "Genel", en: "General" },
    items: [...generalFaqs, ...genelEkstra],
  },
  {
    id: "trafik",
    title: { tr: "Trafik Sigortası", en: "Traffic Insurance" },
    items: trafikFaqs,
  },
  {
    id: "kasko",
    title: { tr: "Kasko Sigortası", en: "Comprehensive Auto (Kasko)" },
    items: kaskoFaqs,
  },
  {
    id: "saglik",
    title: { tr: "Sağlık Sigortası", en: "Health Insurance" },
    items: saglikFaqs,
  },
  {
    id: "bes",
    title: { tr: "Bireysel Emeklilik (BES)", en: "Private Pension (BES)" },
    items: besFaqs,
  },
  {
    id: "hayat",
    title: { tr: "Hayat Sigortası", en: "Life Insurance" },
    items: hayatFaqs,
  },
  {
    id: "konut",
    title: { tr: "Konut Sigortası", en: "Home Insurance" },
    items: konutFaqs,
  },
  {
    id: "dask",
    title: { tr: "Zorunlu Deprem Sigortası (DASK)", en: "Compulsory Earthquake (DASK)" },
    items: daskFaqs,
  },
  {
    id: "seyahat",
    title: { tr: "Seyahat Sağlık Sigortası", en: "Travel Health Insurance" },
    items: seyahatFaqs,
  },
  {
    id: "kurumsal",
    title: { tr: "Kurumsal Anlaşma", en: "Corporate Agreement" },
    items: kurumsalFaqs,
  },
];

/** Tüm kategorilerdeki soruları düzleştirir (FAQPage JSON-LD için). */
export function getAllFaqItems(): FaqItem[] {
  return faqCategories.flatMap((c) => c.items);
}

/**
 * FAQPage JSON-LD üretir (docs/07).
 * - `items` verilmezse `generalFaqs` kullanılır (anasayfa & /planlar — kısa liste).
 * - /sss sayfası `getAllFaqItems()` geçerek TÜM (düzleştirilmiş) soruları içerir.
 */
export function buildFaqJsonLd(locale: Locale, items: FaqItem[] = generalFaqs) {
  return {
    "@context": "https://schema.org",
    "@type": "FAQPage",
    mainEntity: items.map((f) => ({
      "@type": "Question",
      name: f.q[locale],
      acceptedAnswer: { "@type": "Answer", text: f.a[locale] },
    })),
  };
}
