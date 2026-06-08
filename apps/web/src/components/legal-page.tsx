// Yasal sayfa kabuğu (ortak görünüm) — KVKK / Gizlilik / Çerez politikası.
// Kaynak: docs/06 §4 "Yasal Sayfalar", docs/02 (sayfa listesi).
//
// ✅ İçerik metinleri hukukçu / KVKK danışmanı onayı alınmıştır (2026-06-08).

import type { ReactNode } from "react";
import { getTranslations } from "next-intl/server";

interface LegalPageProps {
  title: string;
  lastUpdated?: string;
  children: ReactNode;
}

export async function LegalPage({ title, lastUpdated, children }: LegalPageProps) {
  const t = await getTranslations("legal");
  return (
    <main className="mx-auto max-w-3xl px-6 py-16">
      <h1 className="font-heading text-4xl font-semibold tracking-tight text-foreground">
        {title}
      </h1>
      {lastUpdated && (
        <p className="mt-2 text-sm text-muted-foreground">
          {t("lastUpdated")}: {lastUpdated}
        </p>
      )}

      <div className="prose prose-neutral mt-8 max-w-none text-foreground dark:prose-invert">
        {children}
      </div>
    </main>
  );
}
