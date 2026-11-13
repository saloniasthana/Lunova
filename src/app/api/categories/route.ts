import { db } from "@/lib/db";
import { ok, parseBody, requireUserId, route } from "@/lib/api";
import { categorySchema } from "@/lib/validation";
import { stripUser } from "@/server/serialize";

export const GET = route(async () => {
  const userId = await requireUserId();
  const rows = await db.category.findMany({ where: { userId }, orderBy: { name: "asc" } });
  return ok(rows.map(stripUser));
});

export const POST = route(async (req) => {
  const userId = await requireUserId();
  const data = await parseBody(req, categorySchema);
  const row = await db.category.create({ data: { ...data, userId } });
  return ok(stripUser(row), 201);
});
