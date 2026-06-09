// Teklif listesi sıralama + sayfa boyutu sabitleri/tipleri.
// ⚠️ Bu dosya prisma/server bağımlılığı İÇERMEZ — hem sunucu (lib/quotes.ts, page.tsx) hem
// CLIENT bileşeni (pagination.tsx) buradan import eder. (quotes.ts'ten import etmek client
// bundle'a prisma/node:crypto sızdırıp webpack hatası veriyordu.)

export type QuoteSort = "date_desc" | "date_asc" | "name_asc" | "name_desc";

export const PAGE_SIZES = [25, 50, 100, 150] as const;
export type PageSize = (typeof PAGE_SIZES)[number];

export const DEFAULT_PAGE_SIZE: PageSize = 25;
export const DEFAULT_SORT: QuoteSort = "date_desc";
