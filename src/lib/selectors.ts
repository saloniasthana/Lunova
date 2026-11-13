import type { FocusSession, Habit, Task } from "@/types";
import { addDays, fromDateKey, toDateKey, todayKey } from "./dates";
import { PRIORITY_META } from "./utils";

// ───────────────────────── Tasks ─────────────────────────

export type TaskView = "all" | "today" | "upcoming" | "completed" | "overdue" | "priority";

export function isOverdue(t: Task, today = todayKey()) {
  if (t.status === "DONE" || !t.dueDate) return false;
  if (t.dueDate < today) return true;
  if (t.dueDate === today && t.dueTime) {
    const now = new Date();
    const hm = `${String(now.getHours()).padStart(2, "0")}:${String(now.getMinutes()).padStart(2, "0")}`;
    return t.dueTime < hm;
  }
  return false;
}

export function filterByView(tasks: Task[], view: TaskView, today = todayKey()) {
  switch (view) {
    case "today":
      return todaysTasks(tasks, today);
    case "upcoming":
      return tasks.filter((t) => t.status !== "DONE" && t.dueDate !== null && t.dueDate > today);
    case "completed":
      return tasks.filter((t) => t.status === "DONE");
    case "overdue":
      return tasks.filter((t) => isOverdue(t, today));
    case "priority":
      return tasks.filter((t) => t.status !== "DONE" && (t.priority === "HIGH" || t.priority === "URGENT"));
    default:
      return tasks;
  }
}

export type TaskSort = "smart" | "due" | "priority" | "created" | "alpha";

export function sortTasks(tasks: Task[], sort: TaskSort) {
  const list = [...tasks];
  const due = (t: Task) => (t.dueDate ? `${t.dueDate} ${t.dueTime ?? "99:99"}` : "9999");
  switch (sort) {
    case "due":
      return list.sort((a, b) => due(a).localeCompare(due(b)));
    case "priority":
      return list.sort((a, b) => PRIORITY_META[b.priority].rank - PRIORITY_META[a.priority].rank || due(a).localeCompare(due(b)));
    case "created":
      return list.sort((a, b) => b.createdAt.localeCompare(a.createdAt));
    case "alpha":
      return list.sort((a, b) => a.title.localeCompare(b.title));
    default:
      // Open tasks first (manual order), finished tasks last.
      return list.sort((a, b) => Number(a.status === "DONE") - Number(b.status === "DONE") || a.position - b.position);
  }
}

/** Tasks that belong to "today" — due today or overdue and still open. */
export function todaysTasks(tasks: Task[], today = todayKey()) {
  return tasks.filter(
    (t) => t.dueDate === today || (t.status !== "DONE" && t.dueDate !== null && t.dueDate < today) || (t.status === "DONE" && t.completedAt && toDateKey(new Date(t.completedAt)) === today && !t.dueDate),
  );
}

// ───────────────────────── Focus ─────────────────────────

export function focusSessions(sessions: FocusSession[]) {
  return sessions.filter((s) => s.sessionType === "FOCUS");
}

export function sessionDateKey(s: FocusSession) {
  return toDateKey(new Date(s.startedAt));
}

export function focusSecondsOn(sessions: FocusSession[], key: string) {
  return focusSessions(sessions)
    .filter((s) => sessionDateKey(s) === key)
    .reduce((sum, s) => sum + s.actualDuration, 0);
}

export function focusSecondsBetween(sessions: FocusSession[], from: string, to: string) {
  return focusSessions(sessions)
    .filter((s) => {
      const k = sessionDateKey(s);
      return k >= from && k <= to;
    })
    .reduce((sum, s) => sum + s.actualDuration, 0);
}

/** A "productive day" = at least one focus session or one completed task. */
export function productiveDays(sessions: FocusSession[], tasks: Task[]) {
  const days = new Set<string>();
  for (const s of focusSessions(sessions)) if (s.actualDuration >= 60) days.add(sessionDateKey(s));
  for (const t of tasks) if (t.completedAt) days.add(toDateKey(new Date(t.completedAt)));
  return days;
}

/** Consecutive productive days ending today (or yesterday, so a streak isn't "lost" before you start today). */
export function currentStreak(days: Set<string>, today = todayKey()) {
  let k = days.has(today) ? today : addDays(today, -1);
  let n = 0;
  while (days.has(k)) {
    n++;
    k = addDays(k, -1);
  }
  return n;
}

export function longestStreak(days: Set<string>) {
  const sorted = [...days].sort();
  let best = 0;
  let run = 0;
  let prev: string | null = null;
  for (const d of sorted) {
    run = prev && addDays(prev, 1) === d ? run + 1 : 1;
    best = Math.max(best, run);
    prev = d;
  }
  return best;
}

// ───────────────────────── Habits ─────────────────────────

export function isHabitScheduled(h: Habit, key: string) {
  if (key < h.startDate) return false;
  const dow = fromDateKey(key).getDay();
  switch (h.frequency) {
    case "weekdays":
      return dow >= 1 && dow <= 5;
    case "weekends":
      return dow === 0 || dow === 6;
    case "custom":
      return h.days.includes(dow);
    default:
      return true;
  }
}

export function habitStats(h: Habit, today = todayKey()) {
  const done = new Set(h.completions);
  // Current streak: walk back over scheduled days; today not yet done doesn't break it.
  let streak = 0;
  let k = today;
  if (isHabitScheduled(h, k) && !done.has(k)) k = addDays(k, -1);
  for (let i = 0; i < 800 && k >= h.startDate; i++) {
    if (isHabitScheduled(h, k)) {
      if (done.has(k)) streak++;
      else break;
    }
    k = addDays(k, -1);
  }

  let longest = 0;
  let run = 0;
  k = h.startDate;
  for (let i = 0; i < 2000 && k <= today; i++) {
    if (isHabitScheduled(h, k)) {
      if (done.has(k)) {
        run++;
        longest = Math.max(longest, run);
      } else if (k !== today) run = 0;
    }
    k = addDays(k, 1);
  }

  const rate = (days: number) => {
    let scheduled = 0;
    let hit = 0;
    for (let i = 0; i < days; i++) {
      const d = addDays(today, -i);
      if (d < h.startDate) break;
      if (!isHabitScheduled(h, d)) continue;
      if (d === today && !done.has(d)) continue;
      scheduled++;
      if (done.has(d)) hit++;
    }
    return scheduled ? hit / scheduled : 0;
  };

  return { streak, longest, week: rate(7), month: rate(30), total: h.completions.length };
}
