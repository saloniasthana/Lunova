import { Suspense } from "react";
import type { Metadata } from "next";
import { LoginForm } from "@/components/auth/auth-forms";
import { googleEnabled } from "@/lib/auth";

export const metadata: Metadata = { title: "Log in" };

export default function LoginPage() {
  return (
    <Suspense>
      <LoginForm googleEnabled={googleEnabled} />
    </Suspense>
  );
}
