"use client";

import { getAudioContext, gain } from "./context";
import { startAmbient, type AmbientKey } from "./ambient";
import { startGenerator } from "./generative";
import type { Track } from "./tracks";

type Stop = () => void;

interface Callbacks {
  onTime?: (position: number, duration: number) => void;
  onEnded?: () => void;
  onError?: () => void;
  onPlaying?: () => void;
}

/**
 * Singleton audio engine. Two independent buses:
 *  - music:   the current track (generated, soundscape, or a file)
 *  - ambient: the sound mixer, one gain per sound
 */
class AudioEngine {
  private musicBus: GainNode | null = null;
  private ambientBus: GainNode | null = null;
  private trackStop: Stop | null = null;
  private el: HTMLAudioElement | null = null;
  private ambient = new Map<AmbientKey, { g: GainNode; stop: Stop }>();
  private musicVolume = 0.6;
  private cb: Callbacks = {};

  setCallbacks(cb: Callbacks) {
    this.cb = cb;
  }

  private buses() {
    const ac = getAudioContext();
    if (!this.musicBus) {
      this.musicBus = gain(ac, this.musicVolume);
      this.musicBus.connect(ac.destination);
      this.ambientBus = gain(ac, 1);
      this.ambientBus.connect(ac.destination);
    }
    return { ac, music: this.musicBus, ambient: this.ambientBus! };
  }

  async playTrack(track: Track) {
    this.stopTrack();
    if (track.kind === "file" || track.kind === "local") {
      const el = new Audio();
      el.preload = "auto";
      el.src = track.src;
      el.volume = this.musicVolume;
      el.ontimeupdate = () => this.cb.onTime?.(el.currentTime, Number.isFinite(el.duration) ? el.duration : 0);
      el.onended = () => this.cb.onEnded?.();
      el.onerror = () => this.cb.onError?.();
      el.onplaying = () => this.cb.onPlaying?.();
      this.el = el;
      try {
        await el.play();
      } catch {
        this.cb.onError?.();
      }
      return;
    }
    const { ac, music } = this.buses();
    if (track.kind === "generative") {
      this.trackStop = startGenerator(ac, track.generator, music);
    } else {
      const stops: Stop[] = [];
      for (const [key, level] of Object.entries(track.levels)) {
        const g = gain(ac, level ?? 0);
        g.connect(music);
        const stop = startAmbient(ac, key as AmbientKey, g);
        stops.push(() => {
          stop();
          g.disconnect();
        });
      }
      this.trackStop = () => stops.forEach((s) => s());
    }
    this.cb.onPlaying?.();
  }

  pauseFile() {
    this.el?.pause();
  }

  async resumeFile() {
    if (!this.el) return false;
    try {
      await this.el.play();
      return true;
    } catch {
      this.cb.onError?.();
      return false;
    }
  }

  hasFile() {
    return !!this.el;
  }

  seek(seconds: number) {
    if (this.el) this.el.currentTime = seconds;
  }

  stopTrack() {
    this.trackStop?.();
    this.trackStop = null;
    if (this.el) {
      this.el.pause();
      this.el.ontimeupdate = this.el.onended = this.el.onerror = this.el.onplaying = null;
      this.el.removeAttribute("src");
      this.el.load();
      this.el = null;
    }
  }

  setMusicVolume(v: number) {
    this.musicVolume = v;
    if (this.el) this.el.volume = v;
    if (this.musicBus) this.musicBus.gain.setTargetAtTime(v, this.musicBus.context.currentTime, 0.05);
  }

  /** Sets one mixer channel. level 0 (or enabled=false) stops it entirely. */
  setAmbient(key: AmbientKey, level: number, enabled: boolean) {
    const running = this.ambient.get(key);
    if (!enabled || level <= 0) {
      if (running) {
        const ac = running.g.context;
        running.g.gain.setTargetAtTime(0, ac.currentTime, 0.15);
        const r = running;
        this.ambient.delete(key);
        window.setTimeout(() => {
          r.stop();
          r.g.disconnect();
        }, 700);
      }
      return;
    }
    if (running) {
      running.g.gain.setTargetAtTime(level, running.g.context.currentTime, 0.08);
      return;
    }
    const { ac, ambient } = this.buses();
    const g = gain(ac, 0);
    g.connect(ambient);
    g.gain.setTargetAtTime(level, ac.currentTime, 0.4); // gentle fade-in
    this.ambient.set(key, { g, stop: startAmbient(ac, key, g) });
  }

  stopAllAmbient() {
    for (const key of [...this.ambient.keys()]) this.setAmbient(key, 0, false);
  }
}

let engine: AudioEngine | null = null;
export function audioEngine() {
  if (!engine) engine = new AudioEngine();
  return engine;
}
