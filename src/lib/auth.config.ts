import type { NextAuthConfig } from "next-auth";

/**
 * Edge-safe Auth.js config (no database imports). Used by the route proxy
 * to protect pages, and extended in `auth.ts` with providers + adapter.
 */
export const PUBLIC_PATHS = ["/login", "/signup", "/"];

export const authConfig = {
  pages: { signIn: "/login" },
  session: { strategy: "jwt" },
  trustHost: true,
  providers: [],
  callbacks: {
    authorized({ auth, request }) {
      const { pathname } = request.nextUrl;
      const loggedIn = !!auth?.user;
      const isAuthPage = pathname === "/login" || pathname === "/signup";
      if (isAuthPage) {
        if (loggedIn) return Response.redirect(new URL("/dashboard", request.nextUrl));
        return true;
      }
      if (pathname === "/") return true;
      return loggedIn;
    },
    jwt({ token, user }) {
      if (user?.id) token.sub = user.id;
      return token;
    },
    session({ session, token }) {
      if (token.sub && session.user) session.user.id = token.sub;
      return session;
    },
  },
} satisfies NextAuthConfig;
