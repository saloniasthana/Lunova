import { db } from "@/lib/db";
import { HttpError, ok, parseBody, requireUserId, route, type IdParams } from "@/lib/api";
import { habitToggleSchema } from "@/lib/validation";
import { habitInclude, serializeHabit } from "@/server/serialize";

/** Mark a habit complete for a local date. Idempotent thanks to the unique (habitId, date) constraint. */
export const POST = route<IdParams>(async (req, { params }) => {
  const userId = await requireUserId();
  const { id } = await params;
  const { date } = await parseBody(req, habitToggleSchema);
  const habit = await db.habit.findFirst({ where: { id, userId }, select: { id: true } });
  if (!habit) throw new HttpError(404, "We couldn't find that habit.");
  await db.habitCompletion.upsert({
    where: { habitId_completionDate: { habitId: id, completionDate: date } },
    create: { habitId: id, userId, completionDate: date },
    update: {},
  });
  return ok(serializeHabit(await db.habit.findUniqueOrThrow({ where: { id }, include: habitInclude })));
});

/** Undo a completion for a local date. */
export const DELETE = route<IdParams>(async (req, { params }) => {
  const userId = await requireUserId();
  const { id } = await params;
  const date = new URL(req.url).searchParams.get("date") ?? "";
  const { date: valid } = habitToggleSchema.parse({ date });
  await db.habitCompletion.deleteMany({ where: { habitId: id, userId, completionDate: valid } });
  const habit = await db.habit.findFirst({ where: { id, userId }, include: habitInclude });
  if (!habit) throw new HttpError(404, "We couldn't find that habit.");
  return ok(serializeHabit(habit));
});
