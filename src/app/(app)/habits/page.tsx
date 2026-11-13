import type { Metadata } from "next";
import { HabitsPage } from "@/components/habits/habits-page";

// Client-rendered workspace (data loads after hydration), so skip instant-navigation validation.
export const instant = false;

export const metadata: Metadata = { title: "Habits" };

export default function Page() {
  return <HabitsPage />;
}
