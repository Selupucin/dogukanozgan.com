import type { Metadata } from "next";
import Link from "next/link";
import { logError, type QuoteStatus } from "@do/db";
import { listQuotes, getSummary, type QuoteListItem } from "@/lib/quotes";
import {
  STATUS_LABELS,
  STATUS_BADGE_CLASS,
  productLabel,
  productBadgeClass,
  QUOTE_STATUSES,
} from "@/lib/crm";
import { formatDate, telHref, whatsappHref } from "@/lib/contact";
import { Badge, Card, buttonClass } from "@/components/ui";
import { Filters } from "./filters";

export const metadata: Metadata = {
  title: "Teklifler — Yönetim",
  robots: { index: false, follow: false },
};

// Gerçek zamanlı (DB) veriye dayanır → her istekte taze.
export const dynamic = "force-dynamic";

interface SearchParams {
  product?: string;
  status?: string;
  from?: string;
  to?: string;
  q?: string;
}

function parseStatus(value?: string): QuoteStatus | undefined {
  return value && QUOTE_STATUSES.includes(value as QuoteStatus)
    ? (value as QuoteStatus)
    : undefined;
}

function endOfDay(value?: string): Date | undefined {
  if (!value) return undefined;
  const d = new Date(value);
  if (Number.isNaN(d.getTime())) return undefined;
  d.setHours(23, 59, 59, 999);
  return d;
}

function startOfDay(value?: string): Date | undefined {
  if (!value) return undefined;
  const d = new Date(value);
  if (Number.isNaN(d.getTime())) return undefined;
  d.setHours(0, 0, 0, 0);
  return d;
}

export default async function TekliflerPage({
  searchParams,
}: {
  searchParams: Promise<SearchParams>;
}) {
  const sp = await searchParams;

  const filters = {
    product: sp.product || undefined,
    status: parseStatus(sp.status),
    from: startOfDay(sp.from),
    to: endOfDay(sp.to),
    search: sp.q || undefined,
  };

  // Veri çekimi — DB yoksa hata yakalanır, boş/uyarı durumu gösterilir.
  let quotes: QuoteListItem[] = [];
  let summary = { total: 0, yeni: 0, buHafta: 0, donusum: 0 };
  let dbError = false;
  try {
    [quotes, summary] = await Promise.all([listQuotes(filters), getSummary()]);
  } catch (err) {
    logError("[teklifler] veri çekme hatası:", err);
    dbError = true;
  }

  return (
    <main className="mx-auto max-w-6xl px-6 py-8">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <h1 className="font-heading text-2xl font-semibold">Teklif Talepleri</h1>
        <Link href="/teklifler/yeni" className={buttonClass("primary", "sm")}>
          + Manuel Ekle
        </Link>
      </div>

      {/* Özet kartları (docs/05) */}
      <div className="mt-6 grid grid-cols-2 gap-3 sm:grid-cols-4">
        <SummaryCard label="Toplam talep" value={summary.total} />
        <SummaryCard label="Yeni" value={summary.yeni} accent="primary" />
        <SummaryCard label="Bu hafta" value={summary.buHafta} />
        <SummaryCard label="Poliçe yapıldı" value={summary.donusum} accent="secondary" />
      </div>

      {/* Filtreler */}
      <div className="mt-6">
        <Filters
          current={{
            product: sp.product,
            status: sp.status,
            from: sp.from,
            to: sp.to,
            search: sp.q,
          }}
        />
      </div>

      {/* Tablo / durumlar */}
      <div className="mt-6">
        {dbError ? (
          <EmptyState
            title="Veritabanına ulaşılamadı"
            description="Bağlantı yapılandırması (DATABASE_URL) eksik veya hatalı olabilir. Aşama 6'da gerçek MongoDB Atlas bağlanınca liste dolacaktır."
          />
        ) : quotes.length === 0 ? (
          <EmptyState
            title="Kayıt bulunamadı"
            description="Seçili filtrelerle eşleşen teklif talebi yok."
          />
        ) : (
          <QuotesTable quotes={quotes} />
        )}
      </div>
    </main>
  );
}

function SummaryCard({
  label,
  value,
  accent,
}: {
  label: string;
  value: number;
  accent?: "primary" | "secondary";
}) {
  const valueColor =
    accent === "primary" ? "text-primary" : accent === "secondary" ? "text-secondary" : "";
  return (
    <Card className="p-4">
      <p className="text-xs text-muted-foreground">{label}</p>
      <p className={`mt-1 font-heading text-2xl font-semibold ${valueColor}`}>{value}</p>
    </Card>
  );
}

function EmptyState({ title, description }: { title: string; description: string }) {
  return (
    <Card className="flex flex-col items-center gap-2 py-16 text-center">
      <p className="font-heading text-lg font-semibold">{title}</p>
      <p className="max-w-md text-sm text-muted-foreground">{description}</p>
    </Card>
  );
}

function QuotesTable({ quotes }: { quotes: QuoteListItem[] }) {
  return (
    <Card className="overflow-hidden">
      <div className="overflow-x-auto">
        <table className="w-full text-left text-sm">
          <thead className="border-b border-border bg-muted/40 text-xs uppercase text-muted-foreground">
            <tr>
              <th className="px-4 py-3 font-medium">Tarih</th>
              <th className="px-4 py-3 font-medium">Ürün</th>
              <th className="px-4 py-3 font-medium">Ad Soyad</th>
              <th className="px-4 py-3 font-medium">Telefon</th>
              <th className="px-4 py-3 font-medium">Durum</th>
              <th className="px-4 py-3 font-medium">İşlem</th>
            </tr>
          </thead>
          <tbody>
            {quotes.map((q) => (
              <tr key={q.id} className="border-b border-border last:border-0 hover:bg-muted/30">
                <td className="whitespace-nowrap px-4 py-3 text-muted-foreground">
                  {formatDate(q.createdAt)}
                </td>
                <td className="px-4 py-3">
                  <Badge className={productBadgeClass(q.product)}>{productLabel(q.product)}</Badge>
                </td>
                <td className="px-4 py-3 font-medium">{q.fullName}</td>
                <td className="whitespace-nowrap px-4 py-3">
                  <div className="flex items-center gap-2">
                    <a href={telHref(q.phone)} className="hover:text-primary hover:underline">
                      {q.phone}
                    </a>
                    <a
                      href={whatsappHref(q.phone)}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="text-xs text-secondary hover:underline"
                    >
                      WhatsApp
                    </a>
                  </div>
                </td>
                <td className="px-4 py-3">
                  <Badge className={STATUS_BADGE_CLASS[q.status]}>{STATUS_LABELS[q.status]}</Badge>
                </td>
                <td className="px-4 py-3">
                  <Link href={`/teklifler/${q.id}`} className={buttonClass("outline", "sm")}>
                    Detay
                  </Link>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </Card>
  );
}
