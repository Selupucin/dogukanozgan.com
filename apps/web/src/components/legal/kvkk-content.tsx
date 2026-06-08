// KVKK aydınlatma + açık rıza metinleri — TEK KAYNAK (docs/06 §2a "TEK KAYNAKTAN").
// Hem /kvkk sayfası hem de AutoForm rıza MODAL'ı bu bileşenleri kullanır; içerik
// kopyalanmaz. Bu bir client-uyumlu (server'da da çalışan) saf JSX bileşenidir.
//
// ✅ İçerik hukukçu / KVKK danışmanı onayı alınmıştır (2026-06-08).

import type { Locale } from "@/i18n/routing";

/** /kvkk aydınlatma metni gövdesi (locale'e göre). docs/06 §1 başlıkları. */
export function KvkkBody({ locale }: { locale: Locale }) {
  return locale === "tr" ? <KvkkTr /> : <KvkkEn />;
}

function KvkkTr() {
  return (
    <>
      <p>
        Bu aydınlatma metni, 6698 sayılı Kişisel Verilerin Korunması Kanunu (&quot;KVKK&quot;)
        kapsamında, veri sorumlusu sıfatıyla Doğukan Özgan tarafından hazırlanmıştır.
      </p>
      <h2>1. Veri Sorumlusu</h2>
      <p>Doğukan Özgan (sigorta acentesi). İletişim bilgileri yayımlanmadan teyit edilecektir.</p>
      <h2>2. İşlenen Kişisel Veriler</h2>
      <p>
        Ad-soyad, telefon, e-posta, <strong>TC Kimlik Numarası</strong>, araç/plaka bilgisi, adres
        ve bina bilgileri, doğum tarihi ve ilgili formlara göre sağlık verisi (özel nitelikli) gibi
        veriler işlenir.
      </p>
      <p>
        <strong>TC Kimlik Numarası</strong> (örneğin Konut ve Zorunlu Deprem Sigortası — DASK
        formlarında) <strong>genel nitelikli</strong> bir kişisel veridir; özel nitelikli kişisel
        veri <strong>değildir</strong> ve toplanması için ikinci/ayrı bir açık rıza gerekmez. Bu
        veri yalnızca <strong>kimlik doğrulama ve poliçe düzenleme (sözleşmenin ifası)</strong>{" "}
        amacıyla işlenir; güvenli şekilde saklanır ve gerekli yerlerde maskelenerek gösterilir.
      </p>
      <h2>3. İşleme Amaçları</h2>
      <p>
        Teklif hazırlanması, sizinle iletişime geçilmesi, kimliğinizin doğrulanması, poliçenizin
        düzenlenmesi ve sigorta hizmetinin sunulması.
      </p>
      <h2>4. Hukuki Sebep</h2>
      <p>
        Açık rıza ve <strong>sözleşmenin kurulması/ifası</strong> ile meşru menfaat. TC Kimlik
        Numarası bakımından hukuki sebep, sözleşmenin (poliçenin) kurulması ve ifasıdır.
      </p>
      <h2>5. Aktarım</h2>
      <p>Veriler, teklif amacıyla yetkili sigorta şirketleriyle paylaşılabilir.</p>
      <h2>6. Saklama Süresi</h2>
      <p>Yasal saklama süresi hukuki danışmanlık ile belirlenecektir.</p>
      <h2>7. Haklarınız</h2>
      <p>
        KVKK madde 11 kapsamında bilgi talep etme, düzeltme, silme ve itiraz haklarına sahipsiniz.
        Başvurularınızı veri sorumlusunun iletişim kanallarından iletebilirsiniz.
      </p>
    </>
  );
}

