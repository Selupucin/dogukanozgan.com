// @do/db — KVKK veri silme / anonimleştirme yardımcıları.
// Kaynak: docs/06 §7 (Saklama & İmha), docs/04 "Veri Saklama & Silme".
//
// Bu fonksiyonlar İSKELET niteliğindedir; Aşama 3'te admin panel bunları çağırır
// (silme talebi geldiğinde veya saklama süresi dolduğunda). Veri sorumlusu KVKK
// gereği: süre dolunca veya talep üzerine kişisel veriyi SİLER veya ANONİMLEŞTİRİR.
//
// ⚠️ Bu modül Vercel Blob (BLOB_READ_WRITE_TOKEN) silme erişimi de kullanır →
// YALNIZCA sunucu tarafı.
// TODO(doc): Saklama süresi (ay/yıl) hukukçu ile netleşince RETENTION_DAYS doldurulur.

import { prisma } from "./index";
import { deleteFromStorage, isStorageConfigured } from "./storage";
import { logError } from "./log-error";

/**
 * Saklama süresi (gün). docs/06 §7: süre hukukçu ile belirlenecek → şimdilik null
 * (otomatik imha KAPALI; yalnızca manuel silme/anonimleştirme çalışır).
 */
// TODO(doc): Hukukçu onayıyla net değer (örn. 180/365) girilecek.
export const RETENTION_DAYS: number | null = null;

/**
 * Bir teklif talebini KALICI olarak siler (ilişkili Note ve Asset'ler cascade ile
 * gider). İlişkili Storage dosyaları da silinmeye çalışılır (KVKK imha).
 *
 * @returns silinen quote id (yoksa null).
 */
export async function deleteQuoteRequest(quoteId: string): Promise<string | null> {
  const quote = await prisma.quoteRequest.findUnique({
    where: { id: quoteId },
    include: { assets: true },
  });
  if (!quote) return null;

  // Önce Storage dosyalarını sil (DB cascade dosyaları silmez).
  const paths = quote.assets.map((a) => a.path).filter(Boolean);
  if (paths.length > 0 && isStorageConfigured()) {
    try {
      await deleteFromStorage(paths);
    } catch (err) {
      // Storage silme başarısız olsa bile DB kaydını silmeye devam ederiz;
      // yetim dosyalar periyodik temizlikle ele alınır. // TODO(doc): temizlik job'ı.
      logError("[kvkk] storage delete failed, continuing:", err);
    }
  }

  await prisma.quoteRequest.delete({ where: { id: quoteId } });
  return quoteId;
}

/**
 * Bir teklif talebini ANONİMLEŞTİRİR: kişisel veriyi (ad, telefon, e-posta,
 * payload, rıza kanıtı) maskeler ama istatistik/CRM kaydını (ürün, durum, tarih)
 * korur. İlişkili dosyalar silinir. Hukuki kanıt olarak rıza zamanı/IP TUTULMAZ
 * (anonimleştirme amacı kişisel veriyi kaldırmaktır). docs/06 §7.
 */
export async function anonymizeQuoteRequest(quoteId: string): Promise<string | null> {
  const quote = await prisma.quoteRequest.findUnique({
    where: { id: quoteId },
    include: { assets: true },
  });
  if (!quote) return null;

  const paths = quote.assets.map((a) => a.path).filter(Boolean);
  if (paths.length > 0 && isStorageConfigured()) {
    try {
      await deleteFromStorage(paths);
    } catch (err) {
      logError("[kvkk] storage delete failed during anonymize:", err);
    }
  }

  await prisma.$transaction([
    // Asset kayıtları kişisel veri içerir → kaldırılır.
    prisma.asset.deleteMany({ where: { quoteId } }),
    prisma.quoteRequest.update({
      where: { id: quoteId },
      data: {
        fullName: "[silindi]",
        phone: "[silindi]",
        email: null,
        // payload zorunlu Json → anonimleştirmede boşaltılır ({}), kişisel veri kalmaz.
        payload: {},
        consentIp: null,
        consentUserAgent: null,
        // Not: consentKvkk/consentAt korunabilir (rıza VERİLDİĞİ gerçeği kişisel
        // veri değil); IP/UA kişisel veri olduğu için temizlenir.
      },
    }),
  ]);

  return quoteId;
}

/**
 * Saklama süresi dolan kayıtları toplu işler (periyodik job çağırır).
 * RETENTION_DAYS null ise NO-OP (henüz süre belirlenmedi).
 *
 * @param mode "delete" (varsayılan) | "anonymize"
 * @returns işlenen kayıt sayısı.
 */
export async function purgeExpiredQuoteRequests(
  mode: "delete" | "anonymize" = "delete",
): Promise<number> {
  if (RETENTION_DAYS == null) {
    // TODO(doc): Saklama süresi netleşene kadar otomatik imha çalışmaz.
    return 0;
  }

  const cutoff = new Date(Date.now() - RETENTION_DAYS * 24 * 60 * 60 * 1000);
  const expired = await prisma.quoteRequest.findMany({
    where: { createdAt: { lt: cutoff } },
    select: { id: true },
  });

  for (const { id } of expired) {
    if (mode === "delete") {
      await deleteQuoteRequest(id);
    } else {
      await anonymizeQuoteRequest(id);
    }
  }

  return expired.length;
}
