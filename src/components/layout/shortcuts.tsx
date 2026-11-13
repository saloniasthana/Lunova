"use client";

import * as React from "react";
import { useRouter } from "next/navigation";
import { Dialog, DialogContent } from "@/components/ui/dialog";
import { useUi } from "@/stores/ui-store";
import { useTimer } from "@/stores/timer-store";
import { useAudio } from "@/stores/audio-store";

export const SHORTCUTS: [string, string][] = [
  ["N", "New task"],
  ["Space", "Start / pause the timer (Focus Studio)"],
  ["M", "Play / pause music"],
  ["G then H", "Go to Home"],
  ["G then T", "Go to Tasks"],
  ["G then F", "Go to Focus Studio"],
  ["G then P", "Go to Planner"],
  ["G then C", "Go to Calendar"],
  ["?", "Show keyboard shortcuts"],
];

function isTyping(e: KeyboardEvent) {
  const el = e.target as HTMLElement | null;
  if (!el) return false;
  return el.isContentEditable || ["INPUT", "TEXTAREA", "SELECT"].includes(el.tagName) || !!el.closest("[role=dialog]");
}

export function useKeyboardShortcuts() {
  const router = useRouter();
  React.useEffect(() => {
    let gPressed = 0;
    const onKey = (e: KeyboardEvent) => {
      if (e.metaKey || e.ctrlKey || e.altKey || isTyping(e)) return;
      const k = e.key.toLowerCase();
      if (gPressed && Date.now() - gPressed < 1200) {
        const routes: Record<string, string> = { h: "/dashboard", t: "/tasks", f: "/focus", p: "/planner", c: "/calendar" };
        gPressed = 0;
        if (routes[k]) {
          e.preventDefault();
          router.push(routes[k]);
        }
        return;
      }
      if (k === "g") gPressed = Date.now();
      else if (k === "n") {
        e.preventDefault();
        useUi.getState().openNewTask();
      } else if (k === "?") useUi.getState().setShortcutsOpen(true);
      else if (k === "m") useAudio.getState().toggle();
      else if (k === " " && window.location.pathname.startsWith("/focus")) {
        e.preventDefault();
        const t = useTimer.getState();
        if (t.status === "running") t.pause();
        else t.start();
      }
    };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [router]);
}

export function ShortcutsDialog() {
  const open = useUi((s) => s.shortcutsOpen);
  const setOpen = useUi((s) => s.setShortcutsOpen);
  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogContent title="Keyboard shortcuts" description="Move through Lunova without reaching for the mouse." className="sm:max-w-md">
        <ul className="divide-y divide-line">
          {SHORTCUTS.map(([keys, label]) => (
            <li key={keys} className="flex items-center justify-between py-2.5 text-sm">
              <span className="text-ink">{label}</span>
              <span className="flex gap-1">
                {keys.split(" then ").map((k) => (
                  <kbd key={k} className="rounded-lg border border-line bg-bg-2 px-2 py-0.5 font-sans text-xs font-semibold text-muted">
                    {k}
                  </kbd>
                ))}
              </span>
            </li>
          ))}
        </ul>
      </DialogContent>
    </Dialog>
  );
}
