"use client";

import { getAudioContext } from "./context";

/** A soft two-note bell, synthesised so no audio file is needed. */
export function playChime(volume = 0.6) {
  try {
    const ac = getAudioContext();
    const now = ac.currentTime;
    const notes = [880, 1318.5, 1760];
    notes.forEach((freq, i) => {
      const t = now + i * 0.18;
      const osc = ac.createOscillator();
      const g = ac.createGain();
      osc.type = "sine";
      osc.frequency.value = freq;
      g.gain.setValueAtTime(0, t);
      g.gain.linearRampToValueAtTime(0.18 * volume, t + 0.01);
      g.gain.exponentialRampToValueAtTime(0.0001, t + 1.8);
      osc.connect(g).connect(ac.destination);
      osc.start(t);
      osc.stop(t + 1.9);
    });
  } catch {
    /* audio unavailable */
  }
}
