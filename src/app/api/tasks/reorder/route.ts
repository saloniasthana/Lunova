import { z } from "zod";
import { db } from "@/lib/db";
import { ok, parseBody, requireUserId, route } from "@/lib/api";

const schema = z.object({ ids: z.array(z.string()).min(1).max(500) });

/** Persist a manual ordering. Only the caller's own tasks are touched. */
export const POST = route(async (req) => {
  const userId = await requireUserId();
  const { ids } = await parseBody(req, schema);
  const owned = await db.task.findMany({ where: { userId, id: { in: ids } }, select: { id: true } });
  const ownedSet = new Set(owned.map((t) => t.id));
  const ordered = ids.filter((id) => ownedSet.has(id));
  await db.$transaction(ordered.map((id, position) => db.task.update({ where: { id }, data: { position } })));
  return ok({ count: ordered.length });
});
