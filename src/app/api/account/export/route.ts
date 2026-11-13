import { NextResponse } from "next/server";
import { db } from "@/lib/db";
import { requireUserId, route } from "@/lib/api";

/** Download everything we store about the signed-in user as JSON. */
export const GET = route(async () => {
  const userId = await requireUserId();
  const data = await db.user.findUniqueOrThrow({
    where: { id: userId },
    select: {
      name: true,
      email: true,
      createdAt: true,
      settings: true,
      categories: true,
      projects: true,
      tasks: { include: { subtasks: true } },
      focusSessions: true,
      habits: { include: { completions: true } },
      calendarEvents: true,
      timeBlocks: true,
      gardenRewards: true,
      soundMixes: true,
    },
  });
  return new NextResponse(JSON.stringify({ exportedAt: new Date().toISOString(), ...data }, null, 2), {
    headers: {
      "Content-Type": "application/json",
      "Content-Disposition": `attachment; filename="lunova-export-${new Date().toISOString().slice(0, 10)}.json"`,
    },
  });
});
