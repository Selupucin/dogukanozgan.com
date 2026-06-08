// @do/db — Dosya erişim imzası (HMAC). Kaynak: docs/13 §Y1, docs/06 §5b, docs/04 (Asset).
//
// NEDEN (docs/13 §Y1): Yüklenen hassas dosyalar (trafik/kasko ruhsat-araç fotoğrafı +
// poliçe belgesi) Vercel Blob'da `access:"public"` ile saklanır — Vercel Blob yalnız bu
// modu destekler (private read GA değil). Bu nedenle BLOB'U PRIVATE YAPAMAYIZ. Bunun
// yerine HAM blob URL'ini (Asset.url) İSTEMCİYE HİÇ İFŞA ETMEYİZ; erişimi sunucu-tarafı
// kontrollü rotalarla veririz:
//   - Müşteri (poliçe belgesi): kısa ömürlü İMZALI, SÜRELİ token → /police-indir?token=...
//   - Admin (her dosya): auth-gated proxy → /dosya/<assetId>
// Her iki rotada da blob içeriği SUNUCUDA fetch edilip stream edilir; ham blob URL asla
// yanıta/HTML'e/redirect'e sızmaz.
//
// Bu modül YALNIZCA müşteri poliçe linki için imzalı token üretir/doğrular.
//
// ⚠️ GÜVENLİK: HMAC gizli anahtarı YALNIZCA sunucuda. Bu modül istemci bileşenine import
// EDİLMEMELİDİR. Sabit-zamanlı imza karşılaştırması (timing attack'a karşı).

import { createHmac, timingSafeEqual } from "node:crypto";

/**
 * İmza gizli anahtarı. Yeni env `BLOB_SIGNING_SECRET` ZORUNLU DEĞİLDİR; yoksa mevcut
 * `AUTH_SECRET`'e düşülür (her iki uygulamada da var). İkisi de yoksa hata fırlatılır —
 * imzasız token üretmek/doğrulamak güvenlik açığıdır (fail-fast).
 */
function getSecret(): string {
  const secret = process.env.BLOB_SIGNING_SECRET ?? process.env.AUTH_SECRET;
  if (!secret) {
    throw new Error(
      "file-access: BLOB_SIGNING_SECRET veya AUTH_SECRET tanımlı değil — " +
        "imzalı dosya linki üretilemez (docs/13 §Y1).",
    );
  }
  return secret;
}

/** base64 → base64url (URL-safe; +/= karakterleri yok). */
function toBase64Url(buf: Buffer): string {
  return buf.toString("base64").replace(/\+/g, "-").replace(/\//g, "_").replace(/=+$/, "");
}

/** base64url → Buffer. */
function fromBase64Url(s: string): Buffer {
  const b64 = s.replace(/-/g, "+").replace(/_/g, "/");
  return Buffer.from(b64, "base64");
}

/** İmzalanacak yük (payload): assetId + son kullanma (epoch ms). */
function payloadString(assetId: string, expMs: number): string {
  return `${assetId}.${expMs}`;
}

function sign(data: string): string {
  return toBase64Url(createHmac("sha256", getSecret()).update(data).digest());
}

export interface SignFileTokenInput {
  /** Erişilecek Asset id'si (MongoDB ObjectId). */
  assetId: string;
  /** Son kullanma zamanı (Date veya epoch ms). */
  expiresAt: Date | number;
}

/**
 * Bir Asset'e süreli erişim için URL-safe (base64url) imzalı token üretir.
 * Format: base64url(assetId.exp) + "." + base64url(HMAC-SHA256(assetId.exp)).
 * Token müşteriye verilebilir (poliçe indirme linki); ham blob URL'i ifşa etmez.
 */
export function signFileToken({ assetId, expiresAt }: SignFileTokenInput): string {
  const expMs = expiresAt instanceof Date ? expiresAt.getTime() : expiresAt;
  const data = payloadString(assetId, expMs);
  const encoded = toBase64Url(Buffer.from(data, "utf8"));
  return `${encoded}.${sign(data)}`;
}

/**
 * Token'ı doğrular. Geçerli ve SÜRESİ DOLMAMIŞSA `{ assetId }` döner; aksi halde `null`
 * (geçersiz biçim / imza uyuşmazlığı / süre dolmuş). İmza karşılaştırması SABİT-ZAMANLI.
 */
export function verifyFileToken(token: string | null | undefined): { assetId: string } | null {
  if (!token || typeof token !== "string") return null;

  const dot = token.lastIndexOf(".");
  if (dot <= 0) return null;

  const encoded = token.slice(0, dot);
  const providedSig = token.slice(dot + 1);
  if (!encoded || !providedSig) return null;

  let data: string;
  try {
    data = fromBase64Url(encoded).toString("utf8");
  } catch {
    return null;
  }

  // İmzayı sabit-zamanlı karşılaştır.
  let expectedSig: string;
  try {
    expectedSig = sign(data);
  } catch {
    // Gizli anahtar yoksa doğrulama yapılamaz → reddet (fail-closed).
    return null;
  }
  const a = Buffer.from(providedSig);
  const b = Buffer.from(expectedSig);
  if (a.length !== b.length || !timingSafeEqual(a, b)) return null;

  // Yük: "assetId.expMs"
  const sep = data.lastIndexOf(".");
  if (sep <= 0) return null;
  const assetId = data.slice(0, sep);
  const expMs = Number(data.slice(sep + 1));
  if (!assetId || !Number.isFinite(expMs)) return null;

  // Süre kontrolü.
  if (Date.now() > expMs) return null;

  return { assetId };
}
