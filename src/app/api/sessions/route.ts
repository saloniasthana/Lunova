import { db } from "@/lib/db";
import { ok, parseBody, requireUserId, route } from "@/lib/api";
import { focusSessionSchema } from "@/lib/validation";
import { assertTaskOwned } from "@/server/ownership";
import { stripUser } from "@/server/serialize";

export const GET = route(async (req) => {
  const userId = await requireUserId();
  const url = new URL(req.url);
  const from = url.searchParams.get("from");
  const to = url.searchParams.get("to");
  const rows = await db.focusSession.findMany({
    where: {
      userId,
      startedAt: { gte: from ? new Date(from) : undefined, lte: to ? new Date(to) : undefined },
    },
    orderBy: { startedAt: "desc" },
    take: 2000,
  });
  return ok(rows.map(stripUser));
});

export const POST = route(async (req) => {
  const userId = await requireUserId();
  const data = await parseBody(req, focusSessionSchema);
  await assertTaskOwned(userId, data.taskId);
  // Never record more time than actually elapsed between start and end.
  const elapsed = Math.max(0, Math.round((data.endedAt.getTime() - data.startedAt.getTime()) / 1000));
  const row = await db.focusSession.create({
    data: { ...data, actualDuration: Math.min(data.actualDuration, elapsed + 5), userId },
  });
  return ok(stripUser(row), 201);
});
