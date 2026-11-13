import { db } from "@/lib/db";
import { HttpError, ok, parseBody, requireUserId, route, type IdParams } from "@/lib/api";
import { timeBlockUpdateSchema } from "@/lib/validation";
import { assertTaskOwned } from "@/server/ownership";
import { stripUser } from "@/server/serialize";

export const PATCH = route<IdParams>(async (req, { params }) => {
  const userId = await requireUserId();
  const { id } = await params;
  const data = await parseBody(req, timeBlockUpdateSchema);
  await assertTaskOwned(userId, data.taskId);
  const existing = await db.timeBlock.findFirst({ where: { id, userId } });
  if (!existing) throw new HttpError(404, "We couldn't find that block.");

  const next = { ...existing, ...data };
  if (next.endMin <= next.startMin) throw new HttpError(422, "End must be after start.");
  const clash = await db.timeBlock.findFirst({
    where: { userId, date: next.date, id: { not: id }, startMin: { lt: next.endMin }, endMin: { gt: next.startMin } },
  });
  if (clash) throw new HttpError(409, `That overlaps with "${clash.title}".`);

  const row = await db.timeBlock.update({ where: { id }, data });
  return ok(stripUser(row));
});

export const DELETE = route<IdParams>(async (_req, { params }) => {
  const userId = await requireUserId();
  const { id } = await params;
  const { count } = await db.timeBlock.deleteMany({ where: { id, userId } });
  if (!count) throw new HttpError(404, "We couldn't find that block.");
  return ok({ id });
});
