import type { Metadata } from "next";
import { SettingsPage } from "@/components/settings/settings-page";

// Client-rendered workspace (data loads after hydration), so skip instant-navigation validation.
export const instant = false;

export const metadata: Metadata = { title: "Settings" };

export default function Page() {
  return <SettingsPage />;
}
