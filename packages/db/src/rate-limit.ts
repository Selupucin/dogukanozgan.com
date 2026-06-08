// @do/db — Dağıtık (kalıcı) rate-limit. Kaynak: docs/13 §Y2.
//
// NEDEN: Eski in-memory limiter (apps/web/src/lib/rate-limit.ts) tek process belleğinde
// sayıyordu; Vercel serverless'te her instance ayrı saydığı için GERÇEK dağıtık koruma
// sağlamıyordu (docs/13 Y2/D2). Bu limiter sayacı MongoDB `RateLimit` modelinde tutar →
// tüm instance'lar aynı sayacı görür. EK SERVİS (Upstash/Redis) KURULMAZ (kullanıcı kararı).
//
// ⚠️ YALNIZCA SUNUCU tarafı (Prisma/DB). İstemciye import edilmez.
//
// ATOMİKLİK: MongoDB transaction GEREKTİRMEZ (seed-admin gibi transaction'sız). Yarış
// durumu makul tolere edilir:
//   - Pencere İÇİNDE artış: `updateMany` + koşullu filtre (key + expiresAt>now) +
//     `{ count: { increment: 1 } }` → MongoDB tek-belge update'i atomiktir.
//   - Yeni/dolmuş pencere: `upsert` ile pencereyi sıfırla (windowStart/expiresAt/count=1).
//   `key @unique` benzersizliği garanti eder; ender yarışta birkaç istek fazladan
//   geçebilir ama sayaç asla "kaybolmaz" → spam caydırıcılığı korunur.

import { prisma } from "./index";

export interface CheckRateLimitOptions {
  /** Sayaç anahtarı: "kapsam:ip[:kimlik]" (örn. "login:1.2.3.4:a@b.com"). */
  key: string;
  /** Pencere başına izin verilen istek sayısı. */
  limit: number;
  /** Pencere süresi (ms). */
  windowMs: number;
}

export interface RateLimitResult {
  /** İstek izinli mi (sayaç limiti aşmadıysa true). */
  allowed: boolean;
  /** Pencerede kalan izin (>=0). */
  remaining: number;
  /** Sınır aşıldıysa kaç ms sonra tekrar denenebilir. */
  retryAfterMs?: number;
}

/**
 * Verilen anahtar için bir istek "harcar" ve sınır durumunu döner (kalıcı/dağıtık).
 *
 * fail-safe: DB erişilemezse karar çağırana bırakılır — bu fonksiyon HATA FIRLATMAZ;
 * `allowed: true` döner ve loglar. Böylece DB kesintisinde meşru kullanıcı (özellikle
 * login) kilitlenmez (erişilebilirlik > sıkı limit; DB kesintisi nadirdir). Çağıran,
 * gerekirse bu davranışı sıkılaştırabilir.
 */
export async function checkRateLimit(opts: CheckRateLimitOptions): Promise<RateLimitResult> {
  const { key, limit, windowMs } = opts;
  const now = Date.now();
  const nowDate = new Date(now);

  try {
    // 1) Mevcut (geçerli) pencere içinde atomik artış dene.
    //    Filtre: aynı key + henüz dolmamış (expiresAt > now) + limit dolmamış.
    //    updateMany tek belgeye dokunur (key @unique); MongoDB $inc atomiktir.
    const incremented = await prisma.rateLimit.updateMany({
      where: { key, expiresAt: { gt: nowDate }, count: { lt: limit } },
      data: { count: { increment: 1 } },
    });

    if (incremented.count > 0) {
      // Artış başarılı → güncel sayacı oku (kalan/retry hesaplamak için).
      const row = await prisma.rateLimit.findUnique({ where: { key } });
      const used = row?.count ?? 1;
      return { allowed: true, remaining: Math.max(0, limit - used) };
    }

    // 2) Artış olmadı → ya kayıt yok / pencere dolmuş, ya da limit dolmuş.
    const existing = await prisma.rateLimit.findUnique({ where: { key } });

    if (existing && existing.expiresAt.getTime() > now) {
      // Pencere geçerli ama limit dolu → reddet.
      return {
        allowed: false,
        remaining: 0,
        retryAfterMs: existing.expiresAt.getTime() - now,
      };
    }

    // 3) Kayıt yok ya da pencere dolmuş → pencereyi (yeniden) başlat.
    //    upsert: yoksa oluştur, varsa (dolmuş) sıfırla. count=1 (bu istek).
    const expiresAt = new Date(now + windowMs);
    await prisma.rateLimit.upsert({
      where: { key },
      create: { key, count: 1, windowStart: nowDate, expiresAt },
      update: { count: 1, windowStart: nowDate, expiresAt },
    });

    return { allowed: true, remaining: Math.max(0, limit - 1) };
  } catch (err) {
    // fail-safe: DB hatası meşru kullanıcıyı kilitlemesin (özellikle login). Logla + izin ver.
    console.error("[rate-limit] DB error, allowing request (fail-safe):", err);
    return { allowed: true, remaining: limit };
  }
}

/**
 * Bir anahtarın sayacını sıfırlar (örn. başarılı login sonrası). Hata yutulur (yan etki).
 */
export async function resetRateLimit(key: string): Promise<void> {
  try {
    await prisma.rateLimit.deleteMany({ where: { key } });
  } catch (err) {
    console.error("[rate-limit] reset failed (ignored):", err);
  }
}
