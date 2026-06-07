// GEÇİCİ TEŞHİS UÇ NOKTASI — admin login sorununu kök nedenine indirgemek için.
// Sorun çözülünce SİLİNECEK. ?k=do-debug-2026 ile korunur.
// GÜVENLİK: şifre/secret/bağlantı dizesi DÖNDÜRMEZ; yalnız db adı + sayım + var/yok.
import { NextResponse } from "next/server";
import { prisma } from "@do/db";

export const dynamic = "force-dynamic";

export async function GET(req: Request) {
  const url = new URL(req.url);
  if (url.searchParams.get("k") !== "do-debug-2026") {
    return NextResponse.json({ error: "forbidden" }, { status: 403 });
  }

  // DATABASE_URL'den YALNIZCA db adını türet (kullanıcı/şifre/host döndürülmez).
  const raw = process.env.DATABASE_URL ?? "";
  const dbName = raw.split("/").pop()?.split("?")[0] ?? "(yok)";
  const hasDbName = /mongodb(\+srv)?:\/\/[^/]+\/[^/?]+/.test(raw);

  try {
    const userCount = await prisma.user.count();
    const admin = await prisma.user.findUnique({
      where: { email: "admin@dogukanozgan.com" },
      select: { id: true, role: true },
    });
    return NextResponse.json({
      ok: true,
      dbName,
      hasDbName,
      userCount,
      adminExists: Boolean(admin),
      authSecretSet: Boolean(process.env.AUTH_SECRET ?? process.env.NEXTAUTH_SECRET),
    });
  } catch (e) {
    return NextResponse.json(
      { ok: false, dbName, hasDbName, error: (e as Error).message },
      { status: 500 },
    );
  }
}
