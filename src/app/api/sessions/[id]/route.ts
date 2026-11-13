import { z } from "zod";
import { db } from "@/lib/db";
import { HttpError, ok, parseBody, requireUserId, route, type IdParams } from "@/lib/api";
import { assertTaskOwned } from "@/server/ownership";
import { stripUser } from "@/server/serialize";

const patchSchema = z.object({ taskId: z.string().nullable().optional(), completed: z.boolean().optional() });

export const PATCH = route<IdParams>(async (req, { params }) => {
  const userId = await requireUserId();
  const { id } = await params;
  const data = await parseBody(req, patchSchema);
  await assertTaskOwned(userId, data.taskId);
  const { count } = await db.focusSession.updateMany({ where: { id, userId }, data });
  if (!count) throw new HttpError(404, "We couldn't find that session.");
  return ok(stripUser(await db.focusSession.findUniqueOrThrow({ where: { id } })));
});

export const DELETE = route<IdParams>(async (_req, { params }) => {
  const userId = await requireUserId();
  const { id } = await params;
  const { count } = await db.focusSession.deleteMany({ where: { id, userId } });
  if (!count) throw new HttpError(404, "We couldn't find that session.");
  return ok({ id });
});
