import type { Metadata } from "next";
import { WorkspacePage } from "@/components/workspace/workspace-page";

// Client-rendered workspace (data loads after hydration), so skip instant-navigation validation.
export const instant = false;

export const metadata: Metadata = { title: "Customize" };

export default function Page() {
  return <WorkspacePage />;
}
