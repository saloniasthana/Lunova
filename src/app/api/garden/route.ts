import { db } from "@/lib/db";
import { HttpError, ok, parseBody, requireUserId, route } from "@/lib/api";
import { gardenUnlockSchema } from "@/lib/validation";
import { catalogByKey, earnedPoints, spentPoints } from "@/lib/garden";
import { stripUser } from "@/server/serialize";

async function balance(userId: string) {
  const [focus, tasksDone, habitCompletions, unlocked] = await Promise.all([
    db.focusSession.aggregate({
      where: { userId, sessionType: "FOCUS", completed: true },
      _sum: { actualDuration: true },
    }),
    db.task.count({ where: { userId, status: "DONE" } }),
    db.habitCompletion.count({ where: { userId } }),
    db.gardenReward.findMany({ where: { userId } }),
  ]);
  const earned = earnedPoints({ focusSeconds: focus._sum.actualDuration ?? 0, tasksDone, habitCompletions });
  const spent = spentPoints(unlocked.map((u) => u.rewardName));
  return { earned, spent, available: earned - spent, unlocked };
}

export const GET = route(async () => {
  const userId = await requireUserId();
  const b = await balance(userId);
  return ok({ earned: b.earned, spent: b.spent, available: b.available, rewards: b.unlocked.map(stripUser) });
});

/** Unlock a catalog item. Points are verified server-side from real activity data. */
export const POST = route(async (req) => {
  const userId = await requireUserId();
  const { rewardName } = await parseBody(req, gardenUnlockSchema);
  const item = catalogByKey.get(rewardName);
  if (!item) throw new HttpError(404, "That item isn't in the garden shop.");
  const b = await balance(userId);
  if (b.unlocked.some((u) => u.rewardName === rewardName)) throw new HttpError(409, "You already have this one.");
  if (b.available < item.cost) throw new HttpError(422, "Not enough garden points yet — keep going!");
  const row = await db.gardenReward.create({
    data: { userId, rewardName, rewardType: item.type, selected: true, x: Math.floor(Math.random() * 90) + 5 },
  });
  return ok(stripUser(row), 201);
});
