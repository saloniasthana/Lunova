"use client";

import { create } from "zustand";

export type CompanionMood = "idle" | "focus" | "break" | "celebrate" | "sleep";

interface CompanionState {
  /** Persistent baseline mood (driven by the timer). */
  base: CompanionMood;
  /** Short-lived reaction that overrides the base mood. */
  reaction: { mood: CompanionMood; until: number } | null;
  message: string | null;
  messageUntil: number;
  setBase: (m: CompanionMood) => void;
  react: (m: CompanionMood, message?: string, ms?: number) => void;
  say: (message: string, ms?: number) => void;
}

export const useCompanion = create<CompanionState>()((set) => ({
  base: "idle",
  reaction: null,
  message: null,
  messageUntil: 0,
  setBase: (base) => set({ base }),
  react: (mood, message, ms = 2800) =>
    set({
      reaction: { mood, until: Date.now() + ms },
      ...(message ? { message, messageUntil: Date.now() + ms + 600 } : {}),
    }),
  say: (message, ms = 3500) => set({ message, messageUntil: Date.now() + ms }),
}));
