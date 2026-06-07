import createNextIntlPlugin from "next-intl/plugin";
import path from "node:path";
import { fileURLToPath } from "node:url";

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

/** @type {import('next').NextConfig} */
const nextConfig = {
  reactStrictMode: true,
  // Monorepo paketleri (workspace) Next derlemesine dahil edilir.
  transpilePackages: ["@do/ui", "@do/products", "@do/db"],
  // pnpm monorepo'da Prisma query engine'i serverless fonksiyona kopyalanabilsin diye
  // dosya-izleme kökü monorepo köküne; @prisma/client harici (node_modules'tan yüklenir).
  outputFileTracingRoot: path.join(__dirname, "../../"),
  serverExternalPackages: ["@prisma/client", ".prisma/client"],
  async redirects() {
    return legacyRedirects;
  },
};

export default withNextIntl(nextConfig);
