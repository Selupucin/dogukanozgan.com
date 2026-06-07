// Auth.js — EDGE-GÜVENLİ temel yapılandırma (middleware bunu kullanır).
// Kaynak: docs/05 (tüm rotalar korumalı), Auth.js v5 "split config" deseni.
//
// ⚠️ Middleware Edge runtime'da çalışır → burada prisma/bcrypt gibi Node-only
// bağımlılık OLMAMALI. Credentials provider'ın `authorize` (DB erişimli) kısmı
// yalnızca src/auth.ts'tedir; burada providers BOŞ bırakılır. JWT oturumu
// olduğu için middleware token'ı DB'siz doğrulayabilir.

import type { NextAuthConfig } from "next-auth";

export const authConfig: NextAuthConfig = {
  session: { strategy: "jwt" },
  trustHost: true,
  // Secret açıkça bağlanır: Auth.js v5 normalde AUTH_SECRET'i otomatik okur; burada
  // hem AUTH_SECRET hem (v4 adı) NEXTAUTH_SECRET kabul edilerek isim karışıklığı önlenir.
  // Bu ayar hem middleware (auth.config) hem auth.ts (spread) tarafından kullanılır.
  secret: process.env.AUTH_SECRET ?? process.env.NEXTAUTH_SECRET,
  pages: {
    signIn: "/login",
  },
  // Edge'de provider'a gerek yok (token kontrolü yeterli). Tam liste auth.ts'te.
  providers: [],
  callbacks: {
    // Tüm admin rotalarını koru; oturum yoksa /login'e yönlendir (docs/05).
    // /login ve /api/auth/* serbest bırakılır (sonsuz döngü olmasın).
    authorized({ auth, request }) {
      const { pathname } = request.nextUrl;
      const isLoggedIn = Boolean(auth?.user);

      const isAuthRoute = pathname.startsWith("/api/auth");
      const isLoginPage = pathname === "/login";

      if (isAuthRoute) return true;

      if (isLoginPage) {
        // Giriş yapmış kullanıcı login'e gelirse listeye gönder.
        if (isLoggedIn) {
          return Response.redirect(new URL("/teklifler", request.nextUrl));
        }
        return true;
      }

      // Diğer tüm rotalar korumalı.
      return isLoggedIn;
    },
    async jwt({ token, user }) {
      if (user && "role" in user) {
        token.role = (user as { role?: string }).role ?? "ADMIN";
      }
      return token;
    },
    async session({ session, token }) {
      if (session.user) {
        session.user.role = (token.role as string) ?? "ADMIN";
        if (token.sub) session.user.id = token.sub;
      }
      return session;
    },
  },
};
