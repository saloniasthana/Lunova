import { db } from "@/lib/db";
import { HttpError, ok, requireUserId, route, type IdParams } from "@/lib/api";
import { serializeTask, taskInclude } from "@/server/serialize";

export const POST = route<IdParams>(async (_req, { params }) => {
  const userId = await requireUserId();
  const { id } = await params;
  const src = await db.task.findFirst({ where: { id, userId }, include: taskInclude });
  if (!src) throw new HttpError(404, "We couldn't find that task.");

  const copy = await db.task.create({
    data: {
      userId,
      title: `${src.title} (copy)`,
      description: src.description,
      notes: src.notes,
      priority: src.priority,
      categoryId: src.categoryId,
      projectId: src.projectId,
      dueDate: src.dueDate,
      dueTime: src.dueTime,
      estimatedDuration: src.estimatedDuration,
      tags: src.tags,
      position: src.position,
      subtasks: { create: src.subtasks.map((s) => ({ title: s.title, completed: false })) },
    },
    include: taskInclude,
  });
  return ok(serializeTask(copy, 0), 201);
});
