import type { Metadata } from "next";
import { FocusStudio } from "@/components/focus/focus-studio";

// Client-rendered workspace (data loads after hydration), so skip instant-navigation validation.
export const instant = false;

export const metadata: Metadata = { title: "Focus Studio" };

export default function Page() {
  return <FocusStudio />;
}
