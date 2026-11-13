import { db } from "@/lib/db";
import { ok, parseBody, requireUserId, route } from "@/lib/api";
import { habitSchema } from "@/lib/validation";
import { habitInclude, serializeHabit } from "@/server/serialize";

export const GET = route(async () => {
  const userId = await requireUserId();
  const rows = await db.habit.findMany({ where: { userId }, include: habitInclude, orderBy: { createdAt: "asc" } });
  return ok(rows.map(serializeHabit));
});

export const POST = route(async (req) => {
  const userId = await requireUserId();
  const data = await parseBody(req, habitSchema);
  const row = await db.habit.create({ data: { ...data, userId }, include: habitInclude });
  return ok(serializeHabit(row), 201);
});
