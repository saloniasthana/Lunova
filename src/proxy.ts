import NextAuth from "next-auth";
import { authConfig } from "@/lib/auth.config";

// Edge-safe instance (no DB) — only reads the JWT cookie to protect pages.
// API routes perform their own auth + ownership checks.
const { auth } = NextAuth(authConfig);

export default auth;

export const config = {
  matcher: ["/((?!api|_next/static|_next/image|favicon.ico|manifest.webmanifest|robots.txt|.*\\.(?:png|jpg|jpeg|svg|webp|gif|mp3|ogg|wav|ico)$).*)"],
};
