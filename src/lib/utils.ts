import { clsx, type ClassValue } from "clsx";
import { twMerge } from "tailwind-merge";

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}

export function uid() {
  return Math.random().toString(36).slice(2, 10) + Date.now().toString(36);
}

export function clamp(n: number, min: number, max: number) {
  return Math.min(max, Math.max(min, n));
}

export function pluralize(n: number, word: string, plural = `${word}s`) {
  return `${n} ${n === 1 ? word : plural}`;
}

/** Soft palette swatches used by categories, habits, events and time blocks. */
export const SWATCHES: Record<string, { bg: string; fg: string; dot: string; label: string }> = {
  blue: { bg: "#E6F0FA", fg: "#4A78A8", dot: "#A8C7E8", label: "Sky" },
  lavender: { bg: "#F0E9FA", fg: "#7A5BAF", dot: "#DCCBF3", label: "Lavender" },
  pink: { bg: "#FBEAF0", fg: "#B05A78", dot: "#F4D5DE", label: "Blossom" },
  green: { bg: "#E8F3E7", fg: "#4F8A5B", dot: "#B9DBB6", label: "Sage" },
  peach: { bg: "#FDEEE3", fg: "#B8703F", dot: "#F8D1B5", label: "Peach" },
  yellow: { bg: "#FBF3DC", fg: "#9C7A2A", dot: "#F4D6A0", label: "Honey" },
  gray: { bg: "#F1EFEC", fg: "#6F6C74", dot: "#D6D2CC", label: "Stone" },
};

export function swatch(key: string | null | undefined) {
  if (key && SWATCHES[key]) return SWATCHES[key];
  if (key?.startsWith("#")) return { bg: `${key}26`, fg: key, dot: key, label: key };
  return SWATCHES.gray;
}

export const PRIORITY_META = {
  LOW: { label: "Low", color: "green", rank: 0 },
  MEDIUM: { label: "Medium", color: "blue", rank: 1 },
  HIGH: { label: "High", color: "peach", rank: 2 },
  URGENT: { label: "Urgent", color: "pink", rank: 3 },
} as const;
