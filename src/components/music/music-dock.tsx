"use client";

import * as React from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { AnimatePresence, motion } from "framer-motion";
import { ChevronDown, ChevronUp, Music2, Pause, Play, Repeat, Repeat1, Shuffle, SkipBack, SkipForward, SlidersHorizontal, Volume1, Volume2, VolumeX } from "lucide-react";
import { useAudio } from "@/stores/audio-store";
import { useData } from "@/stores/data-store";
import { formatClock } from "@/lib/dates";
import { cn } from "@/lib/utils";

export function VolumeSlider({ value, onChange, label = "Volume", className }: { value: number; onChange: (v: number) => void; label?: string; className?: string }) {
  return (
    <input
      type="range"
      min={0}
      max={100}
      value={Math.round(value * 100)}
      onChange={(e) => onChange(Number(e.target.value) / 100)}
      aria-label={label}
      className={cn("lun-range w-full", className)}
      style={{ ["--fill" as string]: `${Math.round(value * 100)}%` }}
    />
  );
}

export function Equalizer({ playing }: { playing: boolean }) {
  return (
    <span className="flex h-4 items-end gap-[2px]" aria-hidden>
      {[0, 1, 2, 3].map((i) => (
        <motion.span
          key={i}
          className="w-[3px] rounded-full bg-accent-strong"
          animate={playing ? { height: ["30%", "100%", "45%", "80%", "30%"] } : { height: "30%" }}
          transition={{ duration: 1.1 + i * 0.15, repeat: playing ? Infinity : 0, ease: "easeInOut" }}
        />
      ))}
    </span>
  );
}

export function TransportControls({ size = "md" }: { size?: "sm" | "md" }) {
  const { playing, toggle, next, prev, shuffle, setShuffle, repeat, cycleRepeat } = useAudio();
  const btn = "grid place-items-center rounded-xl text-muted transition-colors hover:bg-bg-2 hover:text-ink";
  const s = size === "sm" ? "size-8" : "size-9";
  return (
    <div className="flex items-center gap-1">
      <button className={cn(btn, s, shuffle && "text-accent-strong")} onClick={() => setShuffle(!shuffle)} aria-pressed={shuffle} aria-label="Shuffle">
        <Shuffle className="size-4" />
      </button>
      <button className={cn(btn, s)} onClick={prev} aria-label="Previous track">
        <SkipBack className="size-4" />
      </button>
      <button
        className={cn("grid place-items-center rounded-full bg-accent-strong text-white shadow-[var(--shadow-soft)] transition-transform hover:scale-105 dark:text-bg", size === "sm" ? "size-9" : "size-11")}
        onClick={toggle}
        aria-label={playing ? "Pause" : "Play"}
      >
        {playing ? <Pause className="size-4 fill-current" /> : <Play className="ml-0.5 size-4 fill-current" />}
      </button>
      <button className={cn(btn, s)} onClick={() => next()} aria-label="Next track">
        <SkipForward className="size-4" />
      </button>
      <button
        className={cn(btn, s, repeat !== "off" && "text-accent-strong")}
        onClick={cycleRepeat}
        aria-label={`Repeat: ${repeat}`}
        title={`Repeat: ${repeat}`}
      >
        {repeat === "one" ? <Repeat1 className="size-4" /> : <Repeat className="size-4" />}
      </button>
    </div>
  );
}

export function TrackProgress() {
  const { position, duration, seek, current } = useAudio();
  const t = current();
  if (!t || (t.kind !== "file" && t.kind !== "local")) {
    return <p className="text-[11px] text-muted">{t?.kind === "generative" ? "Endless · generated live" : "Endless soundscape"}</p>;
  }
  const pct = duration ? (position / duration) * 100 : 0;
  return (
    <div className="flex items-center gap-2 text-[11px] tabular-nums text-muted">
      <span>{formatClock(position)}</span>
      <input
        type="range"
        min={0}
        max={Math.max(1, Math.floor(duration))}
        value={Math.floor(position)}
        onChange={(e) => seek(Number(e.target.value))}
        className="lun-range flex-1"
        style={{ ["--fill" as string]: `${pct}%` }}
        aria-label="Seek"
      />
      <span>{formatClock(duration)}</span>
    </div>
  );
}

