import type { Metadata } from "next";
import { PlannerPage } from "@/components/planner/planner-page";

// Client-rendered workspace (data loads after hydration), so skip instant-navigation validation.
export const instant = false;

export const metadata: Metadata = { title: "Planner" };

export default function Page() {
  return <PlannerPage />;
}
