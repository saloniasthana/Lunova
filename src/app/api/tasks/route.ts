import { db } from "@/lib/db";
import { ok, parseBody, requireUserId, route } from "@/lib/api";
import { taskCreateSchema } from "@/lib/validation";
import { assertRefsOwned } from "@/server/ownership";
import { focusSecondsByTask, serializeTask, taskInclude } from "@/server/serialize";

export const GET = route(async () => {
  const userId = await requireUserId();
  const [tasks, focus] = await Promise.all([
    db.task.findMany({ where: { userId }, include: taskInclude, orderBy: [{ position: "asc" }, { createdAt: "desc" }] }),
    focusSecondsByTask(userId),
  ]);
  return ok(tasks.map((t) => serializeTask(t, focus.get(t.id) ?? 0)));
});

export const POST = route(async (req) => {
  const userId = await requireUserId();
  const { subtasks, ...data } = await parseBody(req, taskCreateSchema);
  await assertRefsOwned(userId, data.categoryId, data.projectId);

  const min = await db.task.aggregate({ where: { userId }, _min: { position: true } });
  const task = await db.task.create({
    data: {
      ...data,
      userId,
      position: (min._min.position ?? 0) - 1,
      subtasks: subtasks?.length
        ? { create: subtasks.map((s) => ({ title: s.title, completed: s.completed ?? false })) }
        : undefined,
    },
    include: taskInclude,
  });
  return ok(serializeTask(task, 0), 201);
});
