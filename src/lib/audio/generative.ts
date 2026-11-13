"use client";

import { filter, gain, loopNoise, space } from "./context";

/**
 * Generative music played live in the browser — original, royalty-free,
 * and never the same twice.
 */
export type GeneratorId = "piano" | "lofi" | "sleepy";

type Stop = () => void;

const midi = (n: number) => 440 * Math.pow(2, (n - 69) / 12);

function keyNote(ac: AudioContext, out: AudioNode, freq: number, t: number, vel: number, decay = 2.4) {
  const g = gain(ac, 0);
  g.gain.setValueAtTime(0, t);
  g.gain.linearRampToValueAtTime(vel, t + 0.008);
  g.gain.exponentialRampToValueAtTime(vel * 0.35, t + 0.25);
  g.gain.exponentialRampToValueAtTime(0.0001, t + decay);
  const lp = filter(ac, "lowpass", 1800 + freq * 1.5);
  const a = ac.createOscillator();
  a.type = "triangle";
  a.frequency.value = freq;
  const b = ac.createOscillator();
  b.type = "sine";
  b.frequency.value = freq * 2.001;
  const bg = gain(ac, 0.18);
  a.connect(lp);
  b.connect(bg).connect(lp);
  lp.connect(g).connect(out);
  a.start(t);
  b.start(t);
  a.stop(t + decay + 0.1);
  b.stop(t + decay + 0.1);
}

/** Lookahead scheduler: calls `tick(time)` for each step ahead of the audio clock. */
function scheduler(ac: AudioContext, stepSec: () => number, tick: (time: number, step: number) => void): Stop {
  let next = ac.currentTime + 0.1;
  let step = 0;
  const id = window.setInterval(() => {
    while (next < ac.currentTime + 0.25) {
      tick(next, step++);
      next += stepSec();
    }
  }, 50);
  return () => window.clearInterval(id);
}

function piano(ac: AudioContext, out: AudioNode): Stop {
  const room = space(ac, 0.42, 0.42, 0.35);
  room.output.connect(out);
  const scale = [0, 2, 4, 7, 9]; // major pentatonic
  const roots = [60, 57, 65, 62]; // C, A, F, D
  let bar = 0;
  return scheduler(
    ac,
    () => 0.5,
    (t, step) => {
      if (step % 16 === 0) {
        const r = roots[bar++ % roots.length];
        [r - 12, r - 5, r].forEach((n, i) => keyNote(ac, room.input, midi(n), t + i * 0.04, 0.06, 4));
      }
      if (Math.random() < 0.55) {
        const deg = scale[Math.floor(Math.random() * scale.length)];
        const oct = Math.random() < 0.6 ? 72 : 84;
        keyNote(ac, room.input, midi(oct + deg), t + Math.random() * 0.06, 0.05 + Math.random() * 0.05, 2.6);
      }
    },
  );
}

function sleepy(ac: AudioContext, out: AudioNode): Stop {
  const room = space(ac, 0.6, 0.5, 0.4);
  const lp = filter(ac, "lowpass", 900);
  lp.connect(room.input);
  room.output.connect(out);
  const chords = [
    [48, 55, 64, 71],
    [45, 52, 60, 67],
    [41, 48, 57, 64],
    [43, 50, 59, 66],
  ];
  let i = 0;
  return scheduler(
    ac,
    () => 8,
    (t) => {
      const chord = chords[i++ % chords.length];
      chord.forEach((n) => {
        [0, 4].forEach((detune) => {
          const o = ac.createOscillator();
          o.type = "sine";
          o.frequency.value = midi(n);
          o.detune.value = detune;
          const g = gain(ac, 0);
          g.gain.setValueAtTime(0, t);
          g.gain.linearRampToValueAtTime(0.03, t + 3);
          g.gain.linearRampToValueAtTime(0.0, t + 10);
          o.connect(g).connect(lp);
          o.start(t);
          o.stop(t + 10.5);
        });
      });
    },
  );
}

function lofi(ac: AudioContext, out: AudioNode): Stop {
  const bus = gain(ac, 0.9);
  const warm = filter(ac, "lowpass", 2600);
  bus.connect(warm).connect(out);
  // Vinyl crackle bed
  const vinyl = loopNoise(ac, "pink");
  const vg = gain(ac, 0.025);
  vinyl.connect(filter(ac, "bandpass", 1800, 0.5)).connect(vg).connect(out);

  const bpm = 74;
  const sixteenth = 60 / bpm / 4;
  const chords = [
    [62, 65, 69, 72], // Dm7
    [55, 59, 62, 65], // G7
    [60, 64, 67, 71], // Cmaj7
    [57, 60, 64, 67], // Am7
  ];

  const kick = (t: number) => {
    const o = ac.createOscillator();
    const g = gain(ac, 0);
    o.frequency.setValueAtTime(120, t);
    o.frequency.exponentialRampToValueAtTime(45, t + 0.15);
    g.gain.setValueAtTime(0.5, t);
    g.gain.exponentialRampToValueAtTime(0.0001, t + 0.35);
    o.connect(g).connect(bus);
    o.start(t);
    o.stop(t + 0.4);
  };
  const noiseHit = (t: number, f: number, type: BiquadFilterType, peak: number, decay: number) => {
    const src = ac.createBufferSource();
    src.buffer = vinyl.buffer;
    const g = gain(ac, 0);
    g.gain.setValueAtTime(peak, t);
    g.gain.exponentialRampToValueAtTime(0.0001, t + decay);
    src.connect(filter(ac, type, f, 0.8)).connect(g).connect(bus);
    src.start(t, Math.random() * 4);
    src.stop(t + decay + 0.05);
  };

  const stopSched = scheduler(
    ac,
    () => sixteenth,
    (t, step) => {
      const s = step % 16;
      const swing = s % 2 === 1 ? sixteenth * 0.18 : 0;
      const tt = t + swing;
      if (s === 0 || s === 10) kick(tt);
      if (s === 4 || s === 12) noiseHit(tt, 1800, "bandpass", 0.35, 0.18);
      if (s % 2 === 0) noiseHit(tt, 7000, "highpass", s % 4 === 2 ? 0.12 : 0.06, 0.05);
      if (s === 0) {
        const chord = chords[Math.floor(step / 16) % chords.length];
        chord.forEach((n, i) => keyNote(ac, bus, midi(n), tt + i * 0.015, 0.045, sixteenth * 15));
        keyNote(ac, bus, midi(chord[0] - 24), tt, 0.09, sixteenth * 12);
      }
      if (s === 7 && Math.random() < 0.5) {
        const chord = chords[Math.floor(step / 16) % chords.length];
        keyNote(ac, bus, midi(chord[Math.floor(Math.random() * 4)] + 12), tt, 0.035, 1.2);
      }
    },
  );
  return () => {
    stopSched();
    try {
      vinyl.stop();
    } catch {
      /* already stopped */
    }
  };
}

export function startGenerator(ac: AudioContext, id: GeneratorId, out: AudioNode): Stop {
  const local = gain(ac, 1);
  local.connect(out);
  const stop = id === "piano" ? piano(ac, local) : id === "sleepy" ? sleepy(ac, local) : lofi(ac, local);
  return () => {
    stop();
    // Fade out tails, then detach.
    const t = ac.currentTime;
    local.gain.setValueAtTime(local.gain.value, t);
    local.gain.linearRampToValueAtTime(0, t + 0.4);
    window.setTimeout(() => local.disconnect(), 600);
  };
}
