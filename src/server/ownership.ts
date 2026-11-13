import "server-only";
import { db } from "@/lib/db";
import { HttpError } from "@/lib/api";

export async function assertRefsOwned(userId: string, categoryId?: string | null, projectId?: string | null) {
  if (categoryId) {
    const c = await db.category.findFirst({ where: { id: categoryId, userId }, select: { id: true } });
    if (!c) throw new HttpError(422, "That category doesn't exist.");
  }
  if (projectId) {
    const p = await db.project.findFirst({ where: { id: projectId, userId }, select: { id: true } });
    if (!p) throw new HttpError(422, "That project doesn't exist.");
  }
}

export async function assertTaskOwned(userId: string, taskId?: string | null) {
  if (!taskId) return;
  const t = await db.task.findFirst({ where: { id: taskId, userId }, select: { id: true } });
  if (!t) throw new HttpError(422, "That task doesn't exist.");
}
