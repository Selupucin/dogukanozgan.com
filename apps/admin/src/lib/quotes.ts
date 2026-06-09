// Teklif veri erişimi (Prisma sorguları) — liste, özet, detay.
// Kaynak: docs/04 (QuoteRequest/Note/Asset), docs/05 (liste filtreleri, özet kartları).
//
// ⚠️ Gerçek DB henüz yok → bu sorgular derlenir ama çalışma zamanı testi Aşama 6'da.

import { prisma, isValidObjectId, type Prisma, type QuoteStatus } from "@do/db";
// Sıralama/sayfa boyutu sabit ve tipleri prisma'sız ayrı dosyada (client bileşeni de kullanır).
import {
  type QuoteSort,
  PAGE_SIZES,
  type PageSize,
  DEFAULT_PAGE_SIZE,
  DEFAULT_SORT,
} from "./quote-list-options";

// Geriye uyum: page.tsx bunları "@/lib/quotes"'ten import ediyor → re-export.
export { PAGE_SIZES, DEFAULT_PAGE_SIZE, DEFAULT_SORT };
export type { QuoteSort, PageSize };

export interface QuoteFilters {
  product?: string;
  status?: QuoteStatus;
  /** Başlangıç tarihi (dahil). */
  from?: Date;
  /** Bitiş tarihi (dahil — gün sonuna kadar). */
  to?: Date;
  /** Ad veya telefonda arama. */
  search?: string;
}

/** Filtreleri Prisma where koşuluna çevirir. */
function buildWhere(filters: QuoteFilters): Prisma.QuoteRequestWhereInput {
  const where: Prisma.QuoteRequestWhereInput = {};

  if (filters.product) where.product = filters.product;
  if (filters.status) where.status = filters.status;

  if (filters.from || filters.to) {
    where.createdAt = {};
    if (filters.from) where.createdAt.gte = filters.from;
    if (filters.to) where.createdAt.lte = filters.to;
  }

  if (filters.search && filters.search.trim()) {
    const q = filters.search.trim();
    where.OR = [
      { fullName: { contains: q, mode: "insensitive" } },
      { phone: { contains: q } },
      { email: { contains: q, mode: "insensitive" } },
    ];
  }

  return where;
}

/** `sort` değerini Prisma orderBy koşuluna çevirir. */
function buildOrderBy(sort: QuoteSort): Prisma.QuoteRequestOrderByWithRelationInput {
  switch (sort) {
    case "date_asc":
      return { createdAt: "asc" };
    case "name_asc":
      return { fullName: "asc" };
    case "name_desc":
      return { fullName: "desc" };
    case "date_desc":
    default:
      return { createdAt: "desc" };
  }
}

export interface QuoteListOptions {
  /** Sıralama (varsayılan: tarih, yeni→eski). */
  sort?: QuoteSort;
  /** Atlanacak kayıt sayısı (sayfalandırma). */
  skip?: number;
  /** Alınacak kayıt sayısı (sayfa boyutu). */
  take?: number;
}

/** Filtrelenmiş teklif listesi (sayfalandırma + sıralama; varsayılan en yeni üstte). */
export async function listQuotes(filters: QuoteFilters, options: QuoteListOptions = {}) {
  const { sort = DEFAULT_SORT, skip, take } = options;
  return prisma.quoteRequest.findMany({
    where: buildWhere(filters),
    orderBy: buildOrderBy(sort),
    skip,
    take,
    select: {
      id: true,
      product: true,
      fullName: true,
      phone: true,
      email: true,
      status: true,
      createdAt: true,
      _count: { select: { notes: true, assets: true } },
    },
  });
}

/** Filtreyle eşleşen toplam kayıt sayısı (sayfa sayısı hesabı için). */
export async function countQuotes(filters: QuoteFilters) {
  return prisma.quoteRequest.count({ where: buildWhere(filters) });
}

export interface QuoteSummary {
  total: number;
  yeni: number;
  buHafta: number;
  donusum: number;
}

/** Üst özet kartları (docs/05: Toplam · Yeni · Bu hafta · Dönüşüm). */
export async function getSummary(): Promise<QuoteSummary> {
  const startOfWeek = new Date();
  // Pazartesi başlangıçlı haftanın başı (00:00).
  const day = (startOfWeek.getDay() + 6) % 7; // Pazartesi=0
  startOfWeek.setDate(startOfWeek.getDate() - day);
  startOfWeek.setHours(0, 0, 0, 0);

  const [total, yeni, buHafta, donusum] = await Promise.all([
    prisma.quoteRequest.count(),
    prisma.quoteRequest.count({ where: { status: "YENI" } }),
    prisma.quoteRequest.count({ where: { createdAt: { gte: startOfWeek } } }),
    prisma.quoteRequest.count({ where: { status: "POLICE_YAPILDI" } }),
  ]);

  return { total, yeni, buHafta, donusum };
}

/** Tek teklif detayı (notlar + asset'ler dahil). */
export async function getQuote(id: string) {
  // MongoDB ObjectId 24 hex hane olmalı; değilse Prisma "Malformed ObjectID" fırlatır
  // ve sayfa yanıltıcı "DB'ye ulaşılamadı" gösterir. Geçersizse null → notFound.
  // Merkezi yardımcı (docs/13 §O1 — tekrar eden regex yerine).
  if (!isValidObjectId(id)) return null;
  return prisma.quoteRequest.findUnique({
    where: { id },
    include: {
      notes: { orderBy: { createdAt: "desc" } },
      assets: { orderBy: { createdAt: "asc" } },
    },
  });
}

export type QuoteListItem = Awaited<ReturnType<typeof listQuotes>>[number];
export type QuoteDetail = NonNullable<Awaited<ReturnType<typeof getQuote>>>;
