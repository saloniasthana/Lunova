/** Date helpers that work in the user's *local* calendar (not UTC). */

export function toDateKey(d: Date = new Date()): string {
  const y = d.getFullYear();
  const m = String(d.getMonth() + 1).padStart(2, "0");
  const day = String(d.getDate()).padStart(2, "0");
  return `${y}-${m}-${day}`;
}

export function fromDateKey(key: string): Date {
  const [y, m, d] = key.split("-").map(Number);
  return new Date(y, m - 1, d);
}

export function addDays(key: string, n: number): string {
  const d = fromDateKey(key);
  d.setDate(d.getDate() + n);
  return toDateKey(d);
}

export function todayKey() {
  return toDateKey(new Date());
}

export function startOfWeekKey(key: string, weekStartsOn = 1): string {
  const d = fromDateKey(key);
  const diff = (d.getDay() - weekStartsOn + 7) % 7;
  d.setDate(d.getDate() - diff);
  return toDateKey(d);
}

export function rangeKeys(from: string, to: string): string[] {
  const out: string[] = [];
  let k = from;
  while (k <= to) {
    out.push(k);
    k = addDays(k, 1);
  }
  return out;
}

export function formatDuration(seconds: number): string {
  const mins = Math.round(seconds / 60);
  if (mins < 60) return `${mins}m`;
  const h = Math.floor(mins / 60);
  const m = mins % 60;
  return m ? `${h}h ${m}m` : `${h}h`;
}

export function formatClock(totalSeconds: number): string {
  const s = Math.max(0, Math.ceil(totalSeconds));
  const h = Math.floor(s / 3600);
  const m = Math.floor((s % 3600) / 60);
  const sec = s % 60;
  const mm = String(m).padStart(2, "0");
  const ss = String(sec).padStart(2, "0");
  return h ? `${h}:${mm}:${ss}` : `${mm}:${ss}`;
}

export function minToTime(min: number): string {
  const h = Math.floor(min / 60) % 24;
  const m = min % 60;
  return `${String(h).padStart(2, "0")}:${String(m).padStart(2, "0")}`;
}

export function timeToMin(t: string): number {
  const [h, m] = t.split(":").map(Number);
  return h * 60 + m;
}

export function minToLabel(min: number): string {
  const h = Math.floor(min / 60) % 24;
  const m = min % 60;
  const suffix = h >= 12 ? "PM" : "AM";
  const h12 = h % 12 || 12;
  return m ? `${h12}:${String(m).padStart(2, "0")} ${suffix}` : `${h12} ${suffix}`;
}

export function prettyDate(key: string, opts: Intl.DateTimeFormatOptions = { weekday: "long", month: "long", day: "numeric" }) {
  return fromDateKey(key).toLocaleDateString(undefined, opts);
}

export function relativeDay(key: string): string {
  const t = todayKey();
  if (key === t) return "Today";
  if (key === addDays(t, 1)) return "Tomorrow";
  if (key === addDays(t, -1)) return "Yesterday";
  return prettyDate(key, { month: "short", day: "numeric" });
}

export function greeting(d = new Date()): string {
  const h = d.getHours();
  if (h < 12) return "Good morning";
  if (h < 18) return "Good afternoon";
  return "Good evening";
}