function KvkkEn() {
  return (
    <>
      <p>
        This notice is prepared by Doğukan Özgan as data controller under Turkish Law No. 6698
        (&quot;KVKK&quot;).
      </p>
      <h2>1. Data Controller</h2>
      <p>Doğukan Özgan (insurance agency). Contact details to be confirmed before publication.</p>
      <h2>2. Personal Data Processed</h2>
      <p>
        Name, phone, email, <strong>national ID number</strong>, vehicle/plate data, address and
        building details, date of birth and, depending on the form, health data (special category).
      </p>
      <p>
        The <strong>national ID number</strong> (e.g. in the Home and Compulsory Earthquake (DASK)
        insurance forms) is <strong>ordinary</strong> personal data; it is <strong>not</strong> a
        special-category personal data and no second/separate explicit consent is required to
        collect it. It is processed solely for{" "}
        <strong>identity verification and issuing the policy (performance of the contract)</strong>;
        it is stored securely and masked where displayed.
      </p>
      <h2>3. Purposes</h2>
      <p>
        Preparing a quote, contacting you, verifying your identity, issuing your policy, and
        providing the insurance service.
      </p>
      <h2>4. Legal Basis</h2>
      <p>
        Explicit consent, <strong>establishment/performance of a contract</strong>, and legitimate
        interest. For the national ID number, the legal basis is the establishment and performance
        of the contract (the policy).
      </p>
      <h2>5. Transfers</h2>
      <p>Data may be shared with authorized insurance companies for quoting purposes.</p>
      <h2>6. Retention</h2>
      <p>The retention period will be determined with legal counsel.</p>
      <h2>7. Your Rights</h2>
      <p>
        Under Article 11 of the KVKK you may request information, rectification, erasure and object
        to processing via the data controller&apos;s contact channels.
      </p>
    </>
  );
}

/**
 * Özel nitelikli (sağlık/hayat) veri için AÇIK RIZA metni gövdesi (docs/06 §5).
 * Sağlık/hayat formlarında ikinci rıza modal'ında gösterilir.
 */
export function SensitiveConsentBody({ locale }: { locale: Locale }) {
  return locale === "tr" ? <SensitiveTr /> : <SensitiveEn />;
}

function SensitiveTr() {
  return (
    <>
      <h2>Özel Nitelikli Kişisel Veri Açık Rıza Metni</h2>
      <p>
        Sağlık durumunuza ilişkin veriler (örn. kronik hastalık beyanı, sigara kullanımı) 6698
        sayılı KVKK kapsamında <strong>özel nitelikli kişisel veri</strong> sayılır ve yalnızca açık
        rızanızla işlenebilir.
      </p>
      <h2>Hangi Veriler?</h2>
      <p>
        İlgili teklif formunda beyan ettiğiniz sağlık/yaşam tarzı bilgileri (kronik hastalık
        var/yok, sigara kullanımı vb.).
      </p>
      <h2>İşleme Amacı</h2>
      <p>
        Yalnızca size uygun sağlık/hayat sigortası teklifinin hazırlanması ve ilgili sigorta
        şirketleriyle bu amaçla paylaşılması.
      </p>
      <h2>Koruma</h2>
      <p>
        Bu veriler en aza indirilerek toplanır, erişim yalnızca yetkili kişiyle sınırlıdır ve
        saklama süresi sonunda imha edilir/anonimleştirilir.
      </p>
      <h2>Rızanın Geri Alınması</h2>
      <p>
        Açık rızanızı dilediğiniz zaman veri sorumlusunun iletişim kanallarından geri alabilirsiniz;
        geri alma, önceki işlemelerin hukuka uygunluğunu etkilemez.
      </p>
    </>
  );
}

function SensitiveEn() {
  return (
    <>
      <h2>Explicit Consent for Special-Category Personal Data</h2>
      <p>
        Data relating to your health (e.g. chronic-illness declaration, smoking) is considered{" "}
        <strong>special-category personal data</strong> under Turkish Law No. 6698 (KVKK) and may
        only be processed with your explicit consent.
      </p>
      <h2>Which Data?</h2>
      <p>
        The health / lifestyle details you declare in the relevant quote form (chronic illness
        yes/no, smoking, etc.).
      </p>
      <h2>Purpose</h2>
      <p>
        Solely to prepare a suitable health/life insurance quote for you and to share it with the
        relevant insurers for that purpose.
      </p>
      <h2>Protection</h2>
      <p>
        This data is collected on a minimised basis, access is restricted to authorised personnel,
        and it is destroyed/anonymised at the end of the retention period.
      </p>
      <h2>Withdrawing Consent</h2>
      <p>
        You may withdraw your explicit consent at any time via the data controller&apos;s contact
        channels; withdrawal does not affect the lawfulness of prior processing.
      </p>
    </>
  );
}
