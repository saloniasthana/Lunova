"use client";

import * as React from "react";
import Link from "next/link";
import { AnimatePresence, motion } from "framer-motion";
import { create } from "zustand";
import { persist } from "zustand/middleware";
import { CheckCircle2, Expand, History, Minimize, Pause, Play, Plus, RotateCcw, Settings2, SkipForward, Sparkles, Volume2, VolumeX, XCircle } from "lucide-react";
import { useTimerView } from "@/hooks/use-timer";
import { useTimer } from "@/stores/timer-store";
import { useData } from "@/stores/data-store";
import { useAudio } from "@/stores/audio-store";
import { Companion } from "@/components/companion/companion";
import { WallpaperArt } from "@/components/workspace/wallpapers";
import { Button } from "@/components/ui/button";
import { Dialog, DialogContent } from "@/components/ui/dialog";
import { Field, Input } from "@/components/ui/input";
import { Switch } from "@/components/ui/misc";
import { EmptyState } from "@/components/ui/states";
import { MODE_META, TaskPicker } from "./focus-widget";
import type { SessionType } from "@/types";
import { formatDuration } from "@/lib/dates";
import { cn, clamp } from "@/lib/utils";
import type { AmbientKey } from "@/lib/audio/ambient";

export const ROOMS: { id: string; name: string; wallpaper: string; mix: Partial<Record<AmbientKey, number>>; dark: boolean; note: string }[] = [
  { id: "rainy-night", name: "Rainy Night", wallpaper: "rainy-window", mix: { rain: 0.7, thunder: 0.25 }, dark: true, note: "Rain ambience · warm city lights" },
  { id: "moon-room", name: "Moonlit Room", wallpaper: "cozy-room", mix: { brown: 0.35, rain: 0.2 }, dark: true, note: "Quiet night · soft lamp" },
  { id: "garden", name: "Secret Garden", wallpaper: "meadow", mix: { birds: 0.6, wind: 0.2 }, dark: false, note: "Birdsong · green meadow" },
  { id: "cafe", name: "Little Café", wallpaper: "desk", mix: { cafe: 0.7, rain: 0.1 }, dark: false, note: "Café murmur · morning light" },
  { id: "cabin", name: "Winter Cabin", wallpaper: "snow", mix: { fire: 0.75, wind: 0.3 }, dark: false, note: "Fireplace · falling snow" },
  { id: "clouds", name: "Cloud Nine", wallpaper: "clouds", mix: { wind: 0.3, white: 0.15 }, dark: false, note: "Airy sky · gentle breeze" },
  { id: "stars", name: "Starry Night", wallpaper: "night", mix: { ocean: 0.5 }, dark: true, note: "Night sky · distant waves" },
];

const useRoom = create<{ room: string; setRoom: (r: string) => void }>()(
  persist((set) => ({ room: "rainy-night", setRoom: (room) => set({ room }) }), { name: "lunova-room" }),
);

