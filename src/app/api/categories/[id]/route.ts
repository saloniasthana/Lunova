import { db } from "@/lib/db";
import { HttpError, ok, parseBody, requireUserId, route, type IdParams } from "@/lib/api";
import { categorySchema } from "@/lib/validation";
import { stripUser } from "@/server/serialize";

export const PATCH = route<IdParams>(async (req, { params }) => {
  const userId = await requireUserId();
  const { id } = await params;
  const data = await parseBody(req, categorySchema.partial());
  const { count } = await db.category.updateMany({ where: { id, userId }, data });
  if (!count) throw new HttpError(404, "We couldn't find that category.");
  return ok(stripUser(await db.category.findUniqueOrThrow({ where: { id } })));
});

export const DELETE = route<IdParams>(async (_req, { params }) => {
  const userId = await requireUserId();
  const { id } = await params;
  const { count } = await db.category.deleteMany({ where: { id, userId } });
  if (!count) throw new HttpError(404, "We couldn't find that category.");
  return ok({ id });
});
