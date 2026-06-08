import type { Metadata } from "next";
import Link from "next/link";
import { logError, type ContactStatus } from "@do/db";
import {
  listContactRequests,
  getContactSummary,
  type ContactListItem,
} from "@/lib/contact-requests";
import {
  CONTACT_STATUSES,
  CONTACT_STATUS_LABELS,
  CONTACT_STATUS_BADGE_CLASS,
} from "@/lib/contact-crm";
import { formatDate, telHref, whatsappHref } from "@/lib/contact";
import { Badge, Card, buttonClass } from "@/components/ui";
import { ContactFiltersBar } from "./filters";

export const metadata: Metadata = {
  title: "İletişim Talepleri — Yönetim",
  robots: { index: false, follow: false },
};

export const dynamic = "force-dynamic";

interface SearchParams {
  status?: string;
  q?: string;
}

function parseStatus(value?: string): ContactStatus | undefined {
  return value && CONTACT_STATUSES.includes(value as ContactStatus)
    ? (value as ContactStatus)
    : undefined;
}

export default async function IletisimTalepleriPage({
  searchParams,
}: {
  searchParams: Promise<SearchParams>;
}) {
  const sp = await searchParams;
  const filters = {
    status: parseStatus(sp.status),
    search: sp.q || undefined,
  };

  let items: ContactListItem[] = [];
  let summary = { total: 0, yeni: 0, buHafta: 0, yanitlanan: 0 };
  let dbError = false;
  try {
    [items, summary] = await Promise.all([listContactRequests(filters), getContactSummary()]);
  } catch (err) {
    logError("[iletisim-talepleri] veri çekme hatası:", err);
    dbError = true;
  }

  return (
    <main className="mx-auto max-w-6xl px-6 py-8">
      <h1 className="font-heading text-2xl font-semibold">İletişim Talepleri</h1>

      {/* Özet kartları */}
      <div className="mt-6 grid grid-cols-2 gap-3 sm:grid-cols-4">
        <SummaryCard label="Toplam talep" value={summary.total} />
        <SummaryCard label="Yeni" value={summary.yeni} accent="primary" />
        <SummaryCard label="Bu hafta" value={summary.buHafta} />
        <SummaryCard label="Yanıtlanan" value={summary.yanitlanan} accent="secondary" />
      </div>

      <div className="mt-6">
        <ContactFiltersBar current={{ status: sp.status, search: sp.q }} />
      </div>

      <div className="mt-6">
        {dbError ? (
          <EmptyState
            title="Veritabanına ulaşılamadı"
            description="Bağlantı yapılandırması (DATABASE_URL) eksik veya hatalı olabilir. DB bağlanınca liste dolacaktır."
          />
        ) : items.length === 0 ? (
          <EmptyState
            title="Kayıt bulunamadı"
            description="Seçili filtrelerle eşleşen iletişim talebi yok."
          />
        ) : (
          <ContactTable items={items} />
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

function ContactTable({ items }: { items: ContactListItem[] }) {
  return (
    <Card className="overflow-hidden">
      <div className="overflow-x-auto">
        <table className="w-full text-left text-sm">
          <thead className="border-b border-border bg-muted/40 text-xs uppercase text-muted-foreground">
            <tr>
              <th className="px-4 py-3 font-medium">Tarih</th>
              <th className="px-4 py-3 font-medium">Ad Soyad</th>
              <th className="px-4 py-3 font-medium">Konu</th>
              <th className="px-4 py-3 font-medium">Telefon</th>
              <th className="px-4 py-3 font-medium">Durum</th>
              <th className="px-4 py-3 font-medium">İşlem</th>
            </tr>
          </thead>
          <tbody>
            {items.map((c) => (
              <tr key={c.id} className="border-b border-border last:border-0 hover:bg-muted/30">
                <td className="whitespace-nowrap px-4 py-3 text-muted-foreground">
                  {formatDate(c.createdAt)}
                </td>
                <td className="px-4 py-3 font-medium">{c.fullName}</td>
                <td className="px-4 py-3 text-muted-foreground">{c.subject ?? "—"}</td>
                <td className="whitespace-nowrap px-4 py-3">
                  <div className="flex items-center gap-2">
                    <a href={telHref(c.phone)} className="hover:text-primary hover:underline">
                      {c.phone}
                    </a>
                    <a
                      href={whatsappHref(c.phone)}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="text-xs text-secondary hover:underline"
                    >
                      WhatsApp
                    </a>
                  </div>
                </td>
                <td className="px-4 py-3">
                  <Badge className={CONTACT_STATUS_BADGE_CLASS[c.status]}>
                    {CONTACT_STATUS_LABELS[c.status]}
                  </Badge>
                </td>
                <td className="px-4 py-3">
                  <Link
                    href={`/iletisim-talepleri/${c.id}`}
                    className={buttonClass("outline", "sm")}
                  >
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