function DurationSettings({ open, onOpenChange }: { open: boolean; onOpenChange: (v: boolean) => void }) {
  const settings = useData((s) => s.settings)!;
  const updateSettings = useData((s) => s.updateSettings);
  // Remounted (via key) each time it opens.
  const [vals, setVals] = React.useState(() => ({ f: settings.focusDuration, s: settings.shortBreakDuration, l: settings.longBreakDuration, n: settings.sessionsBeforeLongBreak }));
  const num = (k: keyof typeof vals, max: number) => (e: React.ChangeEvent<HTMLInputElement>) =>
    setVals((v) => ({ ...v, [k]: e.target.value === "" ? 0 : clamp(Math.round(Number(e.target.value)) || 0, 0, max) }));
  const valid = vals.f >= 1 && vals.s >= 1 && vals.l >= 1 && vals.n >= 1;

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent title="Timer settings" description="Durations between 1 and 180 minutes." className="sm:max-w-md">
        <div className="mb-4 flex flex-wrap gap-2">
          {[
            { label: "Pomodoro 25/5", f: 25, s: 5, l: 15 },
            { label: "Deep 50/10", f: 50, s: 10, l: 20 },
            { label: "Short 15/3", f: 15, s: 3, l: 10 },
          ].map((p) => (
            <Button key={p.label} size="sm" variant={vals.f === p.f && vals.s === p.s ? "soft" : "outline"} onClick={() => setVals((v) => ({ ...v, f: p.f, s: p.s, l: p.l }))}>
              {p.label}
            </Button>
          ))}
        </div>
        <div className="grid grid-cols-2 gap-3">
          <Field label="Focus (min)" htmlFor="d-f">
            <Input id="d-f" type="number" min={1} max={180} value={vals.f || ""} onChange={num("f", 180)} />
          </Field>
          <Field label="Short break (min)" htmlFor="d-s">
            <Input id="d-s" type="number" min={1} max={180} value={vals.s || ""} onChange={num("s", 180)} />
          </Field>
          <Field label="Long break (min)" htmlFor="d-l">
            <Input id="d-l" type="number" min={1} max={180} value={vals.l || ""} onChange={num("l", 180)} />
          </Field>
          <Field label="Sessions before long break" htmlFor="d-n">
            <Input id="d-n" type="number" min={1} max={12} value={vals.n || ""} onChange={num("n", 12)} />
          </Field>
        </div>
        <div className="mt-5 space-y-3">
          <label className="flex items-center justify-between gap-3 text-sm font-semibold">
            Auto-start breaks
            <Switch checked={settings.autoStartBreaks} onCheckedChange={(v) => void updateSettings({ autoStartBreaks: v })} label="Auto-start breaks" />
          </label>
          <label className="flex items-center justify-between gap-3 text-sm font-semibold">
            Auto-start focus sessions
            <Switch checked={settings.autoStartFocus} onCheckedChange={(v) => void updateSettings({ autoStartFocus: v })} label="Auto-start focus sessions" />
          </label>
          <label className="flex items-center justify-between gap-3 text-sm font-semibold">
            Completion sound
            <Switch checked={settings.completionSound} onCheckedChange={(v) => void updateSettings({ completionSound: v })} label="Completion sound" />
          </label>
        </div>
        <div className="mt-6 flex justify-end gap-2">
          <Button variant="ghost" onClick={() => onOpenChange(false)}>
            Cancel
          </Button>
          <Button
            disabled={!valid}
            onClick={async () => {
              await updateSettings({ focusDuration: vals.f, shortBreakDuration: vals.s, longBreakDuration: vals.l, sessionsBeforeLongBreak: vals.n });
              onOpenChange(false);
            }}
          >
            Save
          </Button>
        </div>
        {useTimer.getState().status !== "idle" && <p className="mt-3 text-xs text-muted">New durations apply from your next session.</p>}
      </DialogContent>
    </Dialog>
  );
}

function SessionHistory() {
  const sessions = useData((s) => s.sessions) ?? [];
  const tasks = useData((s) => s.tasks) ?? [];
  const recent = sessions.slice(0, 8);
  if (!recent.length) return <EmptyState compact title="Your first focus session is waiting." description="Completed sessions will appear here." />;
  return (
    <ul className="space-y-1.5">
      {recent.map((s) => {
        const task = tasks.find((t) => t.id === s.taskId);
        const meta = MODE_META[s.sessionType];
        return (
          <li key={s.id} className="flex items-center gap-3 rounded-2xl bg-bg-2/50 px-3 py-2.5">
            <span className="size-2.5 shrink-0 rounded-full" style={{ background: meta.color }} />
            <div className="min-w-0 flex-1">
              <p className="truncate text-sm font-semibold">{task?.title ?? meta.label}</p>
              <p className="text-xs text-muted">
                {new Date(s.startedAt).toLocaleString(undefined, { weekday: "short", hour: "numeric", minute: "2-digit" })} · {formatDuration(s.actualDuration)}
              </p>
            </div>
            {s.completed ? (
              <CheckCircle2 className="size-4 text-[#5a9a66]" aria-label="Completed" />
            ) : (
              <XCircle className="size-4 text-muted" aria-label="Stopped early" />
            )}
          </li>
        );
      })}
    </ul>
  );
}

