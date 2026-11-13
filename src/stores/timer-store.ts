"use client";

import { create } from "zustand";
import { persist } from "zustand/middleware";
import type { SessionType } from "@/types";
import { useData } from "@/stores/data-store";

export type TimerStatus = "idle" | "running" | "paused";

export interface Durations {
  focus: number; // minutes
  short: number;
  long: number;
  every: number; // focus sessions before a long break
}

export interface Completion {
  mode: SessionType;
  at: number;
  taskId: string | null;
  next: SessionType;
}

interface TimerState {
  mode: SessionType;
  status: TimerStatus;
  /** Epoch ms when the running session will end. Source of truth while running. */
  endsAt: number | null;
  /** Remaining ms while idle / paused. */
  remainingMs: number;
  /** Planned length of the current session in ms (grows with "extend"). */
  durationMs: number;
  /** When the current session was first started (ISO). */
  sessionStartedAt: string | null;
  taskId: string | null;
  cycleCount: number;
  durations: Durations;
  lastCompletion: Completion | null;

  configure: (d: Durations) => void;
  setMode: (m: SessionType) => void;
  setTask: (id: string | null) => void;
  start: () => void;
  pause: () => void;
  reset: () => void;
  restart: () => void;
  skip: () => void;
  extend: (minutes: number) => void;
  complete: () => void;
  dismissCompletion: () => void;
  clear: () => void;
}

const MIN_PARTIAL_RECORD_MS = 60_000;

export function durationFor(mode: SessionType, d: Durations) {
  const min = mode === "FOCUS" ? d.focus : mode === "SHORT_BREAK" ? d.short : d.long;
  return min * 60_000;
}

export function remainingOf(s: Pick<TimerState, "status" | "endsAt" | "remainingMs">, now = Date.now()) {
  if (s.status === "running" && s.endsAt) return Math.max(0, s.endsAt - now);
  return s.remainingMs;
}

const DEFAULT_DURATIONS: Durations = { focus: 25, short: 5, long: 15, every: 4 };

export const useTimer = create<TimerState>()(
  persist(
    (set, get) => {
      /** Saves a session (complete or partial) to the server. */
      function record(completed: boolean, endedAtMs: number) {
        const s = get();
        if (!s.sessionStartedAt) return;
        const elapsed = s.durationMs - remainingOf(s, endedAtMs);
        if (!completed && (s.mode !== "FOCUS" || elapsed < MIN_PARTIAL_RECORD_MS)) return;
        void useData.getState().recordSession({
          taskId: s.mode === "FOCUS" ? s.taskId : null,
          sessionType: s.mode,
          plannedDuration: Math.round(s.durationMs / 1000),
          actualDuration: Math.round((completed ? s.durationMs : elapsed) / 1000),
          startedAt: s.sessionStartedAt,
          endedAt: new Date(endedAtMs).toISOString(),
          completed,
        });
      }

      function goIdle(mode: SessionType, extra: Partial<TimerState> = {}) {
        const ms = durationFor(mode, get().durations);
        set({ mode, status: "idle", endsAt: null, remainingMs: ms, durationMs: ms, sessionStartedAt: null, ...extra });
      }

      return {
        mode: "FOCUS",
        status: "idle",
        endsAt: null,
        remainingMs: DEFAULT_DURATIONS.focus * 60_000,
        durationMs: DEFAULT_DURATIONS.focus * 60_000,
        sessionStartedAt: null,
        taskId: null,
        cycleCount: 0,
        durations: DEFAULT_DURATIONS,
        lastCompletion: null,

        configure(d) {
          const s = get();
          const same = JSON.stringify(s.durations) === JSON.stringify(d);
          if (same) return;
          set({ durations: d });
          if (s.status === "idle") goIdle(s.mode);
        },

        setMode(mode) {
          const s = get();
          if (s.status !== "idle") record(false, Date.now());
          goIdle(mode);
        },

        setTask(taskId) {
          set({ taskId });
        },

        start() {
          const s = get();
          if (s.status === "running") return;
          const now = Date.now();
          set({
            status: "running",
            endsAt: now + s.remainingMs,
            sessionStartedAt: s.sessionStartedAt ?? new Date(now).toISOString(),
          });
        },

        pause() {
          const s = get();
          if (s.status !== "running" || !s.endsAt) return;
          set({ status: "paused", remainingMs: Math.max(0, s.endsAt - Date.now()), endsAt: null });
        },

        reset() {
          const s = get();
          if (s.status !== "idle") record(false, Date.now());
          goIdle(s.mode);
        },

        restart() {
          get().reset();
          get().start();
        },

        skip() {
          const s = get();
          if (s.status !== "idle") record(false, Date.now());
          const next: SessionType = s.mode === "FOCUS" ? "SHORT_BREAK" : "FOCUS";
          goIdle(next);
        },

        extend(minutes) {
          const s = get();
          const add = minutes * 60_000;
          if (s.status === "running" && s.endsAt) set({ endsAt: s.endsAt + add, durationMs: s.durationMs + add });
          else set({ remainingMs: s.remainingMs + add, durationMs: s.durationMs + add });
        },

        complete() {
          const s = get();
          if (s.status !== "running") return;
          const endedAt = s.endsAt ?? Date.now();
          record(true, endedAt);

          let cycleCount = s.cycleCount;
          let next: SessionType;
          if (s.mode === "FOCUS") {
            cycleCount += 1;
            next = cycleCount % s.durations.every === 0 ? "LONG_BREAK" : "SHORT_BREAK";
          } else {
            if (s.mode === "LONG_BREAK") cycleCount = 0;
            next = "FOCUS";
          }
          goIdle(next, { cycleCount, lastCompletion: { mode: s.mode, at: Date.now(), taskId: s.taskId, next } });
        },

        dismissCompletion() {
          set({ lastCompletion: null });
        },

        clear() {
          set({ taskId: null, cycleCount: 0, lastCompletion: null });
          goIdle("FOCUS");
        },
      };
    },
    {
      name: "lunova-timer",
      version: 1,
      partialize: (s) => ({
        mode: s.mode,
        status: s.status,
        endsAt: s.endsAt,
        remainingMs: s.remainingMs,
        durationMs: s.durationMs,
        sessionStartedAt: s.sessionStartedAt,
        taskId: s.taskId,
        cycleCount: s.cycleCount,
        durations: s.durations,
      }),
    },
  ),
);
