import { db } from "@/lib/db";
import { ok, parseBody, requireUserId, route } from "@/lib/api";
import { projectSchema } from "@/lib/validation";
import { stripUser } from "@/server/serialize";

export const GET = route(async () => {
  const userId = await requireUserId();
  const rows = await db.project.findMany({ where: { userId }, orderBy: { createdAt: "asc" } });
  return ok(rows.map(stripUser));
});

export const POST = route(async (req) => {
  const userId = await requireUserId();
  const data = await parseBody(req, projectSchema);
  const row = await db.project.create({ data: { ...data, userId } });
  return ok(stripUser(row), 201);
});
