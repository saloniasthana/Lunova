import { db } from "@/lib/db";
import { ok, parseBody, requireUserId, route } from "@/lib/api";
import { soundMixSchema } from "@/lib/validation";
import { stripUser } from "@/server/serialize";

export const GET = route(async () => {
  const userId = await requireUserId();
  const rows = await db.soundMix.findMany({ where: { userId }, orderBy: { createdAt: "asc" } });
  return ok(rows.map(stripUser));
});

export const POST = route(async (req) => {
  const userId = await requireUserId();
  const data = await parseBody(req, soundMixSchema);
  const row = await db.soundMix.create({ data: { ...data, userId } });
  return ok(stripUser(row), 201);
});
