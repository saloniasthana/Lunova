import type { Metadata } from "next";
import { MusicPage } from "@/components/music/music-page";

// Client-rendered workspace (data loads after hydration), so skip instant-navigation validation.
export const instant = false;

export const metadata: Metadata = { title: "Music & Sounds" };

export default function Page() {
  return <MusicPage />;
}
