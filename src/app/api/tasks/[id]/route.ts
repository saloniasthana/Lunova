import { db } from "@/lib/db";
import { HttpError, ok, parseBody, requireUserId, route, type IdParams } from "@/lib/api";
import { taskUpdateSchema } from "@/lib/validation";
import { loadTask } from "@/server/serialize";
import { assertRefsOwned } from "@/server/ownership";

export const GET = route<IdParams>(async (_req, { params }) => {
  const userId = await requireUserId();
  const { id } = await params;
  const task = await loadTask(userId, id);
  if (!task) throw new HttpError(404, "We couldn't find that task.");
  return ok(task);
});

export const PATCH = route<IdParams>(async (req, { params }) => {
  const userId = await requireUserId();
  const { id } = await params;
  const existing = await db.task.findFirst({ where: { id, userId } });
  if (!existing) throw new HttpError(404, "We couldn't find that task.");

  const { subtasks, ...data } = await parseBody(req, taskUpdateSchema);
  await assertRefsOwned(userId, data.categoryId, data.projectId);

  const completedAt =
    data.status === undefined ? undefined : data.status === "DONE" ? existing.completedAt ?? new Date() : null;

  await db.$transaction(async (tx) => {
    await tx.task.update({ where: { id }, data: { ...data, completedAt } });
    if (subtasks) {
      // Replace the subtask list: keep ids that still exist, create new ones, drop removed.
      const keep = subtasks.filter((s) => s.id).map((s) => s.id!);
      await tx.subtask.deleteMany({ where: { taskId: id, id: { notIn: keep } } });
      for (const s of subtasks) {
        if (s.id) {
          await tx.subtask.updateMany({
            where: { id: s.id, taskId: id },
            data: { title: s.title, completed: s.completed ?? false },
          });
        } else {
          await tx.subtask.create({ data: { taskId: id, title: s.title, completed: s.completed ?? false } });
        }
      }
    }
  });

  return ok(await loadTask(userId, id));
});

export const DELETE = route<IdParams>(async (_req, { params }) => {
  const userId = await requireUserId();
  const { id } = await params;
  const { count } = await db.task.deleteMany({ where: { id, userId } });
  if (!count) throw new HttpError(404, "We couldn't find that task.");
  return ok({ id });
});
