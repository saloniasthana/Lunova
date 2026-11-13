"use client";

import { create } from "zustand";
import { persist } from "zustand/middleware";
import { toast } from "sonner";
import { audioEngine } from "@/lib/audio/engine";
import { AMBIENT_SOUNDS, type AmbientKey } from "@/lib/audio/ambient";
import { CATALOG, type Track } from "@/lib/audio/tracks";

type Repeat = "off" | "all" | "one";

interface AudioState {
  currentId: string;
  playing: boolean;
  volume: number; // 0..1
  shuffle: boolean;
  repeat: Repeat;
  position: number;
  duration: number;
  localTracks: Track[];
  expanded: boolean;
  hidden: boolean;

  ambientOn: boolean;
  levels: Record<AmbientKey, number>;

  tracks: () => Track[];
  current: () => Track | undefined;
  play: (id?: string) => Promise<void>;
  pause: () => void;
  toggle: () => void;
  next: (auto?: boolean) => void;
  prev: () => void;
  seek: (s: number) => void;
  setVolume: (v: number) => void;
  setShuffle: (v: boolean) => void;
  cycleRepeat: () => void;
  addLocalFiles: (files: FileList | File[]) => void;
  setExpanded: (v: boolean) => void;
  setHidden: (v: boolean) => void;

  setLevel: (key: AmbientKey, v: number) => void;
  setAmbientOn: (v: boolean) => void;
  applyMix: (levels: Partial<Record<AmbientKey, number>>) => void;
  muteAll: () => void;
}

const emptyLevels = Object.fromEntries(AMBIENT_SOUNDS.map((s) => [s.key, 0])) as Record<AmbientKey, number>;

export const useAudio = create<AudioState>()(
  persist(
    (set, get) => {
      const engine = () => {
        const e = audioEngine();
        e.setCallbacks({
          onTime: (position, duration) => set({ position, duration }),
          onEnded: () => get().next(true),
          onPlaying: () => set({ playing: true }),
          onError: () => {
            set({ playing: false });
            toast.error("Unable to play this sound. Try another track.");
          },
        });
        return e;
      };

      return {
        currentId: "gen-lofi",
        playing: false,
        volume: 0.6,
        shuffle: false,
        repeat: "all",
        position: 0,
        duration: 0,
        localTracks: [],
        expanded: false,
        hidden: false,
        ambientOn: false,
        levels: { ...emptyLevels, rain: 0.5 },

        tracks: () => [...CATALOG, ...get().localTracks],
        current: () => get().tracks().find((t) => t.id === get().currentId),

        async play(id) {
          const e = engine();
          const s = get();
          const targetId = id ?? s.currentId;
          const track = s.tracks().find((t) => t.id === targetId) ?? s.tracks()[0];
          if (!track) return;
          e.setMusicVolume(s.volume);
          // Resume a paused file track instead of restarting it.
          if (!id && track.id === s.currentId && e.hasFile() && (track.kind === "file" || track.kind === "local")) {
            if (await e.resumeFile()) set({ playing: true });
            return;
          }
          set({ currentId: track.id, position: 0, duration: 0, playing: true });
          await e.playTrack(track);
        },

        pause() {
          const e = engine();
          const t = get().current();
          if (t && (t.kind === "file" || t.kind === "local")) e.pauseFile();
          else e.stopTrack();
          set({ playing: false });
        },

        toggle() {
          if (get().playing) get().pause();
          else void get().play();
        },

        next(auto = false) {
          const { tracks, currentId, shuffle, repeat } = get();
          const list = tracks();
          if (auto && repeat === "one") return void get().play(currentId);
          const idx = list.findIndex((t) => t.id === currentId);
          let nextIdx = shuffle ? Math.floor(Math.random() * list.length) : idx + 1;
          if (shuffle && list.length > 1 && nextIdx === idx) nextIdx = (idx + 1) % list.length;
          if (nextIdx >= list.length) {
            if (auto && repeat === "off") return set({ playing: false });
            nextIdx = 0;
          }
          void get().play(list[nextIdx].id);
        },

        prev() {
          const { tracks, currentId, position } = get();
          if (position > 3) return get().seek(0);
          const list = tracks();
          const idx = list.findIndex((t) => t.id === currentId);
          void get().play(list[(idx - 1 + list.length) % list.length].id);
        },

        seek(sec) {
          engine().seek(sec);
          set({ position: sec });
        },

        setVolume(v) {
          engine().setMusicVolume(v);
          set({ volume: v });
        },

        setShuffle: (shuffle) => set({ shuffle }),
        cycleRepeat: () => set((s) => ({ repeat: s.repeat === "off" ? "all" : s.repeat === "all" ? "one" : "off" })),

        addLocalFiles(files) {
          const added: Track[] = [];
          for (const f of Array.from(files)) {
            if (!f.type.startsWith("audio/")) continue;
            if (f.size > 200 * 1024 * 1024) {
              toast.error(`${f.name} is too large.`);
              continue;
            }
            added.push({
              id: `local-${f.name}-${f.size}-${f.lastModified}`,
              title: f.name.replace(/\.[^.]+$/, ""),
              artist: "From your device",
              category: "my-music",
              kind: "local",
              src: URL.createObjectURL(f),
            });
          }
          if (!added.length) return void toast.error("Please choose audio files (mp3, wav, ogg…).");
          set((s) => ({ localTracks: [...s.localTracks.filter((t) => !added.some((a) => a.id === t.id)), ...added] }));
          toast.success(`Added ${added.length} track${added.length > 1 ? "s" : ""} — they stay on this device only.`);
        },

        setExpanded: (expanded) => set({ expanded }),
        setHidden: (hidden) => set({ hidden }),

        setLevel(key, v) {
          const levels = { ...get().levels, [key]: v };
          set({ levels });
          engine().setAmbient(key, v, get().ambientOn);
        },

        setAmbientOn(on) {
          set({ ambientOn: on });
          const e = engine();
          const { levels } = get();
          for (const s of AMBIENT_SOUNDS) e.setAmbient(s.key, levels[s.key], on);
        },

        applyMix(partial) {
          const levels = { ...emptyLevels, ...partial };
          set({ levels });
          get().setAmbientOn(true);
        },

        muteAll() {
          get().pause();
          get().setAmbientOn(false);
        },
      };
    },
    {
      name: "lunova-audio",
      version: 1,
      partialize: (s) => ({
        currentId: s.currentId.startsWith("local-") ? "gen-lofi" : s.currentId,
        volume: s.volume,
        shuffle: s.shuffle,
        repeat: s.repeat,
        levels: s.levels,
        expanded: s.expanded,
      }),
    },
  ),
);
