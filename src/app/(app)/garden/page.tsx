import type { Metadata } from "next";
import { GardenPage } from "@/components/garden/garden-page";

// Client-rendered workspace (data loads after hydration), so skip instant-navigation validation.
export const instant = false;

export const metadata: Metadata = { title: "Focus Garden" };

export default function Page() {
  return <GardenPage />;
}
