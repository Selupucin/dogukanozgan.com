// @do/db — paylaşımlı Prisma client.
// Hem apps/web (yazma) hem apps/admin (okuma/güncelleme) buradan import eder.
// Geliştirmede hot-reload sırasında birden çok client oluşmasını engellemek için
// global singleton kullanılır.

import { PrismaClient } from "@prisma/client";

const globalForPrisma = globalThis as unknown as {
  prisma: PrismaClient | undefined;
};

export const prisma =
  globalForPrisma.prisma ??
  new PrismaClient({
    log: process.env.NODE_ENV === "development" ? ["error", "warn"] : ["error"],
  });

if (process.env.NODE_ENV !== "production") {
  globalForPrisma.prisma = prisma;
}

// Prisma tarafından üretilen tipleri ve enum'ları yeniden dışa aktar.
export * from "@prisma/client";

// Vercel Blob depolama (yükleme + silme) yardımcıları — YALNIZCA sunucu.
export * from "./storage";

// Dosya erişim imzası (HMAC süreli token) — docs/13 §Y1. Ham blob URL'i ifşa etmeden
// müşteriye süreli poliçe indirme linki verir. YALNIZCA sunucu.
export * from "./file-access";

// Sunucu-tarafı dosya doğrulama (MIME + magic-byte) — docs/13 §K2. YALNIZCA sunucu.
export * from "./file-validation";

// KVKK veri silme / anonimleştirme yardımcıları (Aşama 3 admin çağırır).
export * from "./kvkk";

// Admin kimlik doğrulama yardımcıları (şifre hash + Credentials doğrulama).
export * from "./auth";

// Teklif durum-takip kodu (K30) — üretim + KVKK-güvenli durum sorgusu.
export * from "./tracking";

// Admin içi bildirimler (K29) — oluştur/listele/okundu.
export * from "./notifications";

// İletişim talepleri (K31) — oluştur + ILETISIM bildirimi.
export * from "./contact";

// Teklif/poliçe yaşam döngüsü (K30/K32) — manuel oluştur, poliçe tarih/belge, bitiş sorgusu.
export * from "./quotes";

// Dağıtık (kalıcı) rate-limit — docs/13 §Y2. MongoDB tabanlı; in-memory limiter yerine.
// YALNIZCA sunucu (Prisma). Login brute-force kilidi + form/lokasyon spam koruması.
export * from "./rate-limit";

// Güvenilir istemci IP çıkarımı (Vercel başlığı tercihli) — docs/13 §D1.
export * from "./client-ip";

// MongoDB ObjectId doğrulama (Prisma "Malformed ObjectID" önleme) — docs/13 §O1.
export * from "./object-id";

// PII-güvenli sunucu hata logu (ham err yerine kısa özet) — docs/13 §D3.
export * from "./log-error";
