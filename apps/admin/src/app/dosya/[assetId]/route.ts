// /dosya/[assetId] — Admin dosya görüntüleme proxy'si (auth-gated).
// Kaynak: docs/13 §Y1, docs/06 §5b/§6, docs/04 (Asset).
//
// NEDEN: Vercel Blob yalnız `access:"public"` desteklediğinden ham blob URL (Asset.url)
// imzasız/süresizdir. Bu URL admin HTML'ine GÖMÜLMEZ; admin teklif detay sayfası yüklenen
// foto/poliçeyi bu proxy üzerinden gösterir. İçerik SUNUCUDA çekilip stream edilir.
//
// GÜVENLİK:
//  - middleware tüm admin rotalarını korur; ek olarak burada `auth()` ZORUNLU (oturum
//    yoksa 401). Defense-in-depth.
//  - `assetId` ObjectId guard (merkezi isValidObjectId — docs/13 §O1).
//  - Ham blob URL yanıta/redirect'e sızdırılmaz (proxy/stream, inline gösterim).

import { NextResponse } from "next/server";
import { prisma, fetchBlobContent, isValidObjectId, logError } from "@do/db";
import { auth } from "@/auth";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

function plain(status: number, message: string): Response {
  return new NextResponse(message, {
    status,
    headers: { "Content-Type": "text/plain; charset=utf-8" },
  });
}

export async function GET(
  _request: Request,
  { params }: { params: Promise<{ assetId: string }> },
): Promise<Response> {
  // 1) Oturum ZORUNLU (middleware'e ek olarak — defense-in-depth).
  const session = await auth();
  if (!session?.user) {
    return plain(401, "Yetkisiz: oturum gerekli.");
  }

  // 2) ObjectId guard.
  const { assetId } = await params;
  if (!isValidObjectId(assetId)) {
    return plain(400, "Geçersiz dosya kimliği.");
  }

  // 3) Asset'i bul.
  const asset = await prisma.asset.findUnique({
    where: { id: assetId },
    select: { url: true, mimeType: true, kind: true },
  });
  if (!asset) return plain(404, "Dosya bulunamadı.");

  // 4) Blob içeriğini SUNUCUDA çek + inline stream et (ham URL sızmaz).
  let content: { body: ArrayBuffer; contentType: string };
  try {
    content = await fetchBlobContent(asset.url);
  } catch (err) {
    logError("[admin/dosya] blob fetch hatası:", err);
    return plain(502, "Dosya şu an görüntülenemiyor.");
  }

  const contentType = asset.mimeType || content.contentType || "application/octet-stream";
  return new NextResponse(content.body, {
    status: 200,
    headers: {
      "Content-Type": contentType,
      "Content-Disposition": "inline",
      "Cache-Control": "private, no-store",
      "X-Content-Type-Options": "nosniff",
    },
  });
}
