import type { Metadata } from "next";
import { CalendarPage } from "@/components/calendar/calendar-page";

// Client-rendered workspace (data loads after hydration), so skip instant-navigation validation.
export const instant = false;

export const metadata: Metadata = { title: "Calendar" };

export default function Page() {
  return <CalendarPage />;
}
