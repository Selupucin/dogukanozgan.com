import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";
import { isStorageConfigured, logError } from "@do/db";
import { isEmailConfigured } from "@do/email";
import { getQuote } from "@/lib/quotes";
import { describePayload } from "@/lib/payload";
import { STATUS_LABELS, STATUS_BADGE_CLASS, productLabel, productBadgeClass } from "@/lib/crm";
import { formatDate, formatDateTime, telHref, whatsappHref, mailtoHref } from "@/lib/contact";
import { Badge, Card, CardContent, CardHeader, CardTitle, buttonClass } from "@/components/ui";
import { StatusControl } from "./status-control";
import { NoteForm } from "./note-form";
import { KvkkActions } from "./kvkk-actions";
import { PolicyDelivery } from "./policy-delivery";
import { PolicyDates } from "./policy-dates";

export const metadata: Metadata = {
  title: "Teklif Detayı — Yönetim",
  robots: { index: false, follow: false },
};

export const dynamic = "force-dynamic";

/**
 * docs/13 §Y1: Ham blob URL (Asset.url) admin HTML'ine GÖMÜLMEZ. Vercel Blob yalnız
 * `access:"public"` desteklediğinden URL imzasızdır; bunun yerine her dosya auth-gated
 * proxy üzerinden gösterilir → `/dosya/<assetId>` (apps/admin/src/app/dosya/[assetId]).
 * Proxy oturum kontrolü yapar ve içeriği sunucuda stream eder (docs/06 §5b güncel).
 */
function buildAssetViews(assets: { id: string; url: string; kind: string }[]) {
  return {
    // src/href ham blob URL değil, auth-gated proxy rotasıdır.
    items: assets.map((a) => ({ id: a.id, src: `/dosya/${a.id}`, kind: a.kind })),
    configured: assets.length === 0 || assets.some((a) => Boolean(a.url)),
  };
}

