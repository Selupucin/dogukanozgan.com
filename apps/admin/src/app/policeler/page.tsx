import type { Metadata } from "next";
import Link from "next/link";
import type { QuoteRequest } from "@do/db";
import { getExpiringPolicies, logError } from "@do/db";
import {
  listRecentPolicies,
  daysUntil,
  urgencyOf,
  urgencyLabel,
  URGENCY_BADGE_CLASS,
  type RecentPolicy,
} from "@/lib/policies";
import { productLabel, productBadgeClass } from "@/lib/crm";
import { formatDate, telHref } from "@/lib/contact";
import { Badge, Card, CardContent, CardHeader, CardTitle, buttonClass } from "@/components/ui";
import { NotifyButton } from "./notify-button";

export const metadata: Metadata = {
  title: "Poliçeler — Yönetim",
  robots: { index: false, follow: false },
};

export const dynamic = "force-dynamic";

// docs/12 §🔧: yaklaşan poliçe penceresi (gün). 30/15/7 vurgusu policies.ts'te.
// TODO(doc): eşik/tarama mekanizması Doğukan ile netleşecek.
const WINDOW_DAYS = 30;

export default async function PolicelerPage() {
  let expiring: QuoteRequest[] = [];
  let recent: RecentPolicy[] = [];
  let dbError = false;
  try {
    [expiring, recent] = await Promise.all([
      getExpiringPolicies(WINDOW_DAYS),
      listRecentPolicies(20),
    ]);
  } catch (err) {
    logError("[policeler] veri çekme hatası:", err);
    dbError = true;
  }

  return (
    <main className="mx-auto max-w-6xl px-6 py-8">
      <div className="flex flex-wrap items-start justify-between gap-3">
        <div>
          <h1 className="font-heading text-2xl font-semibold">Poliçe Takvimi</h1>
          <p className="mt-1 text-sm text-muted-foreground">
            Önümüzdeki {WINDOW_DAYS} gün içinde bitecek poliçeler ve son yapılan/yenilenen
            poliçeler.
          </p>
        </div>
        <NotifyButton days={WINDOW_DAYS} />
      </div>

      {dbError ? (
        <Card className="mt-6 py-12 text-center">
          <p className="font-heading text-lg font-semibold">Veritabanına ulaşılamadı</p>
          <p className="mt-1 text-sm text-muted-foreground">
            Bağlantı yapılandırması eksik olabilir (DB bağlanınca dolacak).
          </p>
        </Card>
      ) : (
        <div className="mt-6 grid gap-6 lg:grid-cols-2">
          {/* Yaklaşan bitişler */}
          <Card>
            <CardHeader>
              <CardTitle>Yaklaşan Bitişler</CardTitle>
            </CardHeader>
            <CardContent>
              {expiring.length === 0 ? (
                <p className="text-sm text-muted-foreground">
                  Önümüzdeki {WINDOW_DAYS} gün içinde bitecek poliçe yok.
                </p>
              ) : (
                <ul className="flex flex-col gap-3">
                  {expiring.map((p) => {
                    const end = p.policyEndDate as Date;
                    const days = daysUntil(end);
                    return (
                      <li
                        key={p.id}
                        className="flex items-center justify-between gap-3 rounded-lg border border-border p-3"
                      >
                        <div className="flex flex-col gap-1">
                          <div className="flex items-center gap-2">
                            <Badge className={productBadgeClass(p.product)}>
                              {productLabel(p.product)}
                            </Badge>
                            <span className="font-medium">{p.fullName}</span>
                          </div>
                          <span className="text-xs text-muted-foreground">
                            Bitiş: {formatDate(end)} ·{" "}
                            <a
                              href={telHref(p.phone)}
                              className="hover:text-primary hover:underline"
                            >
                              {p.phone}
                            </a>
                          </span>
                        </div>
                        <div className="flex flex-col items-end gap-1">
                          <Badge className={URGENCY_BADGE_CLASS[urgencyOf(days)]}>
                            {urgencyLabel(days)}
                          </Badge>
                          <Link
                            href={`/teklifler/${p.id}`}
                            className="text-xs text-muted-foreground hover:text-foreground hover:underline"
                          >
                            Detay
                          </Link>
                        </div>
                      </li>
                    );
                  })}
                </ul>
              )}
            </CardContent>
          </Card>

          {/* Yeni / yenilenen poliçeler */}
          <Card>
            <CardHeader>
              <CardTitle>Son Poliçeler</CardTitle>
            </CardHeader>
            <CardContent>
              {recent.length === 0 ? (
                <p className="text-sm text-muted-foreground">Kayıtlı poliçe yok.</p>
              ) : (
                <ul className="flex flex-col gap-3">
                  {recent.map((p) => (
                    <li
                      key={p.id}
                      className="flex items-center justify-between gap-3 rounded-lg border border-border p-3"
                    >
                      <div className="flex flex-col gap-1">
                        <div className="flex items-center gap-2">
                          <Badge className={productBadgeClass(p.product)}>
                            {productLabel(p.product)}
                          </Badge>
                          <span className="font-medium">{p.fullName}</span>
                          {p.source === "MANUAL" && (
                            <span className="rounded-pill bg-muted px-1.5 text-[10px] font-medium text-muted-foreground">
                              manuel
                            </span>
                          )}
                        </div>
                        <span className="text-xs text-muted-foreground">
                          {p.policyStartDate ? formatDate(p.policyStartDate) : "—"}
                          {p.policyEndDate ? ` → ${formatDate(p.policyEndDate)}` : ""}
                        </span>
                      </div>
                      <Link href={`/teklifler/${p.id}`} className={buttonClass("outline", "sm")}>
                        Detay
                      </Link>
                    </li>
                  ))}
                </ul>
              )}
            </CardContent>
          </Card>
        </div>
      )}
    </main>
  );
}
