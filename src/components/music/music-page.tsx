"use client";

import * as React from "react";
import { AudioLines, Bird, Coffee, CloudLightning, CloudRain, Flame, Info, Music2, Pause, Play, Radio, Save, Trash2, Upload, VolumeX, Waves, Wind } from "lucide-react";
import { useAudio } from "@/stores/audio-store";
import { useData } from "@/stores/data-store";
import { PageContainer, PageHeader } from "@/components/layout/page-header";
import { Card, CardHeader, Segmented, Switch } from "@/components/ui/misc";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { EmptyState } from "@/components/ui/states";
import { Equalizer, TrackProgress, TransportControls, VolumeSlider } from "./music-dock";
import { AMBIENT_SOUNDS, type AmbientKey } from "@/lib/audio/ambient";
import { MUSIC_CATEGORIES, type MusicCategory } from "@/lib/audio/tracks";
import { cn } from "@/lib/utils";

const ICONS: Record<AmbientKey, React.ElementType> = {
  rain: CloudRain,
  thunder: CloudLightning,
  wind: Wind,
  birds: Bird,
  fire: Flame,
  cafe: Coffee,
  ocean: Waves,
  white: Radio,
  brown: AudioLines,
};

const PRESETS: { name: string; levels: Partial<Record<AmbientKey, number>> }[] = [
  { name: "Rainy Morning", levels: { rain: 0.65, birds: 0.15 } },
  { name: "Deep Work", levels: { brown: 0.55, rain: 0.2 } },
  { name: "Cozy Cabin", levels: { fire: 0.7, wind: 0.25, rain: 0.15 } },
  { name: "Seaside Café", levels: { cafe: 0.5, ocean: 0.35 } },
  { name: "Thunderstorm", levels: { rain: 0.75, thunder: 0.6, wind: 0.3 } },
];

