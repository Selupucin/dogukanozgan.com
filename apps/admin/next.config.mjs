import createNextIntlPlugin from "next-intl/plugin";
import path from "node:path";
import { fileURLToPath } from "node:url";

const __dirname = path.dirname(fileURLToPath(import.meta.url));

// Admin'de locale-prefixed rota YOK (bkz. docs/01 admin route yapısı). next-intl
// yalnızca UI string yönetimi için kullanılır; request config sabit locale döner.
const withNextIntl = createNextIntlPlugin("./src/i18n/request.ts");

/** @type {import('next').NextConfig} */
const nextConfig = {
  reactStrictMode: true,
  transpilePackages: ["@do/ui", "@do/products", "@do/db"],
  // pnpm monorepo'da Prisma query engine'i serverless fonksiyona kopyalanabilsin diye
  // dosya-izleme kökü monorepo köküne; @prisma/client harici (node_modules'tan yüklenir).
  outputFileTracingRoot: path.join(__dirname, "../../"),
  serverExternalPackages: ["@prisma/client", ".prisma/client"],
};

export default withNextIntl(nextConfig);
