import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";
import { logError } from "@do/db";
import { getContactRequest } from "@/lib/contact-requests";
import { CONTACT_STATUS_LABELS, CONTACT_STATUS_BADGE_CLASS } from "@/lib/contact-crm";
import { formatDateTime, telHref, whatsappHref, mailtoHref } from "@/lib/contact";
import { Badge, Card, CardContent, CardHeader, CardTitle, buttonClass } from "@/components/ui";
import { ContactStatusControl } from "./status-control";
import { DeleteContactAction } from "./delete-action";

export const metadata: Metadata = {
  title: "İletişim Talebi — Yönetim",
  robots: { index: false, follow: false },
};

export const dynamic = "force-dynamic";

export default async function IletisimDetayPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;

  let contact: Awaited<ReturnType<typeof getContactRequest>> = null;
  let dbError = false;
  try {
    contact = await getContactRequest(id);
  } catch (err) {
    logError("[iletisim-detay] veri çekme hatası:", err);
    dbError = true;
  }

  if (dbError) {
    return (
      <main className="mx-auto max-w-4xl px-6 py-8">
        <BackLink />
        <Card className="mt-6 py-12 text-center">
          <p className="font-heading text-lg font-semibold">Veritabanına ulaşılamadı</p>
          <p className="mt-1 text-sm text-muted-foreground">
            Bağlantı yapılandırması eksik olabilir (DB bağlanınca açılacak).
          </p>
        </Card>
      </main>
    );
  }

  if (!contact) notFound();

  const waMessage = `Merhaba ${contact.fullName}, iletişim talebiniz hakkında size dönüş yapıyorum.`;

  return (
    <main className="mx-auto max-w-4xl px-6 py-8">
      <BackLink />

      <div className="mt-4 flex flex-wrap items-center justify-between gap-3">
        <div className="flex flex-col gap-1">
          <h1 className="font-heading text-2xl font-semibold">{contact.fullName}</h1>
          <div className="flex items-center gap-2">
            <Badge className={CONTACT_STATUS_BADGE_CLASS[contact.status]}>
              {CONTACT_STATUS_LABELS[contact.status]}
            </Badge>
            <span className="text-xs text-muted-foreground">
              {formatDateTime(contact.createdAt)} alındı
            </span>
          </div>
        </div>
      </div>

      {/* Hızlı aksiyonlar */}
      <div className="mt-4 flex flex-wrap gap-2">
        <a href={telHref(contact.phone)} className={buttonClass("secondary", "sm")}>
          Ara: {contact.phone}
        </a>
        <a
          href={whatsappHref(contact.phone, waMessage)}
          target="_blank"
          rel="noopener noreferrer"
          className={buttonClass("outline", "sm")}
        >
          WhatsApp
        </a>
        {contact.email && (
          <a
            href={mailtoHref(
              contact.email,
              contact.subject ? `Re: ${contact.subject}` : "İletişim talebiniz",
            )}
            className={buttonClass("outline", "sm")}
          >
            E-posta
          </a>
        )}
      </div>

      <div className="mt-6 grid gap-6 lg:grid-cols-3">
        {/* Sol: mesaj + iletişim */}
        <div className="flex flex-col gap-6 lg:col-span-2">
          <Card>
            <CardHeader>
              <CardTitle>İletişim Bilgileri</CardTitle>
            </CardHeader>
            <CardContent>
              <dl className="grid grid-cols-1 gap-x-6 gap-y-3 sm:grid-cols-2">
                <Row label="Ad Soyad" value={contact.fullName} />
                <Row label="Telefon" value={contact.phone} />
                <Row label="E-posta" value={contact.email ?? "—"} />
                <Row label="Konu" value={contact.subject ?? "—"} />
              </dl>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle>Mesaj</CardTitle>
            </CardHeader>
            <CardContent>
              <p className="whitespace-pre-wrap text-sm">{contact.message}</p>
            </CardContent>
          </Card>
        </div>

        {/* Sağ: durum + KVKK kanıtı + sil */}
        <div className="flex flex-col gap-6">
          <Card>
            <CardHeader>
              <CardTitle>Durum</CardTitle>
            </CardHeader>
            <CardContent className="flex flex-col gap-3">
              <div className="flex items-center gap-2">
                <span className="text-sm text-muted-foreground">Mevcut:</span>
                <Badge className={CONTACT_STATUS_BADGE_CLASS[contact.status]}>
                  {CONTACT_STATUS_LABELS[contact.status]}
                </Badge>
              </div>
              <ContactStatusControl id={contact.id} current={contact.status} />
            </CardContent>
          </Card>

          {/* KVKK rıza kanıtı (salt-okunur) — docs/06 §2 */}
          <Card>
            <CardHeader>
              <CardTitle>KVKK Rıza Kanıtı</CardTitle>
            </CardHeader>
            <CardContent>
              <dl className="flex flex-col gap-2 text-sm">
                <ConsentRow label="Açık rıza (KVKK)" ok={contact.consentKvkk} />
                <Row
                  label="Rıza zamanı"
                  value={contact.consentAt ? formatDateTime(contact.consentAt) : "—"}
                />
                <Row label="IP adresi" value={contact.consentIp ?? "—"} />
                <div className="flex flex-col">
                  <dt className="text-xs text-muted-foreground">Tarayıcı (User-Agent)</dt>
                  <dd className="break-words text-xs">{contact.consentUserAgent ?? "—"}</dd>
                </div>
              </dl>
              <p className="mt-3 text-xs text-muted-foreground">
                Salt-okunur — hukuki kanıt amaçlıdır (docs/06).
              </p>
            </CardContent>
          </Card>

          <Card className="border-destructive/40">
            <CardHeader>
              <CardTitle className="text-destructive">KVKK İşlemleri</CardTitle>
            </CardHeader>
            <CardContent className="flex flex-col gap-3">
              <p className="text-sm text-muted-foreground">
                Veri sahibi silme talebi veya saklama süresi dolduğunda kullanın.
              </p>
              <DeleteContactAction id={contact.id} />
            </CardContent>
          </Card>
        </div>
      </div>
    </main>
  );
}

function BackLink() {
  return (
    <Link
      href="/iletisim-talepleri"
      className="text-sm text-muted-foreground hover:text-foreground"
    >
      ← İletişim taleplerine dön
    </Link>
  );
}

function Row({ label, value }: { label: string; value: string }) {
  return (
    <div className="flex flex-col">
      <dt className="text-xs text-muted-foreground">{label}</dt>
      <dd className="text-sm font-medium">{value}</dd>
    </div>
  );
}

function ConsentRow({ label, ok }: { label: string; ok: boolean }) {
  return (
    <div className="flex items-center justify-between gap-2">
      <dt className="text-xs text-muted-foreground">{label}</dt>
      <dd>
        <Badge
          className={
            ok
              ? "bg-secondary/15 text-secondary border-secondary/30"
              : "bg-muted text-muted-foreground border-border"
          }
        >
          {ok ? "Verildi" : "Yok"}
        </Badge>
      </dd>
    </div>
  );
}
