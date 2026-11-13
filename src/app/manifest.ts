import type { MetadataRoute } from "next";

export default function manifest(): MetadataRoute.Manifest {
  return {
    name: "Lunova — Your little universe of focus",
    short_name: "Lunova",
    description: "A cozy personal workspace for tasks, focus sessions, habits, and calm sounds.",
    start_url: "/dashboard",
    display: "standalone",
    background_color: "#FAF9F6",
    theme_color: "#C3BDF0",
    icons: [
      { src: "/icon-192.png", sizes: "192x192", type: "image/png" },
      { src: "/icon-512.png", sizes: "512x512", type: "image/png" },
      { src: "/icon-maskable-512.png", sizes: "512x512", type: "image/png", purpose: "maskable" },
    ],
  };
}
