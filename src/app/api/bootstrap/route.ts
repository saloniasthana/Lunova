import { db } from "@/lib/db";
import { ok, requireUserId, route } from "@/lib/api";
import { ensureUserSetup } from "@/server/users";
import { focusSecondsByTask, habitInclude, serializeHabit, serializeTask, stripUser, taskInclude } from "@/server/serialize";

/** One request that hydrates the whole client workspace. */
export const GET = route(async () => {
  const userId = await requireUserId();
  const settings = await ensureUserSetup(userId);

  const since = new Date();
  since.setDate(since.getDate() - 400);

  const [user, tasks, categories, projects, sessions, habits, events, timeBlocks, garden, mixes, focusMap] =
    await Promise.all([
      db.user.findUniqueOrThrow({ where: { id: userId }, select: { id: true, name: true, email: true, image: true } }),
      db.task.findMany({ where: { userId }, include: taskInclude, orderBy: [{ position: "asc" }, { createdAt: "desc" }] }),
      db.category.findMany({ where: { userId }, orderBy: { name: "asc" } }),
      db.project.findMany({ where: { userId }, orderBy: { createdAt: "asc" } }),
      db.focusSession.findMany({ where: { userId, startedAt: { gte: since } }, orderBy: { startedAt: "desc" } }),
      db.habit.findMany({ where: { userId }, include: habitInclude, orderBy: { createdAt: "asc" } }),
      db.calendarEvent.findMany({ where: { userId }, orderBy: { startDateTime: "asc" } }),
      db.timeBlock.findMany({ where: { userId }, orderBy: [{ date: "asc" }, { startMin: "asc" }] }),
      db.gardenReward.findMany({ where: { userId }, orderBy: { unlockedAt: "asc" } }),
      db.soundMix.findMany({ where: { userId }, orderBy: { createdAt: "asc" } }),
      focusSecondsByTask(userId),
    ]);

  const { id: _sid, userId: _uid, ...settingsData } = settings;
  void _sid;
  void _uid;

  return ok({
    me: user,
    settings: settingsData,
    tasks: tasks.map((t) => serializeTask(t, focusMap.get(t.id) ?? 0)),
    categories: categories.map(stripUser),
    projects: projects.map(stripUser),
    sessions: sessions.map(stripUser),
    habits: habits.map(serializeHabit),
    events: events.map(stripUser),
    timeBlocks: timeBlocks.map(stripUser),
    garden: garden.map(stripUser),
    mixes: mixes.map(stripUser),
  });
});
