import type { Metadata } from "next";
import { ProgressPage } from "@/components/progress/progress-page";

// Client-rendered workspace (data loads after hydration), so skip instant-navigation validation.
export const instant = false;

export const metadata: Metadata = { title: "My Progress" };

export default function Page() {
  return <ProgressPage />;
}
