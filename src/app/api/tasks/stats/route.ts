import { db } from "@/lib/db";
import { ok, requireUserId, route } from "@/lib/api";

export const GET = route(async () => {
  const userId = await requireUserId();
  const [total, done, byPriority] = await Promise.all([
    db.task.count({ where: { userId } }),
    db.task.count({ where: { userId, status: "DONE" } }),
    db.task.groupBy({ by: ["priority"], where: { userId, status: "TODO" }, _count: true }),
  ]);
  return ok({
    total,
    completed: done,
    pending: total - done,
    pendingByPriority: Object.fromEntries(byPriority.map((p) => [p.priority, p._count])),
  });
});
