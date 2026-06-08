// /api/locations — Türkiye idari birim verisi (il / ilçe / mahalle) için sunucu API.
//
// Zincirleme adres alanları (docs/03) için kullanılır. İl ve ilçe verisi küçük olduğundan
// istemciye gömülüdür; bu route ASIL olarak MAHALLE verisini (~387 KB) talebe göre
// (ilçeye göre) döndürmek için vardır — böylece büyük veri istemci paketine GİRMEZ.
//
// Sorgu parametreleri:
//   ?type=provinces                      → 81 il
//   ?type=districts&provinceId=34        → o ilin ilçeleri
//   ?type=neighborhoods&districtId=1234  → o ilçenin mahalleleri (sunucu-yalnız veri)
//
// Yanıtlar uzun süreli cache'lenir (veri statiktir; idari değişiklikte dosya güncellenir).
//
// SERTLEŞTİRME (docs/13 §Y3):
//  - provinceId/districtId KATI doğrulanır (yalnız rakam, makul uzunluk); geçersiz → 400.
//  - Hafif rate-limit (IP başına 60/dk, dağıtık/DB — docs/13 §Y2); aşılırsa 429.
//  - Cache header'ları korunur (geçerli isteklerde).

import { NextResponse } from "next/server";
import { getProvinces, getDistricts } from "@do/products/locations";
import { getNeighborhoods } from "@do/products/locations/neighborhoods";
import { checkRateLimit, getClientIp } from "@do/db";

// DİNAMİK: bu route searchParams (districtId/provinceId) okur. force-static olursa bu
// parametreler çalışma anında BOŞ gelir → mahalle/ilçe dönmez (bug). Yanıtlar yine de
// CDN'de uzun süre cache'lenir (aşağıdaki Cache-Control header ile).
export const dynamic = "force-dynamic";

const CACHE_HEADERS = {
  "Cache-Control": "public, max-age=86400, s-maxage=604800, immutable",
};

// Hafif rate-limit: IP başına dakikada 60 istek (kötüye kullanım/DoS caydırıcı).
const RATE_LIMIT = { limit: 60, windowMs: 60 * 1000 };

// Katı kimlik formatı: yalnız rakam, 1–6 hane (TR il/ilçe kodları bu aralıkta).
const ID_PATTERN = /^[0-9]{1,6}$/;

export async function GET(request: Request) {
  const ip = getClientIp(request.headers);
  const rl = await checkRateLimit({ key: `loc:${ip}`, ...RATE_LIMIT });
  if (!rl.allowed) {
    return NextResponse.json(
      { error: "rate limited" },
      {
        status: 429,
        headers: rl.retryAfterMs
          ? { "Retry-After": String(Math.ceil(rl.retryAfterMs / 1000)) }
          : undefined,
      },
    );
  }

  const { searchParams } = new URL(request.url);
  const type = searchParams.get("type");

  if (type === "provinces") {
    return NextResponse.json(getProvinces(), { headers: CACHE_HEADERS });
  }

  if (type === "districts") {
    const provinceId = searchParams.get("provinceId");
    if (!provinceId || !ID_PATTERN.test(provinceId)) {
      return NextResponse.json({ error: "invalid provinceId" }, { status: 400 });
    }
    return NextResponse.json(getDistricts(provinceId), { headers: CACHE_HEADERS });
  }

  if (type === "neighborhoods") {
    const districtId = searchParams.get("districtId");
    if (!districtId || !ID_PATTERN.test(districtId)) {
      return NextResponse.json({ error: "invalid districtId" }, { status: 400 });
    }
    // Sadece ad listesi döner ({ name }[] biçimine sarılır → tutarlı option arayüzü).
    const names = getNeighborhoods(districtId).map((name) => ({ name }));
    return NextResponse.json(names, { headers: CACHE_HEADERS });
  }

  return NextResponse.json({ error: "invalid type" }, { status: 400 });
}
