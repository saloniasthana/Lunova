import { Suspense } from "react";
import { redirect } from "next/navigation";
import { auth } from "@/lib/auth";
import { AppShell, LoadingScreen } from "@/components/layout/app-shell";

// Client-rendered workspace (data loads after hydration), so skip instant-navigation validation.
export const instant = false;

/** Reads the session at request time, behind a Suspense boundary (Cache Components). */
async function AuthGate({ children }: { children: React.ReactNode }) {
  const session = await auth();
  if (!session?.user) redirect("/login");
  return <AppShell>{children}</AppShell>;
}

export default function AppLayout({ children }: { children: React.ReactNode }) {
  return (
    <Suspense fallback={<LoadingScreen />}>
      <AuthGate>{children}</AuthGate>
    </Suspense>
  );
}
