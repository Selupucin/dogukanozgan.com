"use client";

// Teklif listesi sıralama + sayfa boyutu + sayfalandırma kontrolleri.
// Kaynak: docs/05 "Teklif Listesi". URL query string üzerinden çalışır (Filters ile aynı
// desen; paylaşılabilir/işaretlenebilir). Sunucu bileşeni searchParams'tan okur.
//
// Sıralama veya sayfa boyutu değişince sayfa 1'e döner (filtre sonuçları kayar).
// @do/ui Select doğrudan kullanılır (tema-uyumlu, erişilebilir, dark mode); bu kontrollerin
// her zaman bir değeri olduğu için filter-select'teki "Tümü" sentinel'i gereksizdir.

import { useRouter, useSearchParams } from "next/navigation";
import { useCallback } from "react";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@do/ui";
import { buttonClass } from "@/components/ui";
import { PAGE_SIZES, type QuoteSort, type PageSize } from "@/lib/quote-list-options";

const SORT_OPTIONS: { value: QuoteSort; label: string }[] = [
  { value: "date_desc", label: "Tarih: Yeni → Eski" },
  { value: "date_asc", label: "Tarih: Eski → Yeni" },
  { value: "name_asc", label: "İsim: A → Z" },
  { value: "name_desc", label: "İsim: Z → A" },
];

export function PaginationBar({
  sort,
  pageSize,
  page,
  totalPages,
  total,
}: {
  sort: QuoteSort;
  pageSize: PageSize;
  page: number;
  totalPages: number;
  total: number;
}) {
  const router = useRouter();
  const params = useSearchParams();

  // Belirli anahtarları günceller; opsiyonel olarak sayfayı 1'e sıfırlar.
  const navigate = useCallback(
    (updates: Record<string, string>, resetPage: boolean) => {
      const next = new URLSearchParams(params.toString());
      for (const [key, value] of Object.entries(updates)) {
        if (value) next.set(key, value);
        else next.delete(key);
      }
      if (resetPage) next.delete("page");
      router.push(`/teklifler?${next.toString()}`);
    },
    [params, router],
  );

  const goToPage = useCallback(
    (target: number) => navigate({ page: String(target) }, false),
    [navigate],
  );

  return (
    <div className="flex flex-wrap items-center justify-between gap-3">
      <div className="flex flex-wrap items-end gap-3">
        <label className="flex w-52 flex-col gap-1 text-xs font-medium text-muted-foreground">
          Sırala
          <Select value={sort} onValueChange={(v) => navigate({ sort: v }, true)}>
            <SelectTrigger aria-label="Sıralama ölçütü" className="min-h-[40px] py-2 text-sm">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              {SORT_OPTIONS.map((o) => (
                <SelectItem key={o.value} value={o.value}>
                  {o.label}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </label>

        <label className="flex w-36 flex-col gap-1 text-xs font-medium text-muted-foreground">
          Sayfa boyutu
          <Select value={String(pageSize)} onValueChange={(v) => navigate({ pageSize: v }, true)}>
            <SelectTrigger aria-label="Sayfa başına kayıt" className="min-h-[40px] py-2 text-sm">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              {PAGE_SIZES.map((n) => (
                <SelectItem key={n} value={String(n)}>
                  {n} / sayfa
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </label>
      </div>

      <div className="flex flex-wrap items-center gap-3">
        <p className="text-sm text-muted-foreground" aria-live="polite">
          Sayfa {page} / {totalPages} · Toplam {total}
        </p>
        <div className="flex items-center gap-2">
          <button
            type="button"
            onClick={() => goToPage(page - 1)}
            disabled={page <= 1}
            aria-label="Önceki sayfa"
            className={buttonClass("outline", "sm")}
          >
            ‹ Önceki
          </button>
          <button
            type="button"
            onClick={() => goToPage(page + 1)}
            disabled={page >= totalPages}
            aria-label="Sonraki sayfa"
            className={buttonClass("outline", "sm")}
          >
            Sonraki ›
          </button>
        </div>
      </div>
    </div>
  );
}
