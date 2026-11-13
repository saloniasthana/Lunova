import { db } from "@/lib/db";
import { ok, parseBody, requireUserId, route } from "@/lib/api";
import { settingsSchema } from "@/lib/validation";
import { ensureUserSetup } from "@/server/users";

function clean<T extends { id: string; userId: string }>(s: T) {
  const { id: _i, userId: _u, ...rest } = s;
  void _i;
  void _u;
  return rest;
}

export const GET = route(async () => {
  const userId = await requireUserId();
  return ok(clean(await ensureUserSetup(userId)));
});

export const PATCH = route(async (req) => {
  const userId = await requireUserId();
  const data = await parseBody(req, settingsSchema);
  await ensureUserSetup(userId);
  const row = await db.userSettings.update({ where: { userId }, data });
  return ok(clean(row));
});
