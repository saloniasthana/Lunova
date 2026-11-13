import { db } from "@/lib/db";
import { ok, parseBody, requireUserId, route } from "@/lib/api";
import { profileSchema } from "@/lib/validation";

export const PATCH = route(async (req) => {
  const userId = await requireUserId();
  const { name, image } = await parseBody(req, profileSchema);
  const user = await db.user.update({
    where: { id: userId },
    data: { name, image: image || null },
    select: { id: true, name: true, email: true, image: true },
  });
  return ok(user);
});
