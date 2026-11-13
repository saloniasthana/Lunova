"use client";

import { create } from "zustand";
import { persist } from "zustand/middleware";

/** Non-sensitive, device-local layout preferences. */
export type DashboardWidget = "habits" | "stats" | "workspace" | "motivation";

interface PrefsState {
  cardStyle: "soft" | "flat" | "glass";
  sidebarStyle: "light" | "tinted";
  bgColor: string | null;
  widgets: Record<DashboardWidget, boolean>;
  set: (p: Partial<Omit<PrefsState, "set" | "toggleWidget" | "reset">>) => void;
  toggleWidget: (w: DashboardWidget) => void;
  reset: () => void;
}

const DEFAULTS = {
  cardStyle: "soft" as const,
  sidebarStyle: "light" as const,
  bgColor: null,
  widgets: { habits: true, stats: true, workspace: true, motivation: true },
};

export const usePrefs = create<PrefsState>()(
  persist(
    (set) => ({
      ...DEFAULTS,
      set: (p) => set(p),
      toggleWidget: (w) => set((s) => ({ widgets: { ...s.widgets, [w]: !s.widgets[w] } })),
      reset: () => set(DEFAULTS),
    }),
    { name: "lunova-prefs" },
  ),
);
