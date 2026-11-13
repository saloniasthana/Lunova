import { db } from "@/lib/db";
import { HttpError, ok, requireUserId, route, type IdParams } from "@/lib/api";

export const DELETE = route<IdParams>(async (_req, { params }) => {
  const userId = await requireUserId();
  const { id } = await params;
  const { count } = await db.soundMix.deleteMany({ where: { id, userId } });
  if (!count) throw new HttpError(404, "We couldn't find that mix.");
  return ok({ id });
});