export function MusicPage() {
  const audio = useAudio();
  const mixes = useData((s) => s.mixes) ?? [];
  const saveMix = useData((s) => s.saveMix);
  const deleteMix = useData((s) => s.deleteMix);
  const [category, setCategory] = React.useState<MusicCategory>("lofi");
  const [mixName, setMixName] = React.useState("");
  const fileRef = React.useRef<HTMLInputElement>(null);

  const tracks = audio.tracks().filter((t) => t.category === category);
  const current = audio.current();
  const activeLevels = Object.entries(audio.levels).filter(([, v]) => v > 0).length;

  return (
    <PageContainer>
      <PageHeader
        title="Music & Sounds"
        subtitle="Create your own relaxing focus atmosphere."
        actions={
          <Button variant="outline" onClick={audio.muteAll} disabled={!audio.playing && !audio.ambientOn}>
            <VolumeX /> Mute all
          </Button>
        }
      />

      <div className="grid gap-5 xl:grid-cols-[1fr_380px]">
        <div className="space-y-5">
          {/* Now playing */}
          <Card className="flex flex-col gap-5 bg-gradient-to-br from-card via-card to-accent-soft/60 sm:flex-row sm:items-center">
            <div className="grid size-24 shrink-0 place-items-center self-center rounded-3xl bg-gradient-to-br from-accent to-lavender shadow-[var(--shadow-soft)]">
              {audio.playing ? <Equalizer playing /> : <Music2 className="size-9 text-white" />}
            </div>
            <div className="min-w-0 flex-1">
              <p className="text-xs font-bold uppercase tracking-wider text-muted">{audio.playing ? "Now playing" : "Ready to play"}</p>
              <p className="truncate font-display text-xl font-extrabold">{current?.title ?? "Pick a track"}</p>
              <p className="truncate text-sm text-muted">{current?.artist}</p>
              <div className="mt-3">
                <TrackProgress />
              </div>
              <div className="mt-2 flex flex-wrap items-center justify-between gap-3">
                <TransportControls />
                <div className="flex min-w-36 flex-1 items-center gap-2 sm:max-w-48">
                  <span className="text-xs font-semibold text-muted">Vol</span>
                  <VolumeSlider value={audio.volume} onChange={audio.setVolume} label="Music volume" />
                </div>
              </div>
            </div>
          </Card>

          {/* Library */}
          <Card>
            <CardHeader title="Library" icon={<Music2 />} subtitle={MUSIC_CATEGORIES.find((c) => c.key === category)?.description} />
            <div className="-mx-1 mb-4 overflow-x-auto px-1 pb-1">
              <Segmented
                label="Music category"
                size="sm"
                value={category}
                onChange={setCategory}
                options={MUSIC_CATEGORIES.map((c) => ({ value: c.key, label: c.label }))}
                className="w-max"
              />
            </div>
            {category === "my-music" && (
              <div className="mb-4 rounded-2xl border border-dashed border-line bg-bg-2/40 p-4 text-center">
                <input
                  ref={fileRef}
                  type="file"
                  accept="audio/*"
                  multiple
                  className="hidden"
                  onChange={(e) => {
                    if (e.target.files?.length) audio.addLocalFiles(e.target.files);
                    e.target.value = "";
                  }}
                />
                <Button variant="soft" onClick={() => fileRef.current?.click()}>
                  <Upload /> Add music from your device
                </Button>
                <p className="mt-2 text-xs text-muted">Files play straight from your device and are never uploaded. They&apos;re cleared when you close the tab.</p>
              </div>
            )}
            {tracks.length ? (
              <ul className="space-y-1.5">
                {tracks.map((t) => {
                  const isCurrent = current?.id === t.id;
                  const isPlaying = isCurrent && audio.playing;
                  return (
                    <li key={t.id}>
                      <button
                        onClick={() => (isPlaying ? audio.pause() : void audio.play(t.id))}
                        className={cn("flex w-full items-center gap-3 rounded-2xl px-3 py-2.5 text-left transition-colors", isCurrent ? "bg-accent-soft" : "hover:bg-bg-2/60")}
                        aria-label={isPlaying ? `Pause ${t.title}` : `Play ${t.title}`}
                      >
                        <span className={cn("grid size-9 shrink-0 place-items-center rounded-xl", isCurrent ? "bg-accent-strong text-white dark:text-bg" : "bg-bg-2 text-muted")}>
                          {isPlaying ? <Pause className="size-4 fill-current" /> : <Play className="ml-0.5 size-4 fill-current" />}
                        </span>
                        <span className="min-w-0 flex-1">
                          <span className="block truncate text-sm font-semibold">{t.title}</span>
                          <span className="block truncate text-xs text-muted">{t.artist}</span>
                        </span>
                        {isPlaying && <Equalizer playing />}
                      </button>
                    </li>
                  );
                })}
              </ul>
            ) : (
              <EmptyState compact title={category === "my-music" ? "No music added yet." : "No tracks here yet."} description={category === "my-music" ? "Add audio files from your device to play them here." : undefined} />
            )}
            <p className="mt-4 flex items-start gap-2 rounded-2xl bg-bg-2/50 p-3 text-xs text-muted">
              <Info className="mt-0.5 size-3.5 shrink-0" />
              Lunova&apos;s built-in music and soundscapes are generated live in your browser — original, royalty-free, and endless. You can add licensed audio files too (see the README).
            </p>
          </Card>
        </div>

        {/* Mixer */}
        <div className="space-y-5">
          <Card>
            <CardHeader
              title="Ambient mixer"
              subtitle={audio.ambientOn ? `${activeLevels} sound${activeLevels === 1 ? "" : "s"} playing` : "Layer sounds together"}
              icon={<AudioLines />}
              action={<Switch checked={audio.ambientOn} onCheckedChange={audio.setAmbientOn} label="Ambient sounds on or off" />}
            />
            <ul className="space-y-3">
              {AMBIENT_SOUNDS.map((s) => {
                const Icon = ICONS[s.key];
                const level = audio.levels[s.key];
                const live = audio.ambientOn && level > 0;
                return (
                  <li key={s.key} className="flex items-center gap-3">
                    <button
                      onClick={() => {
                        audio.setLevel(s.key, level > 0 ? 0 : 0.5);
                        if (!audio.ambientOn && level === 0) audio.setAmbientOn(true);
                      }}
                      className={cn("grid size-10 shrink-0 place-items-center rounded-2xl transition-colors", live ? "bg-accent-strong text-white dark:text-bg" : level > 0 ? "bg-accent-soft text-accent-strong" : "bg-bg-2 text-muted")}
                      aria-label={`${level > 0 ? "Turn off" : "Turn on"} ${s.label}`}
                      aria-pressed={level > 0}
                    >
                      <Icon className="size-[18px]" />
                    </button>
                    <div className="min-w-0 flex-1">
                      <div className="mb-1 flex justify-between text-xs font-semibold">
                        <span>{s.label}</span>
                        <span className="tabular-nums text-muted">{Math.round(level * 100)}%</span>
                      </div>
                      <VolumeSlider value={level} onChange={(v) => audio.setLevel(s.key, v)} label={`${s.label} volume`} />
                    </div>
                  </li>
                );
              })}
            </ul>
            {!audio.ambientOn && (
              <Button className="mt-5 w-full" onClick={() => audio.setAmbientOn(true)} disabled={!activeLevels}>
                <Play className="fill-current" /> Play mix
              </Button>
            )}
            <form
              className="mt-5 flex gap-2 border-t border-line pt-4"
              onSubmit={async (e) => {
                e.preventDefault();
                if (!mixName.trim() || !activeLevels) return;
                const levels = Object.fromEntries(Object.entries(audio.levels).filter(([, v]) => v > 0));
                await saveMix(mixName.trim(), levels);
                setMixName("");
              }}
            >
              <Input value={mixName} onChange={(e) => setMixName(e.target.value)} placeholder="Name this mix…" aria-label="Mix name" maxLength={40} />
              <Button type="submit" variant="soft" disabled={!mixName.trim() || !activeLevels}>
                <Save /> Save
              </Button>
            </form>
          </Card>

          <Card>
            <CardHeader title="Presets & saved mixes" icon={<Save />} />
            <div className="flex flex-wrap gap-2">
              {PRESETS.map((p) => (
                <Button key={p.name} size="sm" variant="outline" onClick={() => audio.applyMix(p.levels)}>
                  {p.name}
                </Button>
              ))}
            </div>
            {mixes.length > 0 && (
              <ul className="mt-4 space-y-1.5 border-t border-line pt-4">
                {mixes.map((m) => (
                  <li key={m.id} className="flex items-center gap-2 rounded-2xl bg-bg-2/50 py-1.5 pl-3 pr-1.5">
                    <span className="flex-1 truncate text-sm font-semibold">{m.name}</span>
                    <Button size="sm" variant="soft" onClick={() => audio.applyMix(m.levels as Partial<Record<AmbientKey, number>>)}>
                      <Play className="fill-current" /> Play
                    </Button>
                    <button onClick={() => void deleteMix(m.id)} className="rounded-lg p-2 text-muted hover:bg-danger/20 hover:text-[#a14a4a]" aria-label={`Delete mix ${m.name}`}>
                      <Trash2 className="size-3.5" />
                    </button>
                  </li>
                ))}
              </ul>
            )}
          </Card>
        </div>
      </div>
    </PageContainer>
  );
}