/** Floating player — persists across every page of the app. */
export function MusicDock() {
  const settings = useData((s) => s.settings);
  const { playing, volume, setVolume, expanded, setExpanded, current, ambientOn } = useAudio();
  const track = current();
  const pathname = usePathname();
  if (settings && !settings.showMusicPlayer) return null;
  // Focus Studio has its own sound controls; keep its small-screen layout uncluttered.
  const onFocus = pathname.startsWith("/focus");
  const VolIcon = volume === 0 ? VolumeX : volume < 0.5 ? Volume1 : Volume2;

  return (
    <div className={cn("fixed bottom-20 right-3 z-30 lg:bottom-5 lg:right-5", onFocus && "max-lg:hidden")}>
      <AnimatePresence mode="wait" initial={false}>
        {expanded ? (
          <motion.div
            key="full"
            initial={{ opacity: 0, y: 10, scale: 0.97 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: 10, scale: 0.97 }}
            transition={{ duration: 0.2 }}
            className="w-[min(320px,calc(100vw-1.5rem))] rounded-3xl border border-line bg-card/95 p-4 shadow-[var(--shadow-lift)] backdrop-blur-xl"
            role="region"
            aria-label="Music player"
          >
            <div className="mb-3 flex items-center justify-between">
              <span className="text-xs font-bold uppercase tracking-wider text-muted">Now playing</span>
              <div className="flex items-center gap-1">
                <Link href="/music" className="rounded-lg p-1.5 text-muted hover:bg-bg-2 hover:text-ink" aria-label="Open sound mixer">
                  <SlidersHorizontal className="size-4" />
                </Link>
                <button onClick={() => setExpanded(false)} className="rounded-lg p-1.5 text-muted hover:bg-bg-2 hover:text-ink" aria-label="Minimize player">
                  <ChevronDown className="size-4" />
                </button>
              </div>
            </div>
            <div className="mb-3 flex items-center gap-3">
              <div className="grid size-12 shrink-0 place-items-center rounded-2xl bg-gradient-to-br from-accent-soft to-lavender/60">
                {playing ? <Equalizer playing /> : <Music2 className="size-5 text-accent-strong" />}
              </div>
              <div className="min-w-0">
                <p className="truncate text-sm font-bold text-ink">{track?.title ?? "Choose a track"}</p>
                <p className="truncate text-xs text-muted">{track?.artist}</p>
              </div>
            </div>
            <TrackProgress />
            <div className="mt-2 flex justify-center">
              <TransportControls />
            </div>
            <div className="mt-3 flex items-center gap-2">
              <VolIcon className="size-4 shrink-0 text-muted" aria-hidden />
              <VolumeSlider value={volume} onChange={setVolume} />
            </div>
            {ambientOn && <p className="mt-2 text-center text-[11px] text-muted">Ambient mixer is on · adjust in Music & Sounds</p>}
          </motion.div>
        ) : (
          <motion.div
            key="mini"
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: 10 }}
            transition={{ duration: 0.2 }}
            className="flex items-center gap-2 rounded-full border border-line bg-card/95 py-1.5 pl-1.5 pr-2 shadow-[var(--shadow-lift)] backdrop-blur-xl"
            role="region"
            aria-label="Music player"
          >
            <button
              onClick={() => useAudio.getState().toggle()}
              className="grid size-9 place-items-center rounded-full bg-accent-strong text-white dark:text-bg"
              aria-label={playing ? "Pause" : "Play"}
            >
              {playing ? <Pause className="size-4 fill-current" /> : <Play className="ml-0.5 size-4 fill-current" />}
            </button>
            <button onClick={() => setExpanded(true)} className="flex max-w-40 items-center gap-2 text-left" aria-label="Expand player">
              {playing && <Equalizer playing />}
              <span className="truncate text-xs font-semibold text-ink">{track?.title ?? "Music"}</span>
              <ChevronUp className="size-4 shrink-0 text-muted" />
            </button>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}
