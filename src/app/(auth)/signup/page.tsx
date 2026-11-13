import type { Metadata } from "next";
import { SignupForm } from "@/components/auth/auth-forms";
import { googleEnabled } from "@/lib/auth";

export const metadata: Metadata = { title: "Create account" };

export default function SignupPage() {
  return <SignupForm googleEnabled={googleEnabled} />;
}
