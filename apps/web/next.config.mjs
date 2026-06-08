import createNextIntlPlugin from "next-intl/plugin";
import path from "node:path";
import { fileURLToPath } from "node:url";
import { PrismaPlugin } from "@prisma/nextjs-monorepo-workaround-plugin";

const __dirname = path.dirname(fileURLToPath(import.meta.url));

// next-intl request config konumu (bkz. src/i18n/request.ts).
const withNextIntl = createNextIntlPlugin("./src/i18n/request.ts");

// Eski site (statik jQuery/Bootstrap) → yeni site KALICI (301) yönlendirmeleri.
// Kaynak: docs/08 Aşama 6 "Eski siteden taşıma / yönlendirmeler (301)".
// Eski URL'ler C:\...\Yazılımlar\dogukanozgan.com içindeki .html dosyalarından çıkarıldı.
// Hedef rotalar: yeni locale-prefixed yapı (varsayılan TR). Ürün slug'ları
// packages/products/definitions.ts ile birebir aynı: trafik, saglik,
// bireysel-emeklilik, hayat, konut.
//
// Not: next-intl middleware "/" -> "/tr" yönlendirmesini zaten yapıyor; burada
// eski .html yollarını YENİ TR rotalarına bağlıyoruz. `permanent: true` = 301.
const legacyRedirects = [
  // Ana sayfalar
  { source: "/index.html", destination: "/tr", permanent: true },
  { source: "/hakkimda.html", destination: "/tr/hakkimda", permanent: true },
  { source: "/iletisim.html", destination: "/tr/iletisim", permanent: true },
  { source: "/planlar.html", destination: "/tr/planlar", permanent: true },

  // Ürün (plan) sayfaları — eski /planlar/*.html → yeni /tr/planlar/<slug>
  {
    source: "/planlar/saglik-sigortasi.html",
    destination: "/tr/planlar/saglik",
    permanent: true,
  },
  {
    source: "/planlar/trafik.html",
    destination: "/tr/planlar/trafik",
    permanent: true,
  },
  {
    source: "/planlar/konut.html",
    destination: "/tr/planlar/konut",
    permanent: true,
  },
  {
    source: "/planlar/bireysel-emeklilik.html",
    destination: "/tr/planlar/bireysel-emeklilik",
    permanent: true,
  },

  // TODO(doc): Eski sitede AYRI sayfası OLMAYAN ama yeni sitede bulunan ürün:
  //   hayat → /tr/planlar/hayat (eski karşılığı yok; varsayım). Eski sitede
  //   "hayat.html" YOKTU; gerek olursa Doğukan eski analytics'ten ekleyebilir.
  // TODO(doc): Eski URL'lerin trailing-slash'lı varyantları (örn. /planlar/) veya
  //   www/non-www farkları gerekirse Vercel domain ayarlarından yönetilecek.
];

// Güvenlik HTTP başlıkları (docs/13 K1). Fetch direktiflerini (script/style/img-src)
// ZORLAMAYIZ — inline JSON-LD, Next inline style ve analitik kırılmasın diye. Burada
// yalnızca kırılma riski OLMAYAN, yüksek değerli başlıklar var: clickjacking (frame-ancestors
// + X-Frame-Options), MIME-sniff (nosniff), HSTS, referrer, permissions, base-uri/object-src.
// TODO(doc): Tam nonce tabanlı script-src CSP ileride eklenecek (docs/13 K1 takip).
const securityHeaders = [
  { key: "X-Frame-Options", value: "SAMEORIGIN" },
  { key: "X-Content-Type-Options", value: "nosniff" },
  { key: "Referrer-Policy", value: "strict-origin-when-cross-origin" },
  {
    key: "Strict-Transport-Security",
    value: "max-age=63072000; includeSubDomains",
  },
  {
    key: "Permissions-Policy",
    value: "camera=(), microphone=(), geolocation=(), browsing-topics=()",
  },
  {
    key: "Content-Security-Policy",
    value: "base-uri 'self'; object-src 'none'; frame-ancestors 'self'; upgrade-insecure-requests",
  },
];

/** @type {import('next').NextConfig} */
const nextConfig = {
  reactStrictMode: true,
  // Monorepo paketleri (workspace) Next derlemesine dahil edilir.
  transpilePackages: ["@do/ui", "@do/products", "@do/db", "@do/email"],
  // pnpm monorepo'da Prisma query engine'i serverless fonksiyona kopyalanabilsin diye
  // dosya-izleme kökü monorepo köküne; @prisma/client harici (node_modules'tan yüklenir).
  outputFileTracingRoot: path.join(__dirname, "../../"),
  webpack: (config, { isServer }) => {
    // pnpm monorepo'da Prisma query engine'ini server bundle'ına kopyalar (resmi çözüm).
    if (isServer) {
      config.plugins = [...config.plugins, new PrismaPlugin()];
    }
    return config;
  },
  async redirects() {
    return legacyRedirects;
  },
  async headers() {
    return [{ source: "/:path*", headers: securityHeaders }];
  },
};

export default withNextIntl(nextConfig);
