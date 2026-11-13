import { db } from "@/lib/db";
import { HttpError, ok, parseBody, requireUserId, route, type IdParams } from "@/lib/api";
import { eventUpdateSchema } from "@/lib/validation";
import { assertTaskOwned } from "@/server/ownership";
import { stripUser } from "@/server/serialize";

export const PATCH = route<IdParams>(async (req, { params }) => {
  const userId = await requireUserId();
  const { id } = await params;
  const data = await parseBody(req, eventUpdateSchema);
  await assertTaskOwned(userId, data.taskId);
  const existing = await db.calendarEvent.findFirst({ where: { id, userId } });
  if (!existing) throw new HttpError(404, "We couldn't find that event.");
  const start = data.startDateTime ?? existing.startDateTime;
  const end = data.endDateTime ?? existing.endDateTime;
  if (end <= start) throw new HttpError(422, "End must be after start.");
  const row = await db.calendarEvent.update({ where: { id }, data });
  return ok(stripUser(row));
});

export const DELETE = route<IdParams>(async (_req, { params }) => {
  const userId = await requireUserId();
  const { id } = await params;
  const { count } = await db.calendarEvent.deleteMany({ where: { id, userId } });
  if (!count) throw new HttpError(404, "We couldn't find that event.");
  return ok({ id });
});
