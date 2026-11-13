"use client";

let ctx: AudioContext | null = null;

/** Lazily creates the shared AudioContext. Must be first called from a user gesture. */
export function getAudioContext(): AudioContext {
  if (!ctx) {
    const Ctor = window.AudioContext ?? (window as unknown as { webkitAudioContext: typeof AudioContext }).webkitAudioContext;
    ctx = new Ctor();
  }
  if (ctx.state === "suspended") void ctx.resume();
  return ctx;
}

const noiseCache = new Map<string, AudioBuffer>();

/** Looping noise buffers. Brown = deep rumble, pink = soft hiss, white = bright hiss. */
export function noiseBuffer(ac: AudioContext, kind: "white" | "pink" | "brown", seconds = 6): AudioBuffer {
  const key = `${kind}-${seconds}-${ac.sampleRate}`;
  const cached = noiseCache.get(key);
  if (cached) return cached;
  const len = Math.floor(ac.sampleRate * seconds);
  const buf = ac.createBuffer(2, len, ac.sampleRate);
  for (let ch = 0; ch < 2; ch++) {
    const d = buf.getChannelData(ch);
    let last = 0;
    let b0 = 0, b1 = 0, b2 = 0, b3 = 0, b4 = 0, b5 = 0, b6 = 0;
    for (let i = 0; i < len; i++) {
      const w = Math.random() * 2 - 1;
      if (kind === "white") d[i] = w * 0.5;
      else if (kind === "brown") {
        last = (last + 0.02 * w) / 1.02;
        d[i] = last * 3.5;
      } else {
        b0 = 0.99886 * b0 + w * 0.0555179;
        b1 = 0.99332 * b1 + w * 0.0750759;
        b2 = 0.969 * b2 + w * 0.153852;
        b3 = 0.8665 * b3 + w * 0.3104856;
        b4 = 0.55 * b4 + w * 0.5329522;
        b5 = -0.7616 * b5 - w * 0.016898;
        d[i] = (b0 + b1 + b2 + b3 + b4 + b5 + b6 + w * 0.5362) * 0.11;
        b6 = w * 0.115926;
      }
    }
    // Crossfade the loop seam to avoid clicks.
    const fade = Math.floor(ac.sampleRate * 0.05);
    for (let i = 0; i < fade; i++) {
      const t = i / fade;
      d[len - fade + i] = d[len - fade + i] * (1 - t) + d[i] * t;
    }
  }
  noiseCache.set(key, buf);
  return buf;
}

export function loopNoise(ac: AudioContext, kind: "white" | "pink" | "brown") {
  const src = ac.createBufferSource();
  src.buffer = noiseBuffer(ac, kind);
  src.loop = true;
  // Random start offset so layered noises don't phase together.
  src.start(0, Math.random() * 5);
  return src;
}

export function filter(ac: AudioContext, type: BiquadFilterType, frequency: number, Q = 0.7) {
  const f = ac.createBiquadFilter();
  f.type = type;
  f.frequency.value = frequency;
  f.Q.value = Q;
  return f;
}

export function gain(ac: AudioContext, value: number) {
  const g = ac.createGain();
  g.gain.value = value;
  return g;
}

/** Slow sine LFO connected to an AudioParam: param = center ± depth. */
export function lfo(ac: AudioContext, target: AudioParam, rateHz: number, depth: number) {
  const osc = ac.createOscillator();
  osc.frequency.value = rateHz;
  const g = gain(ac, depth);
  osc.connect(g).connect(target);
  osc.start();
  return osc;
}

/** Simple feedback delay used as a cheap "room". */
export function space(ac: AudioContext, time = 0.32, feedback = 0.35, wet = 0.3) {
  const input = gain(ac, 1);
  const output = gain(ac, 1);
  const delay = ac.createDelay(2);
  delay.delayTime.value = time;
  const fb = gain(ac, feedback);
  const tone = filter(ac, "lowpass", 2400);
  const wetG = gain(ac, wet);
  input.connect(output);
  input.connect(delay);
  delay.connect(tone).connect(fb).connect(delay);
  tone.connect(wetG).connect(output);
  return { input, output };
}
