import { z } from "zod";
import { db } from "@/lib/db";
import { fail, ok, parseBody, requireUserId, route } from "@/lib/api";

const schema = z.object({ confirm: z.literal("DELETE") });

/** Permanently deletes the account and all data (cascades through every relation). */
export const POST = route(async (req) => {
  const userId = await requireUserId();
  const parsed = schema.safeParse(await parseBody(req, z.unknown()));
  if (!parsed.success) return fail('Type "DELETE" to confirm.', 422);
  await db.user.delete({ where: { id: userId } });
  return ok({ deleted: true });
});
