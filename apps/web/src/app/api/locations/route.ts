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

import { NextResponse } from "next/server";
import { getProvinces, getDistricts } from "@do/products/locations";
import { getNeighborhoods } from "@do/products/locations/neighborhoods";

// Statik veri → tam statik/edge dostu; uzun cache.
export const dynamic = "force-static";
export const revalidate = false;

const CACHE_HEADERS = {
  "Cache-Control": "public, max-age=86400, s-maxage=604800, immutable",
};

export function GET(request: Request) {
  const { searchParams } = new URL(request.url);
  const type = searchParams.get("type");

  if (type === "provinces") {
    return NextResponse.json(getProvinces(), { headers: CACHE_HEADERS });
  }

  if (type === "districts") {
    const provinceId = searchParams.get("provinceId");
    if (!provinceId) {
      return NextResponse.json({ error: "provinceId is required" }, { status: 400 });
    }
    return NextResponse.json(getDistricts(provinceId), { headers: CACHE_HEADERS });
  }

  if (type === "neighborhoods") {
    const districtId = searchParams.get("districtId");
    if (!districtId) {
      return NextResponse.json({ error: "districtId is required" }, { status: 400 });
    }
    // Sadece ad listesi döner ({ name }[] biçimine sarılır → tutarlı option arayüzü).
    const names = getNeighborhoods(districtId).map((name) => ({ name }));
    return NextResponse.json(names, { headers: CACHE_HEADERS });
  }

  return NextResponse.json({ error: "invalid type" }, { status: 400 });
}
