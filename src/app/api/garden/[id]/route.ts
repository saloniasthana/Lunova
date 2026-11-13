import { db } from "@/lib/db";
import { HttpError, ok, parseBody, requireUserId, route, type IdParams } from "@/lib/api";
import { gardenUpdateSchema } from "@/lib/validation";
import { stripUser } from "@/server/serialize";

export const PATCH = route<IdParams>(async (req, { params }) => {
  const userId = await requireUserId();
  const { id } = await params;
  const data = await parseBody(req, gardenUpdateSchema);
  const { count } = await db.gardenReward.updateMany({ where: { id, userId }, data });
  if (!count) throw new HttpError(404, "We couldn't find that item.");
  return ok(stripUser(await db.gardenReward.findUniqueOrThrow({ where: { id } })));
});
