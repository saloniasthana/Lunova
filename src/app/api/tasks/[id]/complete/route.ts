import { db } from "@/lib/db";
import { HttpError, ok, requireUserId, route, type IdParams } from "@/lib/api";
import { loadTask } from "@/server/serialize";

/** Toggles completion. Body: { completed: boolean } (defaults to true). */
export const POST = route<IdParams>(async (req, { params }) => {
  const userId = await requireUserId();
  const { id } = await params;
  const body = (await req.json().catch(() => ({}))) as { completed?: unknown };
  const completed = body.completed !== false;
  const { count } = await db.task.updateMany({
    where: { id, userId },
    data: { status: completed ? "DONE" : "TODO", completedAt: completed ? new Date() : null },
  });
  if (!count) throw new HttpError(404, "We couldn't find that task.");
  return ok(await loadTask(userId, id));
});
