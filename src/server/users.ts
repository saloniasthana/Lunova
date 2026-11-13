import "server-only";
import { db } from "@/lib/db";

export const DEFAULT_CATEGORIES = [
  { name: "Study", color: "blue", icon: "book-open" },
  { name: "Work", color: "lavender", icon: "briefcase" },
  { name: "Personal", color: "pink", icon: "heart" },
  { name: "Health", color: "green", icon: "leaf" },
  { name: "Projects", color: "peach", icon: "folder" },
  { name: "Other", color: "gray", icon: "circle" },
];

/** Idempotently creates settings + default categories for a user. */
export async function ensureUserSetup(userId: string) {
  const existing = await db.userSettings.findUnique({ where: { userId } });
  if (existing) return existing;
  const [settings] = await db.$transaction([
    db.userSettings.upsert({ where: { userId }, create: { userId }, update: {} }),
    db.category.createMany({
      data: DEFAULT_CATEGORIES.map((c) => ({ ...c, userId })),
      skipDuplicates: true,
    }),
  ]);
  return settings;
}
