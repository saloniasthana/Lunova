import type { ThemeId } from "@/types";

export const THEMES: { id: ThemeId; name: string; description: string; swatches: [string, string, string] }[] = [
  { id: "cloud", name: "Cloud Blue", description: "Soft blue and white", swatches: ["#FAF9F6", "#A8C7E8", "#DCCBF3"] },
  { id: "lavender", name: "Lavender Dreams", description: "Lavender and off-white", swatches: ["#FAF8FC", "#C9B3EC", "#F4D5DE"] },
  { id: "sakura", name: "Sakura", description: "Soft pink and white", swatches: ["#FDF8F8", "#F0B9C8", "#F8DCC8"] },
  { id: "mint", name: "Mint Garden", description: "Mint green and cream", swatches: ["#F8FAF6", "#B5DBC0", "#F4D6A0"] },
  { id: "peach", name: "Peach Sunset", description: "Peach and warm beige", swatches: ["#FDF9F5", "#F6C5A5", "#F4D5DE"] },
  { id: "cream", name: "Cream Cozy", description: "Warm cream and brown", swatches: ["#FBF7F0", "#D9BF9B", "#D7E8D5"] },
  { id: "night", name: "Night Sky", description: "Navy and muted lavender", swatches: ["#1D2033", "#9FA8E0", "#5D5383"] },
];

export const ACCENT_PRESETS = ["#5F8FC4", "#8A68C4", "#C96F8A", "#5D9C70", "#CC7D4C", "#9C7447", "#4C9A9A"];

export const FONTS = [
  { id: "nunito", name: "Nunito", note: "Rounded & friendly" },
  { id: "jakarta", name: "Plus Jakarta Sans", note: "Modern & crisp" },
  { id: "dmsans", name: "DM Sans", note: "Clean & geometric" },
  { id: "inter", name: "Inter", note: "Neutral & readable" },
] as const;
