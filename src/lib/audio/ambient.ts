"use client";

import { filter, gain, lfo, loopNoise, noiseBuffer } from "./context";

/**
 * Procedural ambient sounds. Every sound is generated live with the Web Audio
 * API, so they genuinely play without any audio files or licensing concerns.
 */

export type AmbientKey = "rain" | "thunder" | "wind" | "birds" | "fire" | "cafe" | "ocean" | "white" | "brown";

export const AMBIENT_SOUNDS: { key: AmbientKey; label: string; icon: string }[] = [
  { key: "rain", label: "Rain", icon: "cloud-rain" },
  { key: "thunder", label: "Thunder", icon: "cloud-lightning" },
  { key: "wind", label: "Wind", icon: "wind" },
  { key: "birds", label: "Birds", icon: "bird" },
  { key: "fire", label: "Fireplace", icon: "flame" },
  { key: "cafe", label: "Café", icon: "coffee" },
  { key: "ocean", label: "Ocean waves", icon: "waves" },
  { key: "white", label: "White noise", icon: "radio" },
  { key: "brown", label: "Brown noise", icon: "audio-lines" },
];

type Stop = () => void;

/** Runs `fn` at random intervals until stopped. */
function every(minMs: number, maxMs: number, fn: () => void): Stop {
  let timer: number;
  let alive = true;
  const loop = () => {
    if (!alive) return;
    fn();
    timer = window.setTimeout(loop, minMs + Math.random() * (maxMs - minMs));
  };
  timer = window.setTimeout(loop, Math.random() * maxMs * 0.5);
  return () => {
    alive = false;
    window.clearTimeout(timer);
  };
}

function stopNodes(nodes: (AudioScheduledSourceNode | AudioNode)[]) {
  for (const n of nodes) {
    try {
      if ("stop" in n) (n as AudioScheduledSourceNode).stop();
    } catch {
      /* already stopped */
    }
    try {
      n.disconnect();
    } catch {
      /* noop */
    }
  }
}

function burst(ac: AudioContext, out: AudioNode, opts: { freq: number; type: BiquadFilterType; q?: number; peak: number; decay: number }) {
  const len = Math.floor(ac.sampleRate * (opts.decay + 0.02));
  const buf = ac.createBuffer(1, len, ac.sampleRate);
  const d = buf.getChannelData(0);
  for (let i = 0; i < len; i++) d[i] = Math.random() * 2 - 1;
  const src = ac.createBufferSource();
  src.buffer = buf;
  const f = filter(ac, opts.type, opts.freq, opts.q ?? 1);
  const g = gain(ac, 0);
  const t = ac.currentTime;
  g.gain.setValueAtTime(opts.peak, t);
  g.gain.exponentialRampToValueAtTime(0.0001, t + opts.decay);
  src.connect(f).connect(g).connect(out);
  src.start(t);
  src.stop(t + opts.decay + 0.05);
}

