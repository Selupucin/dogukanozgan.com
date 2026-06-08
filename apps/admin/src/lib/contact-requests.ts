// İletişim talebi veri erişimi (Prisma sorguları) — liste, özet, detay.
// Kaynak: docs/12 §4 (İletişim Talepleri, K31), docs/04 (ContactRequest modeli).
//
// ⚠️ Gerçek DB henüz yok → bu sorgular derlenir ama çalışma zamanı testi DB bağlanınca.

import { prisma, isValidObjectId, type Prisma, type ContactStatus } from "@do/db";

export interface ContactFilters {
  status?: ContactStatus;
  /** Ad / telefon / e-posta / konuda arama. */
  search?: string;
}

/** Filtreleri Prisma where koşuluna çevirir. */
function buildWhere(filters: ContactFilters): Prisma.ContactRequestWhereInput {
  const where: Prisma.ContactRequestWhereInput = {};

  if (filters.status) where.status = filters.status;

  if (filters.search && filters.search.trim()) {
    const q = filters.search.trim();
    where.OR = [
      { fullName: { contains: q, mode: "insensitive" } },
      { phone: { contains: q } },
      { email: { contains: q, mode: "insensitive" } },
      { subject: { contains: q, mode: "insensitive" } },
    ];
  }

  return where;
}

/** Filtrelenmiş iletişim talebi listesi (en yeni üstte). */
export async function listContactRequests(filters: ContactFilters) {
  return prisma.contactRequest.findMany({
    where: buildWhere(filters),
    orderBy: { createdAt: "desc" },
    select: {
      id: true,
      fullName: true,
      phone: true,
      email: true,
      subject: true,
      status: true,
      createdAt: true,
    },
  });
}

export interface ContactSummary {
  total: number;
  yeni: number;
  buHafta: number;
  yanitlanan: number;
}

/** Üst özet kartları (Toplam · Yeni · Bu hafta · Yanıtlanan). */
export async function getContactSummary(): Promise<ContactSummary> {
  const startOfWeek = new Date();
  const day = (startOfWeek.getDay() + 6) % 7; // Pazartesi=0
  startOfWeek.setDate(startOfWeek.getDate() - day);
  startOfWeek.setHours(0, 0, 0, 0);

  const [total, yeni, buHafta, yanitlanan] = await Promise.all([
    prisma.contactRequest.count(),
    prisma.contactRequest.count({ where: { status: "YENI" } }),
    prisma.contactRequest.count({ where: { createdAt: { gte: startOfWeek } } }),
    prisma.contactRequest.count({ where: { status: "YANITLANDI" } }),
  ]);

  return { total, yeni, buHafta, yanitlanan };
}

/** Tek iletişim talebi detayı. */
export async function getContactRequest(id: string) {
  // ObjectId guard (docs/13 §O1) — geçersizse Prisma "Malformed ObjectID" fırlatmasın.
  if (!isValidObjectId(id)) return null;
  return prisma.contactRequest.findUnique({ where: { id } });
}

export type ContactListItem = Awaited<ReturnType<typeof listContactRequests>>[number];
export type ContactDetail = NonNullable<Awaited<ReturnType<typeof getContactRequest>>>;
