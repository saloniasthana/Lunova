import { db } from "@/lib/db";
import { ok, parseBody, requireUserId, route } from "@/lib/api";
import { eventSchema } from "@/lib/validation";
import { assertTaskOwned } from "@/server/ownership";
import { stripUser } from "@/server/serialize";

export const GET = route(async () => {
  const userId = await requireUserId();
  const rows = await db.calendarEvent.findMany({ where: { userId }, orderBy: { startDateTime: "asc" } });
  return ok(rows.map(stripUser));
});

export const POST = route(async (req) => {
  const userId = await requireUserId();
  const data = await parseBody(req, eventSchema);
  await assertTaskOwned(userId, data.taskId);
  const row = await db.calendarEvent.create({ data: { ...data, userId } });
  return ok(stripUser(row), 201);
});
