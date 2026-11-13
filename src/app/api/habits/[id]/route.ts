import { db } from "@/lib/db";
import { HttpError, ok, parseBody, requireUserId, route, type IdParams } from "@/lib/api";
import { habitUpdateSchema } from "@/lib/validation";
import { habitInclude, serializeHabit } from "@/server/serialize";

export const PATCH = route<IdParams>(async (req, { params }) => {
  const userId = await requireUserId();
  const { id } = await params;
  const data = await parseBody(req, habitUpdateSchema);
  const { count } = await db.habit.updateMany({ where: { id, userId }, data });
  if (!count) throw new HttpError(404, "We couldn't find that habit.");
  return ok(serializeHabit(await db.habit.findUniqueOrThrow({ where: { id }, include: habitInclude })));
});

export const DELETE = route<IdParams>(async (_req, { params }) => {
  const userId = await requireUserId();
  const { id } = await params;
  const { count } = await db.habit.deleteMany({ where: { id, userId } });
  if (!count) throw new HttpError(404, "We couldn't find that habit.");
  return ok({ id });
});