export default async function TeklifDetayPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;

  let quote: Awaited<ReturnType<typeof getQuote>> = null;
  let dbError = false;
  try {
    quote = await getQuote(id);
  } catch (err) {
    logError("[teklif-detay] veri çekme hatası:", err);
    dbError = true;
  }

  if (dbError) {
    return (
      <main className="mx-auto max-w-4xl px-6 py-8">
        <BackLink />
        <Card className="mt-6 py-12 text-center">
          <p className="font-heading text-lg font-semibold">Kayıt yüklenemedi</p>
          <p className="mt-1 text-sm text-muted-foreground">
            Veritabanına geçici olarak ulaşılamadı. Lütfen sayfayı yenileyin; sorun sürerse bağlantı
            (DATABASE_URL) ayarını kontrol edin.
          </p>
        </Card>
      </main>
    );
  }

  if (!quote) notFound();

  const fields = describePayload(quote.product, quote.payload);
  const { items: assets, configured: storageConfigured } = buildAssetViews(quote.assets);
  const blobConfigured = isStorageConfigured();
  const emailConfigured = isEmailConfigured();
  const isPolicy = quote.status === "POLICE_YAPILDI";

  const waMessage = `Merhaba ${quote.fullName}, ${productLabel(quote.product)} talebiniz hakkında arıyorum.`;

  return (
    <main className="mx-auto max-w-4xl px-6 py-8">
      <BackLink />

      {/* Başlık */}
      <div className="mt-4 flex flex-wrap items-center justify-between gap-3">
        <div className="flex flex-col gap-1">
          <h1 className="font-heading text-2xl font-semibold">{quote.fullName}</h1>
          <div className="flex items-center gap-2">
            <Badge className={productBadgeClass(quote.product)}>
              {productLabel(quote.product)}
            </Badge>
            <Badge className={STATUS_BADGE_CLASS[quote.status]}>
              {STATUS_LABELS[quote.status]}
            </Badge>
            {quote.source === "MANUAL" && (
              <Badge className="bg-muted text-muted-foreground border-border">Manuel kayıt</Badge>
            )}
            <span className="text-xs text-muted-foreground">
              {formatDateTime(quote.createdAt)} alındı
            </span>
            {quote.trackingCode && (
              <span className="text-xs text-muted-foreground">
                · Takip kodu: <span className="font-mono">{quote.trackingCode}</span>
              </span>
            )}
          </div>
        </div>
      </div>

      {/* Hızlı aksiyonlar (docs/05) */}
      <div className="mt-4 flex flex-wrap gap-2">
        <a href={telHref(quote.phone)} className={buttonClass("secondary", "sm")}>
          Ara: {quote.phone}
        </a>
        <a
          href={whatsappHref(quote.phone, waMessage)}
          target="_blank"
          rel="noopener noreferrer"
          className={buttonClass("outline", "sm")}
        >
          WhatsApp
        </a>
        {quote.email && (
          <a
            href={mailtoHref(quote.email, `${productLabel(quote.product)} talebiniz`)}
            className={buttonClass("outline", "sm")}
          >
            E-posta
          </a>
        )}
      </div>

      <div className="mt-6 grid gap-6 lg:grid-cols-3">
        {/* Sol: form alanları + dosyalar */}
        <div className="flex flex-col gap-6 lg:col-span-2">
          <Card>
            <CardHeader>
              <CardTitle>İletişim Bilgileri</CardTitle>
            </CardHeader>
            <CardContent>
              <dl className="grid grid-cols-1 gap-x-6 gap-y-3 sm:grid-cols-2">
                <Row label="Ad Soyad" value={quote.fullName} />
                <Row label="Telefon" value={quote.phone} />
                <Row label="E-posta" value={quote.email ?? "—"} />
                <Row label="Form dili" value={quote.locale.toUpperCase()} />
              </dl>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle>Form Alanları</CardTitle>
            </CardHeader>
            <CardContent>
              {fields.length === 0 ? (
                <p className="text-sm text-muted-foreground">Ek form alanı yok.</p>
              ) : (
                <dl className="grid grid-cols-1 gap-x-6 gap-y-3 sm:grid-cols-2">
                  {fields.map((f) => (
                    <div key={f.key} className="flex flex-col">
                      <dt className="flex items-center gap-1 text-xs text-muted-foreground">
                        {f.label}
                        {f.sensitive && (
                          <span
                            title="Özel nitelikli (sağlık) veri"
                            className="rounded-pill bg-destructive/15 px-1.5 text-[10px] font-medium text-destructive"
                          >
                            özel nitelikli
                          </span>
                        )}
                      </dt>
                      <dd className="text-sm font-medium">{f.value}</dd>
                    </div>
                  ))}
                </dl>
              )}
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle>Yüklenen Dosyalar</CardTitle>
            </CardHeader>
            <CardContent>
              {quote.assets.length === 0 ? (
                <p className="text-sm text-muted-foreground">Yüklenen dosya yok.</p>
              ) : !storageConfigured ? (
                <p className="text-sm text-muted-foreground">
                  {quote.assets.length} dosya kayıtlı ancak depolama (Vercel Blob) yapılandırması
                  eksik — dosya görüntülenemiyor.
                </p>
              ) : (
                <div className="grid grid-cols-2 gap-3 sm:grid-cols-3">
                  {assets.map((a) => (
                    <a
                      key={a.id}
                      href={a.src}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="group flex flex-col gap-1 rounded-lg border border-border p-2 hover:border-primary"
                    >
                      {/* eslint-disable-next-line @next/next/no-img-element */}
                      <img
                        src={a.src}
                        alt={a.kind}
                        className="aspect-square w-full rounded-md object-cover"
                      />
                      <span className="text-xs capitalize text-muted-foreground">{a.kind}</span>
                    </a>
                  ))}
                </div>
              )}
              <p className="mt-3 text-xs text-muted-foreground">
                Dosyalar yalnız bu yetkili panelde, oturum doğrulamalı bir proxy üzerinden
                görüntülenir; ham depolama bağlantısı tarayıcıya verilmez (docs/06, docs/13 §Y1).
              </p>
            </CardContent>
          </Card>

          {/* Notlar */}
          <Card>
            <CardHeader>
              <CardTitle>Notlar</CardTitle>
            </CardHeader>
            <CardContent className="flex flex-col gap-4">
              <NoteForm quoteId={quote.id} />
              {quote.notes.length === 0 ? (
                <p className="text-sm text-muted-foreground">Henüz not eklenmedi.</p>
              ) : (
                <ul className="flex flex-col gap-3">
                  {quote.notes.map((n) => (
                    <li key={n.id} className="rounded-lg border border-border bg-muted/30 p-3">
                      <p className="whitespace-pre-wrap text-sm">{n.body}</p>
                      <p className="mt-1 text-xs text-muted-foreground">
                        {formatDateTime(n.createdAt)}
                      </p>
                    </li>
                  ))}
                </ul>
              )}
            </CardContent>
          </Card>
        </div>

        {/* Sağ: CRM durumu + KVKK kanıtı + KVKK aksiyonları */}
        <div className="flex flex-col gap-6">
          <Card>
            <CardHeader>
              <CardTitle>CRM Durumu</CardTitle>
            </CardHeader>
            <CardContent className="flex flex-col gap-3">
              <div className="flex items-center gap-2">
                <span className="text-sm text-muted-foreground">Mevcut:</span>
                <Badge className={STATUS_BADGE_CLASS[quote.status]}>
                  {STATUS_LABELS[quote.status]}
                </Badge>
              </div>
              <StatusControl quoteId={quote.id} current={quote.status} />
              <p className="text-xs text-muted-foreground">
                Son güncelleme: {formatDateTime(quote.updatedAt)}
              </p>
            </CardContent>
          </Card>

          {/* Poliçe tarihleri + teslim — yalnız POLICE_YAPILDI durumunda (K32) */}
          {isPolicy && (
            <>
              <Card>
                <CardHeader>
                  <CardTitle>Poliçe Tarihleri</CardTitle>
                </CardHeader>
                <CardContent className="flex flex-col gap-3">
                  <dl className="flex flex-col gap-2 text-sm">
                    <Row
                      label="Başlangıç"
                      value={quote.policyStartDate ? formatDate(quote.policyStartDate) : "—"}
                    />
                    <Row
                      label="Bitiş"
                      value={quote.policyEndDate ? formatDate(quote.policyEndDate) : "—"}
                    />
                  </dl>
                  <PolicyDates
                    quoteId={quote.id}
                    start={quote.policyStartDate}
                    end={quote.policyEndDate}
                  />
                </CardContent>
              </Card>

              <Card>
                <CardHeader>
                  <CardTitle>Poliçe Yükle &amp; Gönder</CardTitle>
                </CardHeader>
                <CardContent>
                  <PolicyDelivery
                    quoteId={quote.id}
                    hasEmail={Boolean(quote.email)}
                    emailConfigured={emailConfigured}
                    storageConfigured={blobConfigured}
                  />
                </CardContent>
              </Card>
            </>
          )}

          {/* KVKK rıza kanıtı (salt-okunur) — docs/05, docs/06 §2 */}
          <Card>
            <CardHeader>
              <CardTitle>KVKK Rıza Kanıtı</CardTitle>
            </CardHeader>
            <CardContent>
              <dl className="flex flex-col gap-2 text-sm">
                <ConsentRow label="Açık rıza (KVKK)" ok={quote.consentKvkk} />
                <ConsentRow label="Özel nitelikli rıza (sağlık)" ok={quote.consentSensitive} />
                <Row
                  label="Rıza zamanı"
                  value={quote.consentAt ? formatDateTime(quote.consentAt) : "—"}
                />
                <Row label="IP adresi" value={quote.consentIp ?? "—"} />
                <div className="flex flex-col">
                  <dt className="text-xs text-muted-foreground">Tarayıcı (User-Agent)</dt>
                  <dd className="break-words text-xs">{quote.consentUserAgent ?? "—"}</dd>
                </div>
              </dl>
              <p className="mt-3 text-xs text-muted-foreground">
                Salt-okunur — hukuki kanıt amaçlıdır (docs/06).
              </p>
            </CardContent>
          </Card>

          {/* KVKK aksiyonları */}
          <Card className="border-destructive/40">
            <CardHeader>
              <CardTitle className="text-destructive">KVKK İşlemleri</CardTitle>
            </CardHeader>
            <CardContent>
              <KvkkActions quoteId={quote.id} />
            </CardContent>
          </Card>
        </div>
      </div>
    </main>
  );
}

function BackLink() {
  return (
    <Link href="/teklifler" className="text-sm text-muted-foreground hover:text-foreground">
      ← Tekliflere dön
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
