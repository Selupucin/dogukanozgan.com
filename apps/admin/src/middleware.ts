// Admin middleware — TÜM rotaları korur (docs/05: ayrı domain, hepsi korumalı).
// Edge-güvenli auth.config'ten türetilen `auth` ile çalışır (prisma/bcrypt YOK).
// `authorized` callback'i (auth.config.ts) login/api hariç oturum ister.

import NextAuth from "next-auth";
import { authConfig } from "./auth.config";

export const { auth: middleware } = NextAuth(authConfig);

export const config = {
  // Statik dosyalar, Next dahili yolları ve metadata (robots vb.) hariç her şeyi eşle.
  // /api/auth ve /login authorized() içinde serbest bırakılır.
  matcher: ["/((?!_next/static|_next/image|favicon.ico|robots.txt).*)"],
};
