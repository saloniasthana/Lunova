import { z } from "zod";
import { db } from "@/lib/db";
import { ok, parseBody, requireUserId, route } from "@/lib/api";
import { DEFAULT_CATEGORIES } from "@/server/users";

const schema = z.object({ scope: z.enum(["completed-tasks", "workspace", "everything"]) });

/**
 * completed-tasks → delete finished tasks
 * workspace       → reset appearance/timer settings to defaults
 * everything      → wipe all productivity data (keeps the account)
 */
export const POST = route(async (req) => {
  const userId = await requireUserId();
  const { scope } = await parseBody(req, schema);

  if (scope === "completed-tasks") {
    const { count } = await db.task.deleteMany({ where: { userId, status: "DONE" } });
    return ok({ deleted: count });
  }
  if (scope === "workspace") {
    await db.userSettings.deleteMany({ where: { userId } });
    await db.userSettings.create({ data: { userId, onboarded: true } });
    return ok({ reset: true });
  }
  await db.$transaction([
    db.task.deleteMany({ where: { userId } }),
    db.focusSession.deleteMany({ where: { userId } }),
    db.habit.deleteMany({ where: { userId } }),
    db.calendarEvent.deleteMany({ where: { userId } }),
    db.timeBlock.deleteMany({ where: { userId } }),
    db.gardenReward.deleteMany({ where: { userId } }),
    db.soundMix.deleteMany({ where: { userId } }),
    db.project.deleteMany({ where: { userId } }),
    db.category.deleteMany({ where: { userId } }),
    db.category.createMany({ data: DEFAULT_CATEGORIES.map((c) => ({ ...c, userId })) }),
  ]);
  return ok({ reset: true });
});
