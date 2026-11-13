import type { AmbientKey } from "./ambient";
import type { GeneratorId } from "./generative";
import { FILE_TRACKS } from "./file-tracks";

export type MusicCategory = "lofi" | "rain" | "nature" | "cafe" | "piano" | "sleepy" | "white-noise" | "my-music";

export const MUSIC_CATEGORIES: { key: MusicCategory; label: string; description: string }[] = [
  { key: "lofi", label: "Lo-fi", description: "Relaxing beats" },
  { key: "rain", label: "Rain", description: "Soft rainfall" },
  { key: "nature", label: "Nature", description: "Forest, birds & sea" },
  { key: "cafe", label: "Café", description: "Cozy murmur" },
  { key: "piano", label: "Piano", description: "Gentle keys" },
  { key: "sleepy", label: "Sleepy", description: "Calm ambient pads" },
  { key: "white-noise", label: "White Noise", description: "Steady focus noise" },
  { key: "my-music", label: "My Music", description: "Files from your device" },
];

interface TrackBase {
  id: string;
  title: string;
  artist: string;
  category: MusicCategory;
}

export type Track =
  | (TrackBase & { kind: "generative"; generator: GeneratorId })
  | (TrackBase & { kind: "soundscape"; levels: Partial<Record<AmbientKey, number>> })
  | (TrackBase & { kind: "file"; src: string })
  | (TrackBase & { kind: "local"; src: string });

/** Built-in tracks are generated live in the browser — original and royalty-free. */
export const BUILT_IN_TRACKS: Track[] = [
  { id: "gen-lofi", title: "Midnight Notes", artist: "Lunova · generated live", category: "lofi", kind: "generative", generator: "lofi" },
  { id: "gen-piano", title: "Soft Keys", artist: "Lunova · generated live", category: "piano", kind: "generative", generator: "piano" },
  { id: "gen-sleepy", title: "Drifting Clouds", artist: "Lunova · generated live", category: "sleepy", kind: "generative", generator: "sleepy" },
  { id: "sc-rain", title: "Gentle Rain", artist: "Soundscape", category: "rain", kind: "soundscape", levels: { rain: 0.85 } },
  { id: "sc-storm", title: "Storm by the Window", artist: "Soundscape", category: "rain", kind: "soundscape", levels: { rain: 0.7, thunder: 0.6, wind: 0.2 } },
  { id: "sc-forest", title: "Morning Forest", artist: "Soundscape", category: "nature", kind: "soundscape", levels: { birds: 0.7, wind: 0.25 } },
  { id: "sc-sea", title: "Quiet Seaside", artist: "Soundscape", category: "nature", kind: "soundscape", levels: { ocean: 0.8, birds: 0.12 } },
  { id: "sc-cafe", title: "Corner Café", artist: "Soundscape", category: "cafe", kind: "soundscape", levels: { cafe: 0.8, rain: 0.12 } },
  { id: "sc-cabin", title: "Winter Cabin", artist: "Soundscape", category: "cafe", kind: "soundscape", levels: { fire: 0.8, wind: 0.3 } },
  { id: "sc-white", title: "White Noise", artist: "Soundscape", category: "white-noise", kind: "soundscape", levels: { white: 0.6 } },
  { id: "sc-brown", title: "Brown Noise", artist: "Soundscape", category: "white-noise", kind: "soundscape", levels: { brown: 0.85 } },
];

export const CATALOG: Track[] = [...BUILT_IN_TRACKS, ...FILE_TRACKS];
