// İlk admin kullanıcı oluşturma / şifre güncelleme scripti.
// Kaynak: docs/05 "Başlangıçta tek admin (Doğukan)", docs/08 Aşama 6 (kurulum).
//
// KULLANIM (gerçek DB bağlandıktan sonra, packages/db içinde):
//   ADMIN_EMAIL="dogukan@..." ADMIN_PASSWORD="..." pnpm --filter @do/db seed:admin
//
// - ADMIN_EMAIL yoksa .env'deki ADMIN_EMAIL kullanılır.
// - ADMIN_PASSWORD zorunludur (en az 8 karakter).
// - Kullanıcı varsa şifresi günceller (idempotent), yoksa oluşturur.
//
// NOT: DB bağlantısı (DATABASE_URL) olmadan çalışmaz — Aşama 3'te kod yazıldı,
// çalıştırma gerçek MongoDB Atlas bağlanınca (Aşama 6) yapılacak.

import { prisma, hashPassword, logError } from "../src/index";

async function main() {
  const email = (process.env.ADMIN_EMAIL ?? "").trim().toLowerCase();
  const password = process.env.ADMIN_PASSWORD ?? "";
  const name = process.env.ADMIN_NAME ?? "Doğukan Özgan";

  if (!email) {
    throw new Error("ADMIN_EMAIL gerekli (env veya .env).");
  }
  if (password.length < 8) {
    throw new Error("ADMIN_PASSWORD gerekli ve en az 8 karakter olmalı.");
  }

  const passwordHash = await hashPassword(password);

  // NOT: `upsert` Prisma+MongoDB'de transaction kullanır → replica set ister.
  // findUnique + create/update (tek işlem) ile transaction'sız, idempotent ve
  // hem standalone yerel Mongo'da hem Atlas'ta çalışır.
  const existing = await prisma.user.findUnique({ where: { email } });
  const user = existing
    ? await prisma.user.update({ where: { email }, data: { passwordHash, name } })
    : await prisma.user.create({ data: { email, name, passwordHash, role: "ADMIN" } });

  console.log(`✔ Admin kullanıcı hazır: ${user.email} (id: ${user.id})`);
}

main()
  .catch((err) => {
    logError("✗ Seed başarısız:", err);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
