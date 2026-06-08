# apps/admin — Yönetim Paneli (admin.dogukanozgan.com)

Doğukan'ın gelen teklif taleplerini görüp yönettiği **korumalı, ayrı domainde** çalışan
yönetim uygulaması. Tamamı `noindex` + `robots: disallow`. Kaynak: `docs/05`, `docs/01`.

## Özellikler (Aşama 3)

- **Giriş** (`/login`) — Auth.js (NextAuth v5) Credentials; e-posta + şifre (bcrypt hash).
- **Koruma** — `src/middleware.ts` ile `/login` ve `/api/auth/*` hariç TÜM rotalar
  oturum ister. Edge-güvenli `auth.config.ts` (prisma/bcrypt yok) middleware'i besler.
- **Teklif listesi** (`/teklifler`) — özet kartları + ürün/durum/tarih filtresi + arama.
- **Teklif detayı** (`/teklifler/[id]`) — `payload` etiketli gösterim, imzalı URL ile
  fotoğraflar, hızlı aksiyonlar (ara/WhatsApp/e-posta), KVKK rıza kanıtı (salt-okunur).
- **CRM** — durum değiştirme (docs/05 akışı) + zaman damgalı notlar.
- **KVKK** — anonimleştirme / kalıcı silme (onay diyaloglu; `@do/db` kvkk util'leri).

## Ortam değişkenleri

`apps/admin/.env.example` dosyasını `.env.local` olarak kopyalayın. En kritikleri:

- `DATABASE_URL` — `apps/web` ile AYNI MongoDB Atlas (Prisma `mongodb` provider).
- `BLOB_READ_WRITE_TOKEN` — `apps/web` ile AYNI Vercel Blob store. Dosyalar auth-gated
  proxy (`/dosya/<assetId>`) ile sunucuda stream edilir; ham URL HTML'e gömülmez (docs/13 §Y1).
- `AUTH_SECRET` — oturum çerezi şifreleme + poliçe indirme linki imzalama (web ile AYNI
  değer; docs/13 §Y1). Üret: `openssl rand -base64 32`.

## İlk admin kullanıcıyı oluşturma (Aşama 6 — gerçek DB bağlanınca)

Şifre `User.passwordHash` (bcrypt) alanında tutulur. Migration sonrası:

```bash
# 1) Şema + tabloları oluştur (gerçek DATABASE_URL gerekli)
pnpm --filter @do/db prisma migrate dev --name init

# 2) İlk admin kullanıcıyı oluştur (idempotent — varsa şifre günceller)
ADMIN_EMAIL="dogukan@dogukanozgan.com" \
ADMIN_PASSWORD="güçlü-bir-şifre" \
ADMIN_NAME="Doğukan Özgan" \
  pnpm --filter @do/db seed:admin
```

Script: `packages/db/prisma/seed-admin.ts`. Aynı komutla şifre sıfırlanabilir.

## Çalıştırma

```bash
pnpm --filter @do/admin dev      # http://localhost:3001
pnpm --filter @do/admin build
```
