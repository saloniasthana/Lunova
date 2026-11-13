import { z } from "zod";
import { db } from "@/lib/db";
import { HttpError, ok, parseBody, requireUserId, route } from "@/lib/api";
import { timeBlockSchema } from "@/lib/validation";
import { assertTaskOwned } from "@/server/ownership";
import { stripUser } from "@/server/serialize";

export const GET = route(async (req) => {
  const userId = await requireUserId();
  const date = new URL(req.url).searchParams.get("date") ?? undefined;
  const rows = await db.timeBlock.findMany({ where: { userId, date }, orderBy: [{ date: "asc" }, { startMin: "asc" }] });
  return ok(rows.map(stripUser));
});

/** Create one block, or many at once (used by the smart planner). Rejects overlaps. */
export const POST = route(async (req) => {
  const userId = await requireUserId();
  const body = await parseBody(req, z.union([timeBlockSchema, z.array(timeBlockSchema).min(1).max(50)]));
  const blocks = Array.isArray(body) ? body : [body];

  for (const b of blocks) await assertTaskOwned(userId, b.taskId);

  const dates = [...new Set(blocks.map((b) => b.date))];
  const existing = await db.timeBlock.findMany({ where: { userId, date: { in: dates } } });
  const all = [...existing.map((e) => ({ ...e, isNew: false })), ...blocks.map((b) => ({ ...b, isNew: true }))];
  for (const b of blocks) {
    const clash = all.find(
      (o) => o !== (b as unknown) && o.date === b.date && o.startMin < b.endMin && b.startMin < o.endMin && !(o.isNew && o.startMin === b.startMin && o.endMin === b.endMin && o.title === b.title),
    );
    if (clash) throw new HttpError(409, `"${b.title}" overlaps with "${clash.title}".`);
  }

  const created = await db.$transaction(blocks.map((b) => db.timeBlock.create({ data: { ...b, userId } })));
  return ok(Array.isArray(body) ? created.map(stripUser) : stripUser(created[0]), 201);
});
