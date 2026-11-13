import type { Task, TimeBlock } from "@/types";
import { PRIORITY_META } from "./utils";

export interface Suggestion {
  taskId: string;
  title: string;
  startMin: number;
  endMin: number;
  reason: string;
}

interface PlanInput {
  date: string;
  today: string;
  nowMin: number;
  tasks: Task[];
  blocks: TimeBlock[]; // existing blocks for `date`
  workStartMin: number;
  workEndMin: number;
  breakMin?: number;
  defaultDuration?: number;
}

const roundUp = (m: number, step = 15) => Math.ceil(m / step) * step;

/**
 * Deterministic day planner (no AI required):
 * 1. Pick open tasks not yet scheduled on this day (due on/before the day, or undated).
 * 2. Sort by priority, then deadline, then shorter tasks first.
 * 3. Walk the free gaps inside working hours and place each task, with a short break after.
 * Never overlaps existing blocks. Tasks that don't fit are skipped.
 */
export function planDay(input: PlanInput): { suggestions: Suggestion[]; skipped: Task[] } {
  const { date, today, nowMin, tasks, blocks, workStartMin, workEndMin, breakMin = 10, defaultDuration = 30 } = input;
  const scheduledTaskIds = new Set(blocks.map((b) => b.taskId).filter(Boolean));

  const candidates = tasks
    .filter((t) => t.status !== "DONE" && !scheduledTaskIds.has(t.id) && (!t.dueDate || t.dueDate <= date))
    .sort((a, b) => {
      const p = PRIORITY_META[b.priority].rank - PRIORITY_META[a.priority].rank;
      if (p) return p;
      const da = a.dueDate ?? "9999-99-99";
      const dbb = b.dueDate ?? "9999-99-99";
      if (da !== dbb) return da.localeCompare(dbb);
      return (a.estimatedDuration ?? defaultDuration) - (b.estimatedDuration ?? defaultDuration);
    });

  // Busy intervals, sorted.
  const busy = blocks.map((b) => [b.startMin, b.endMin] as [number, number]).sort((a, b) => a[0] - b[0]);
  let cursorStart = workStartMin;
  if (date === today) cursorStart = Math.max(workStartMin, roundUp(nowMin + 5));
  if (date < today) return { suggestions: [], skipped: candidates };

  const isFree = (s: number, e: number) => busy.every(([bs, be]) => e <= bs || s >= be);
  const suggestions: Suggestion[] = [];
  const skipped: Task[] = [];

  for (const t of candidates) {
    const dur = Math.min(t.estimatedDuration ?? defaultDuration, workEndMin - workStartMin);
    let placed = false;
    for (let s = cursorStart; s + dur <= workEndMin; s += 15) {
      if (isFree(s, s + dur)) {
        const reason =
          t.dueDate && t.dueDate < date
            ? "Overdue"
            : t.priority === "URGENT" || t.priority === "HIGH"
              ? `${PRIORITY_META[t.priority].label} priority`
              : t.dueDate === date
                ? "Due today"
                : "Fits your free time";
        suggestions.push({ taskId: t.id, title: t.title, startMin: s, endMin: s + dur, reason });
        busy.push([s, s + dur + breakMin]);
        busy.sort((a, b) => a[0] - b[0]);
        placed = true;
        break;
      }
    }
    if (!placed) skipped.push(t);
  }
  return { suggestions: suggestions.sort((a, b) => a.startMin - b.startMin), skipped };
}

/** First free slot of `dur` minutes on a day, from `from` onwards. */
export function firstFreeSlot(blocks: TimeBlock[], dur: number, from: number, until = 24 * 60) {
  for (let s = roundUp(from); s + dur <= until; s += 15) {
    if (blocks.every((b) => s + dur <= b.startMin || s >= b.endMin)) return s;
  }
  return null;
}