export function FocusStudio() {
  const v = useTimerView();
  const timer = useTimer.getState;
  const settings = useData((s) => s.settings)!;
  const task = useData((s) => s.tasks?.find((t) => t.id === v.taskId));
  const { room, setRoom } = useRoom();
  const currentRoom = ROOMS.find((r) => r.id === room) ?? ROOMS[0];
  const ambientOn = useAudio((s) => s.ambientOn);
  const [settingsOpen, setSettingsOpen] = React.useState(false);
  const [historyOpen, setHistoryOpen] = React.useState(false);
  const [fullscreen, setFullscreen] = React.useState(false);
  const rootRef = React.useRef<HTMLDivElement>(null);
  const meta = MODE_META[v.mode];
  const dark = currentRoom.dark;

  React.useEffect(() => {
    const onChange = () => setFullscreen(!!document.fullscreenElement);
    document.addEventListener("fullscreenchange", onChange);
    return () => document.removeEventListener("fullscreenchange", onChange);
  }, []);

  const toggleFullscreen = async () => {
    try {
      if (document.fullscreenElement) await document.exitFullscreen();
      else await rootRef.current?.requestFullscreen();
    } catch {
      /* not supported */
    }
  };

  const switchMode = (m: SessionType) => {
    if (m === v.mode) return;
    timer().setMode(m);
  };

  const glass = dark ? "border-white/15 bg-white/10 text-white backdrop-blur-xl" : "border-white/70 bg-white/60 text-ink backdrop-blur-xl";
  const subtle = dark ? "text-white/70" : "text-muted";
  const ring = 2 * Math.PI * 140;

  return (
    <div ref={rootRef} className="relative isolate flex min-h-[calc(100dvh-3.5rem)] flex-col overflow-hidden bg-bg pb-20 lg:min-h-dvh lg:pb-0">
      {/* Room */}
      <AnimatePresence mode="popLayout">
        <motion.div key={currentRoom.id} className="absolute inset-0 -z-10" initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} transition={{ duration: 0.8 }}>
          <WallpaperArt id={currentRoom.wallpaper} className="h-full w-full" />
          <div className={cn("absolute inset-0", dark ? "bg-[#151729]/30" : "bg-white/20")} />
        </motion.div>
      </AnimatePresence>

      {/* Top bar */}
      <div className="flex flex-wrap items-center justify-between gap-2 p-4 sm:p-6">
        <div className={cn("flex gap-1 rounded-2xl border p-1", glass)} role="tablist" aria-label="Session type">
          {(Object.keys(MODE_META) as SessionType[]).map((m) => (
            <button
              key={m}
              role="tab"
              aria-selected={v.mode === m}
              onClick={() => switchMode(m)}
              className={cn(
                "rounded-xl px-3 py-1.5 text-xs font-bold transition-all sm:px-4 sm:text-sm",
                v.mode === m ? "bg-white text-[#34343B] shadow-sm" : dark ? "text-white/75 hover:text-white" : "text-muted hover:text-ink",
              )}
            >
              {MODE_META[m].label}
            </button>
          ))}
        </div>
        <div className="flex items-center gap-1.5">
          <button onClick={() => setHistoryOpen(true)} className={cn("rounded-xl border p-2.5", glass)} aria-label="Session history">
            <History className="size-4" />
          </button>
          <button onClick={() => setSettingsOpen(true)} className={cn("rounded-xl border p-2.5", glass)} aria-label="Timer settings">
            <Settings2 className="size-4" />
          </button>
          <button onClick={toggleFullscreen} className={cn("rounded-xl border p-2.5", glass)} aria-label={fullscreen ? "Exit full screen" : "Full screen focus mode"}>
            {fullscreen ? <Minimize className="size-4" /> : <Expand className="size-4" />}
          </button>
        </div>
      </div>

      {/* Center */}
      <div className="flex flex-1 flex-col items-center justify-center px-4 pb-6">
        <div className="relative grid place-items-center">
          <svg width="300" height="300" viewBox="0 0 300 300" className="-rotate-90 max-sm:size-[260px]" aria-hidden>
            <circle cx="150" cy="150" r="140" fill={dark ? "rgba(20,22,40,0.35)" : "rgba(255,255,255,0.55)"} stroke={dark ? "rgba(255,255,255,0.12)" : "rgba(255,255,255,0.9)"} strokeWidth="8" />
            <circle
              cx="150"
              cy="150"
              r="140"
              fill="none"
              stroke={meta.color}
              strokeWidth="8"
              strokeLinecap="round"
              strokeDasharray={ring}
              strokeDashoffset={ring * (1 - v.progress)}
              style={{ transition: "stroke-dashoffset 300ms linear" }}
            />
          </svg>
          <div className="absolute inset-0 flex flex-col items-center justify-center text-center">
            <motion.span key={v.mode} initial={{ opacity: 0, y: -4 }} animate={{ opacity: 1, y: 0 }} className="mb-1 rounded-full px-3 py-1 text-xs font-bold uppercase tracking-widest" style={{ background: meta.soft, color: "#4a4a55" }}>
              {meta.label}
            </motion.span>
            <p className={cn("font-display text-6xl font-extrabold tabular-nums tracking-tight sm:text-7xl", dark ? "text-white" : "text-ink")} role="timer" aria-live="off" aria-label={`${v.label} remaining`}>
              {v.label}
            </p>
            <p className={cn("mt-1 text-sm font-semibold", subtle)}>
              {v.status === "running" ? (v.mode === "FOCUS" ? "Stay with it, gently." : "Rest your eyes.") : v.status === "paused" ? "Paused" : meta.prompt}
            </p>
          </div>
        </div>

        {/* Task */}
        <div className={cn("mt-6 w-full max-w-sm rounded-2xl border p-3", glass)}>
          <p className={cn("mb-1.5 text-center text-xs font-bold uppercase tracking-wider", subtle)}>Currently focusing on</p>
          {v.status !== "idle" && v.mode === "FOCUS" ? (
            <p className="truncate text-center font-display text-base font-bold">{task?.title ?? "Just focusing"}</p>
          ) : (
            <TaskPicker className={cn(dark && "border-white/20 bg-white/10 text-white [&>option]:text-ink")} />
          )}
          {task && task.focusSeconds > 0 && <p className={cn("mt-1 text-center text-xs", subtle)}>{formatDuration(task.focusSeconds)} focused on this task so far</p>}
        </div>

        {/* Controls */}
        <div className="mt-6 flex items-center gap-3">
          <button
            onClick={() => timer().reset()}
            disabled={v.status === "idle"}
            className={cn("grid size-12 place-items-center rounded-full border transition-opacity disabled:opacity-40", glass)}
            aria-label="Reset session"
            title="Reset"
          >
            <RotateCcw className="size-5" />
          </button>
          {v.status === "running" ? (
            <button onClick={() => timer().pause()} className="grid size-20 place-items-center rounded-full bg-white text-[#34343B] shadow-[var(--shadow-lift)] transition-transform hover:scale-105" aria-label="Pause">
              <Pause className="size-8 fill-current" />
            </button>
          ) : (
            <button
              onClick={() => timer().start()}
              className="grid size-20 place-items-center rounded-full text-white shadow-[var(--shadow-lift)] transition-transform hover:scale-105"
              style={{ background: meta.color }}
              aria-label={v.status === "paused" ? "Resume" : "Start"}
            >
              <Play className="ml-1 size-8 fill-current" />
            </button>
          )}
          <button onClick={() => timer().skip()} className={cn("grid size-12 place-items-center rounded-full border", glass)} aria-label="Skip to next session" title="Skip">
            <SkipForward className="size-5" />
          </button>
        </div>
        <div className="mt-4 flex flex-wrap justify-center gap-2">
          <button onClick={() => timer().extend(5)} className={cn("flex items-center gap-1 rounded-full border px-3 py-1.5 text-xs font-bold", glass)}>
            <Plus className="size-3.5" /> 5 min
          </button>
          {v.status !== "idle" && (
            <button onClick={() => timer().restart()} className={cn("flex items-center gap-1 rounded-full border px-3 py-1.5 text-xs font-bold", glass)}>
              <RotateCcw className="size-3.5" /> Restart
            </button>
          )}
          <span className={cn("rounded-full border px-3 py-1.5 text-xs font-bold", glass)}>
            Session {(v.cycleCount % v.durations.every) + 1}/{v.durations.every}
          </span>
        </div>
      </div>

      {/* Bottom: rooms + companion */}
      <div className="flex flex-col gap-4 p-4 sm:p-6 lg:flex-row lg:items-end lg:justify-between lg:pr-8">
        <div className={cn("rounded-3xl border p-3 lg:max-w-2xl", glass)}>
          <div className="mb-2 flex items-center justify-between gap-3 px-1">
            <p className="text-xs font-bold uppercase tracking-wider">
              <Sparkles className="mr-1 inline size-3.5" />
              {currentRoom.name} <span className={cn("ml-1 font-semibold normal-case tracking-normal", subtle)}>· {currentRoom.note}</span>
            </p>
            <button
              onClick={() => (ambientOn ? useAudio.getState().setAmbientOn(false) : useAudio.getState().applyMix(currentRoom.mix))}
              className="flex shrink-0 items-center gap-1 rounded-full bg-white/80 px-2.5 py-1 text-[11px] font-bold text-[#34343B]"
            >
              {ambientOn ? <VolumeX className="size-3.5" /> : <Volume2 className="size-3.5" />}
              {ambientOn ? "Stop sounds" : "Play room sounds"}
            </button>
          </div>
          <div className="flex gap-2 overflow-x-auto pb-1">
            {ROOMS.map((r) => (
              <button
                key={r.id}
                onClick={() => {
                  setRoom(r.id);
                  if (useAudio.getState().ambientOn) useAudio.getState().applyMix(r.mix);
                }}
                className={cn("group relative h-16 w-24 shrink-0 overflow-hidden rounded-2xl border-2 transition-all", room === r.id ? "border-white shadow-lg" : "border-transparent opacity-80 hover:opacity-100")}
                aria-pressed={room === r.id}
                aria-label={r.name}
              >
                <WallpaperArt id={r.wallpaper} className="pointer-events-none h-full w-full" />
                <span className="absolute inset-x-0 bottom-0 bg-black/35 px-1 py-0.5 text-[10px] font-bold text-white">{r.name}</span>
              </button>
            ))}
          </div>
        </div>
        {settings.companionEnabled ? (
          <Companion className="self-center lg:mb-16 lg:self-end" />
        ) : (
          <Link href="/workspace" className={cn("self-center rounded-full border px-3 py-1.5 text-xs font-bold", glass)}>
            Companion hidden · turn on in Customize
          </Link>
        )}
      </div>

      <DurationSettings key={String(settingsOpen)} open={settingsOpen} onOpenChange={setSettingsOpen} />
      <Dialog open={historyOpen} onOpenChange={setHistoryOpen}>
        <DialogContent title="Recent sessions" description="Your latest focus and break sessions." className="sm:max-w-md">
          <SessionHistory />
          <Button variant="soft" className="mt-4 w-full" asChild>
            <Link href="/progress">See all progress</Link>
          </Button>
        </DialogContent>
      </Dialog>
    </div>
  );
}
