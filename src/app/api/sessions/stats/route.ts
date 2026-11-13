import { db } from "@/lib/db";
import { ok, requireUserId, route } from "@/lib/api";

/** Totals for completed focus sessions within an optional ?from=&to= ISO range. */
export const GET = route(async (req) => {
  const userId = await requireUserId();
  const url = new URL(req.url);
  const from = url.searchParams.get("from");
  const to = url.searchParams.get("to");
  const agg = await db.focusSession.aggregate({
    where: {
      userId,
      sessionType: "FOCUS",
      startedAt: { gte: from ? new Date(from) : undefined, lte: to ? new Date(to) : undefined },
    },
    _sum: { actualDuration: true },
    _count: { _all: true },
  });
  const completed = await db.focusSession.count({
    where: {
      userId,
      sessionType: "FOCUS",
      completed: true,
      startedAt: { gte: from ? new Date(from) : undefined, lte: to ? new Date(to) : undefined },
    },
  });
  return ok({ focusSeconds: agg._sum.actualDuration ?? 0, sessions: agg._count._all, completedSessions: completed });
});
