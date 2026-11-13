import type { Metadata } from "next";
import { Dashboard } from "@/components/dashboard/dashboard";

// Client-rendered workspace (data loads after hydration), so skip instant-navigation validation.
export const instant = false;

export const metadata: Metadata = { title: "Home" };

export default function DashboardPage() {
  return <Dashboard />;
}