export function startAmbient(ac: AudioContext, key: AmbientKey, out: AudioNode): Stop {
  const nodes: (AudioScheduledSourceNode | AudioNode)[] = [];
  const timers: Stop[] = [];
  const keep = <T extends AudioNode>(n: T) => (nodes.push(n), n);

  switch (key) {
    case "white": {
      const n = keep(loopNoise(ac, "white"));
      n.connect(keep(filter(ac, "lowpass", 8000))).connect(keep(gain(ac, 0.35))).connect(out);
      break;
    }
    case "brown": {
      const n = keep(loopNoise(ac, "brown"));
      n.connect(keep(gain(ac, 0.8))).connect(out);
      break;
    }
    case "rain": {
      const body = keep(loopNoise(ac, "pink"));
      body.connect(keep(filter(ac, "highpass", 500))).connect(keep(filter(ac, "lowpass", 5500))).connect(keep(gain(ac, 0.9))).connect(out);
      const patter = keep(loopNoise(ac, "white"));
      patter.connect(keep(filter(ac, "bandpass", 3200, 0.6))).connect(keep(gain(ac, 0.12))).connect(out);
      timers.push(every(30, 140, () => burst(ac, out, { freq: 2500 + Math.random() * 3000, type: "bandpass", q: 3, peak: 0.08 + Math.random() * 0.08, decay: 0.03 })));
      break;
    }
    case "thunder": {
      const bed = keep(loopNoise(ac, "brown"));
      bed.connect(keep(filter(ac, "lowpass", 160))).connect(keep(gain(ac, 0.15))).connect(out);
      timers.push(
        every(9000, 22000, () => {
          const src = ac.createBufferSource();
          src.buffer = noiseBuffer(ac, "brown");
          const f = filter(ac, "lowpass", 220 + Math.random() * 200);
          const g = gain(ac, 0);
          const t = ac.currentTime;
          g.gain.setValueAtTime(0, t);
          g.gain.linearRampToValueAtTime(1.4, t + 0.25 + Math.random() * 0.4);
          g.gain.exponentialRampToValueAtTime(0.0001, t + 4 + Math.random() * 3);
          src.connect(f).connect(g).connect(out);
          src.start(t, Math.random() * 3);
          src.stop(t + 8);
        }),
      );
      break;
    }
    case "wind": {
      const n = keep(loopNoise(ac, "pink"));
      const bp = keep(filter(ac, "bandpass", 500, 0.8));
      const g = keep(gain(ac, 0.7));
      nodes.push(lfo(ac, bp.frequency, 0.07, 280), lfo(ac, g.gain, 0.11, 0.35));
      n.connect(bp).connect(g).connect(out);
      break;
    }
    case "ocean": {
      const n = keep(loopNoise(ac, "brown"));
      const lp = keep(filter(ac, "lowpass", 700));
      const g = keep(gain(ac, 0.5));
      nodes.push(lfo(ac, g.gain, 0.1, 0.45), lfo(ac, lp.frequency, 0.1, 350));
      n.connect(lp).connect(g).connect(out);
      const foam = keep(loopNoise(ac, "pink"));
      const fg = keep(gain(ac, 0.08));
      nodes.push(lfo(ac, fg.gain, 0.1, 0.07));
      foam.connect(keep(filter(ac, "highpass", 1800))).connect(fg).connect(out);
      break;
    }
    case "fire": {
      const n = keep(loopNoise(ac, "brown"));
      n.connect(keep(filter(ac, "lowpass", 380))).connect(keep(gain(ac, 0.5))).connect(out);
      timers.push(every(40, 380, () => burst(ac, out, { freq: 1800 + Math.random() * 2500, type: "highpass", peak: 0.15 + Math.random() * 0.35, decay: 0.012 + Math.random() * 0.03 })));
      timers.push(every(1500, 5000, () => burst(ac, out, { freq: 900, type: "bandpass", q: 2, peak: 0.3, decay: 0.15 })));
      break;
    }
    case "cafe": {
      const n = keep(loopNoise(ac, "pink"));
      const bp = keep(filter(ac, "bandpass", 650, 0.9));
      const g = keep(gain(ac, 0.55));
      nodes.push(lfo(ac, g.gain, 0.23, 0.15), lfo(ac, bp.frequency, 0.17, 180));
      n.connect(bp).connect(g).connect(out);
      timers.push(
        every(2500, 7000, () => {
          const t = ac.currentTime;
          const osc = ac.createOscillator();
          const og = gain(ac, 0);
          osc.type = "sine";
          osc.frequency.value = 2600 + Math.random() * 2200;
          og.gain.setValueAtTime(0.05, t);
          og.gain.exponentialRampToValueAtTime(0.0001, t + 0.5);
          osc.connect(og).connect(out);
          osc.start(t);
          osc.stop(t + 0.55);
        }),
      );
      break;
    }
    case "birds": {
      const air = keep(loopNoise(ac, "pink"));
      air.connect(keep(filter(ac, "highpass", 2500))).connect(keep(gain(ac, 0.03))).connect(out);
      timers.push(
        every(700, 3200, () => {
          const base = 2200 + Math.random() * 2000;
          const chirps = 1 + Math.floor(Math.random() * 4);
          for (let i = 0; i < chirps; i++) {
            const t = ac.currentTime + i * (0.09 + Math.random() * 0.05);
            const osc = ac.createOscillator();
            const g = gain(ac, 0);
            osc.type = "sine";
            osc.frequency.setValueAtTime(base, t);
            osc.frequency.exponentialRampToValueAtTime(base * (1.3 + Math.random() * 0.5), t + 0.05);
            osc.frequency.exponentialRampToValueAtTime(base * 0.9, t + 0.09);
            g.gain.setValueAtTime(0, t);
            g.gain.linearRampToValueAtTime(0.06, t + 0.01);
            g.gain.exponentialRampToValueAtTime(0.0001, t + 0.1);
            const pan = ac.createStereoPanner();
            pan.pan.value = Math.random() * 1.6 - 0.8;
            osc.connect(g).connect(pan).connect(out);
            osc.start(t);
            osc.stop(t + 0.12);
          }
        }),
      );
      break;
    }
  }

  return () => {
    timers.forEach((t) => t());
    stopNodes(nodes);
  };
}
