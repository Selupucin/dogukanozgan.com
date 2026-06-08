// /police-indir — Müşteri poliçe belgesi indirme rotası (imzalı/süreli link).
// Kaynak: docs/13 §Y1, docs/06 §5b/§6, docs/04 (Asset), docs/12 §5 (poliçe maili).
//
// AKIŞ: Poliçe teslim e-postası, ham (public) blob URL yerine bu rotaya imzalı/süreli
// token taşıyan bir link gönderir (apps/admin uploadAndSendPolicyAction). Müşteri linke
// tıklar → token doğrulanır → blob içeriği SUNUCUDA çekilip STREAM edilir (attachment).
//
// GÜVENLİK:
//  - Token `verifyFileToken` ile doğrulanır (HMAC-SHA256, süre kontrollü, sabit-zamanlı).
//    Geçersiz → 403, süresi dolmuş da `null` döndüğünden → 403 (tek genel mesaj).
//  - YALNIZCA poliçe belgesi (Asset.kind="police") indirilebilir; ruhsat/araç fotoğrafı
//    (kişisel veri) bu müşteri rotasından ASLA erişilemez (404 gibi davranır).
//  - Ham blob URL (Asset.url) yanıta/redirect'e SIZDIRILMAZ; içerik proxy/stream edilir.

import { NextResponse } from "next/server";
import { prisma, verifyFileToken, fetchBlobContent } from "@do/db";
import { logError } from "@/lib/log-error";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

function deny(status: number, message: string): Response {
  return new NextResponse(message, {
    status,
    headers: { "Content-Type": "text/plain; charset=utf-8" },
  });
}

export async function GET(request: Request): Promise<Response> {
  const { searchParams } = new URL(request.url);
  const token = searchParams.get("token");

  // 1) Token doğrula (geçersiz/süresi dolmuş → 403, ham içerik sızdırmadan).
  const verified = verifyFileToken(token);
  if (!verified) {
    return deny(403, "Bağlantı geçersiz veya süresi dolmuş. Lütfen yeni bir link talep edin.");
  }

  // 2) ObjectId guard (token içeriği bozuksa erken çık).
  if (!/^[a-f0-9]{24}$/i.test(verified.assetId)) {
    return deny(403, "Bağlantı geçersiz.");
  }

  // 3) Asset'i bul — YALNIZCA poliçe belgesi (kind="police") indirilebilir.
  const asset = await prisma.asset.findUnique({
    where: { id: verified.assetId },
    select: { url: true, kind: true, mimeType: true },
  });
  if (!asset || asset.kind !== "police") {
    // Ruhsat/araç fotoğrafı veya bulunamadı → müşteriye verilmez.
    return deny(404, "Belge bulunamadı.");
  }

  // 4) Blob içeriğini SUNUCUDA çek ve stream et (ham URL yanıta sızmaz; redirect YOK).
  let content: { body: ArrayBuffer; contentType: string };
  try {
    content = await fetchBlobContent(asset.url);
  } catch (err) {
    // PII-güvenli log (docs/13 §D3): ham hata/URL loglanmaz.
    logError("[police-indir] blob fetch hatası:", err);
    return deny(502, "Belge şu an indirilemiyor. Lütfen daha sonra tekrar deneyin.");
  }

  const contentType = asset.mimeType || content.contentType || "application/octet-stream";
  return new NextResponse(content.body, {
    status: 200,
    headers: {
      "Content-Type": contentType,
      "Content-Disposition": 'attachment; filename="police"',
      "Cache-Control": "private, no-store",
      "X-Content-Type-Options": "nosniff",
    },
  });
}
