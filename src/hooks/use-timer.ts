"use client";

import { useEffect, useRef } from "react";
import { useShallow } from "zustand/react/shallow";
import { remainingOf, useTimer } from "@/stores/timer-store";
import { useData } from "@/stores/data-store";
import { useCompanion } from "@/stores/companion-store";
import { useNow } from "@/hooks/use-now";
import { playChime } from "@/lib/audio/chime";
import { formatClock } from "@/lib/dates";

/** Read-only view of the timer for display components. */
export function useTimerView() {
  const s = useTimer(
    useShallow((t) => ({
      mode: t.mode,
      status: t.status,
      endsAt: t.endsAt,
      remainingMs: t.remainingMs,
      durationMs: t.durationMs,
      taskId: t.taskId,
      cycleCount: t.cycleCount,
      durations: t.durations,
    })),
  );
  const now = useNow(250, s.status === "running");
  const remaining = remainingOf(s, now);
  const progress = s.durationMs ? 1 - remaining / s.durationMs : 0;
  return { ...s, remaining, progress, label: formatClock(remaining / 1000) };
}

const MODE_TITLE = { FOCUS: "Focus", SHORT_BREAK: "Short break", LONG_BREAK: "Long break" } as const;

/**
 * The single timer "engine". Mount exactly once (in the app shell).
 * - Detects session end from timestamps (accurate across tab switches / refreshes)
 * - Syncs durations from user settings
 * - Drives companion mood, tab title, sound and notifications
 */
export function useTimerEngine() {
  const settings = useData((s) => s.settings);
  const status = useTimer((s) => s.status);
  const mode = useTimer((s) => s.mode);
  const lastCompletion = useTimer((s) => s.lastCompletion);
  const originalTitle = useRef<string | null>(null);

  // Sync durations from settings.
  useEffect(() => {
    if (!settings) return;
    useTimer.getState().configure({
      focus: settings.focusDuration,
      short: settings.shortBreakDuration,
      long: settings.longBreakDuration,
      every: settings.sessionsBeforeLongBreak,
    });
  }, [settings]);

  // Completion detection — one interval, cleaned up on unmount.
  useEffect(() => {
    const check = () => {
      // Wait for the workspace to load so the recorded session lands in fresh state.
      if (useData.getState().status !== "ready") return;
      const t = useTimer.getState();
      if (t.status === "running" && t.endsAt && Date.now() >= t.endsAt) t.complete();
    };
    check();
    const id = window.setInterval(check, 500);
    document.addEventListener("visibilitychange", check);
    return () => {
      window.clearInterval(id);
      document.removeEventListener("visibilitychange", check);
    };
  }, []);

  // Companion baseline mood.
  useEffect(() => {
    const setBase = useCompanion.getState().setBase;
    if (status === "running") setBase(mode === "FOCUS" ? "focus" : "break");
    else setBase("idle");
    if (status === "running" && mode === "FOCUS") useCompanion.getState().say("Let's focus together.");
    if (status === "running" && mode !== "FOCUS") useCompanion.getState().say("Time for a little break.");
  }, [status, mode]);

  // Tab title countdown.
  useEffect(() => {
    if (originalTitle.current === null) originalTitle.current = document.title;
    if (status === "idle") {
      document.title = originalTitle.current ?? "Lunova";
      return;
    }
    const tick = () => {
      const t = useTimer.getState();
      document.title = `${formatClock(remainingOf(t) / 1000)} · ${MODE_TITLE[t.mode]}${t.status === "paused" ? " (paused)" : ""}`;
    };
    tick();
    const id = window.setInterval(tick, 1000);
    return () => window.clearInterval(id);
  }, [status, mode]);

  // Side effects when a session completes.
  useEffect(() => {
    if (!lastCompletion || Date.now() - lastCompletion.at > 5000) return;
    const s = useData.getState().settings;
    if (s?.completionSound !== false) playChime((s?.musicVolume ?? 60) / 100);
    const focusDone = lastCompletion.mode === "FOCUS";
    useCompanion.getState().react(
      focusDone ? "celebrate" : "idle",
      focusDone ? "Beautiful work! You completed a focus session." : "Break's over — ready when you are.",
      4000,
    );
    if (s?.notificationsEnabled && "Notification" in window && Notification.permission === "granted" && document.hidden) {
      new Notification(focusDone ? "Focus session complete 🌙" : "Break finished", {
        body: focusDone ? "Beautiful work! Time for a little break." : "Ready for another focus session?",
        silent: true,
      });
    }
    const t = useTimer.getState();
    const auto = focusDone ? s?.autoStartBreaks : s?.autoStartFocus;
    if (auto) {
      t.start();
      t.dismissCompletion();
    }
  }, [lastCompletion]);
}
