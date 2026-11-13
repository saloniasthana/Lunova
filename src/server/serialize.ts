import "server-only";
import type { Prisma } from "@prisma/client";
import { db } from "@/lib/db";

export const taskInclude = { subtasks: { orderBy: { createdAt: "asc" } } } satisfies Prisma.TaskInclude;
type TaskWithSubtasks = Prisma.TaskGetPayload<{ include: typeof taskInclude }>;

export async function focusSecondsByTask(userId: string, taskIds?: string[]) {
  const rows = await db.focusSession.groupBy({
    by: ["taskId"],
    where: { userId, sessionType: "FOCUS", taskId: taskIds ? { in: taskIds } : { not: null } },
    _sum: { actualDuration: true },
  });
  const map = new Map<string, number>();
  for (const r of rows) if (r.taskId) map.set(r.taskId, r._sum.actualDuration ?? 0);
  return map;
}

export function serializeTask(t: TaskWithSubtasks, focusSeconds = 0) {
  const { userId: _u, ...rest } = t;
  void _u;
  return {
    ...rest,
    subtasks: t.subtasks.map(({ id, taskId, title, completed }) => ({ id, taskId, title, completed })),
    focusSeconds,
  };
}

export async function loadTask(userId: string, id: string) {
  const t = await db.task.findFirst({ where: { id, userId }, include: taskInclude });
  if (!t) return null;
  const focus = await focusSecondsByTask(userId, [id]);
  return serializeTask(t, focus.get(id) ?? 0);
}

export const habitInclude = { completions: { select: { completionDate: true } } } satisfies Prisma.HabitInclude;
type HabitWithCompletions = Prisma.HabitGetPayload<{ include: typeof habitInclude }>;

export function serializeHabit(h: HabitWithCompletions) {
  const { userId: _u, completions, ...rest } = h;
  void _u;
  return { ...rest, completions: completions.map((c) => c.completionDate).sort() };
}

export function stripUser<T extends { userId: string }>(row: T): Omit<T, "userId"> {
  const { userId: _u, ...rest } = row;
  void _u;
  return rest;
}
