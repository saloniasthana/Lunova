export const QUOTES = [
  "Small steps still move you forward.",
  "You're doing better than you think.",
  "Slow progress is still progress.",
  "Rest is part of the work.",
  "One thing at a time, gently.",
  "Done is a lovely word.",
  "Make space for what matters.",
  "Today is a blank page — write something kind on it.",
  "Focus on the step in front of you.",
  "Little by little, a little becomes a lot.",
  "Consistency over intensity.",
  "Be proud of how far you've come.",
  "Breathe in focus, breathe out worry.",
  "Your pace is the right pace.",
];

/** Stable quote for a given day. */
export function quoteOfTheDay(dateKey: string) {
  let h = 0;
  for (const ch of dateKey) h = (h * 31 + ch.charCodeAt(0)) >>> 0;
  return h % QUOTES.length;
}
