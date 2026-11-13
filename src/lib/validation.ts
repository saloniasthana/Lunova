import { z } from "zod";

const dateKey = z.string().regex(/^\d{4}-\d{2}-\d{2}$/, "Use YYYY-MM-DD");
const timeKey = z.string().regex(/^\d{2}:\d{2}$/, "Use HH:mm");
const trimmed = (max: number) => z.string().trim().max(max);

export const priorityEnum = z.enum(["LOW", "MEDIUM", "HIGH", "URGENT"]);
export const sessionTypeEnum = z.enum(["FOCUS", "SHORT_BREAK", "LONG_BREAK"]);

// ── Auth ──
export const registerSchema = z
  .object({
    name: trimmed(80).min(1, "Please tell us your name"),
    email: z.string().trim().toLowerCase().email("Enter a valid email"),
    password: z.string().min(8, "Use at least 8 characters").max(128),
    confirmPassword: z.string(),
  })
  .refine((d) => d.password === d.confirmPassword, {
    message: "Passwords do not match",
    path: ["confirmPassword"],
  });

export const loginSchema = z.object({
  email: z.string().trim().toLowerCase().email("Enter a valid email"),
  password: z.string().min(1, "Enter your password"),
});

// ── Tasks ──
export const subtaskInput = z.object({
  id: z.string().optional(),
  title: trimmed(200).min(1),
  completed: z.boolean().optional(),
});

// Base shape without defaults — Zod v4 still applies .default() inside .partial(),
// so update schemas must be derived from this, not from the create schema.
const taskBase = z.object({
  title: trimmed(200).min(1, "Give your task a name"),
  description: trimmed(5000).nullish(),
  notes: trimmed(5000).nullish(),
  priority: priorityEnum,
  categoryId: z.string().nullish(),
  projectId: z.string().nullish(),
  dueDate: dateKey.nullish(),
  dueTime: timeKey.nullish(),
  estimatedDuration: z.number().int().min(1).max(1440).nullish(),
  tags: z.array(trimmed(30).min(1)).max(12),
  subtasks: z.array(subtaskInput).max(50).optional(),
});

export const taskCreateSchema = taskBase.extend({
  priority: priorityEnum.default("MEDIUM"),
  tags: z.array(trimmed(30).min(1)).max(12).default([]),
});

export const taskUpdateSchema = taskBase
  .partial()
  .extend({ status: z.enum(["TODO", "DONE"]).optional(), position: z.number().int().optional() });

export const categorySchema = z.object({
  name: trimmed(40).min(1),
  color: trimmed(20).min(1),
  icon: trimmed(40).nullish(),
});

export const projectSchema = z.object({
  name: trimmed(60).min(1),
  description: trimmed(500).nullish(),
  color: trimmed(20).min(1),
});

// ── Focus ──
export const focusSessionSchema = z.object({
  taskId: z.string().nullish(),
  sessionType: sessionTypeEnum,
  plannedDuration: z.number().int().min(1).max(60 * 60 * 6),
  actualDuration: z.number().int().min(0).max(60 * 60 * 6),
  startedAt: z.coerce.date(),
  endedAt: z.coerce.date(),
  completed: z.boolean(),
});

// ── Habits ──
export const habitSchema = z.object({
  name: trimmed(80).min(1, "Name your habit"),
  description: trimmed(300).nullish(),
  icon: trimmed(40).default("sparkles"),
  color: trimmed(20).default("#A8C7E8"),
  frequency: z.enum(["daily", "weekdays", "weekends", "custom"]).default("daily"),
  days: z.array(z.number().int().min(0).max(6)).max(7).default([]),
  target: z.number().int().min(1).max(100).default(1),
  reminderTime: timeKey.nullish(),
  startDate: dateKey,
});
export const habitUpdateSchema = z.object({
  name: trimmed(80).min(1).optional(),
  description: trimmed(300).nullish(),
  icon: trimmed(40).optional(),
  color: trimmed(20).optional(),
  frequency: z.enum(["daily", "weekdays", "weekends", "custom"]).optional(),
  days: z.array(z.number().int().min(0).max(6)).max(7).optional(),
  target: z.number().int().min(1).max(100).optional(),
  reminderTime: timeKey.nullish(),
  startDate: dateKey.optional(),
  paused: z.boolean().optional(),
});

export const habitToggleSchema = z.object({ date: dateKey });

// ── Calendar & planner ──
export const eventSchema = z
  .object({
    title: trimmed(120).min(1, "Give the event a title"),
    description: trimmed(1000).nullish(),
    startDateTime: z.coerce.date(),
    endDateTime: z.coerce.date(),
    category: z.enum(["personal", "study", "work", "health", "other"]).default("personal"),
    taskId: z.string().nullish(),
  })
  .refine((e) => e.endDateTime > e.startDateTime, { message: "End must be after start", path: ["endDateTime"] });

export const eventUpdateSchema = z.object({
  title: trimmed(120).min(1).optional(),
  description: trimmed(1000).nullish(),
  startDateTime: z.coerce.date().optional(),
  endDateTime: z.coerce.date().optional(),
  category: z.enum(["personal", "study", "work", "health", "other"]).optional(),
  taskId: z.string().nullish(),
});

export const timeBlockSchema = z
  .object({
    date: dateKey,
    startMin: z.number().int().min(0).max(1439),
    endMin: z.number().int().min(1).max(1440),
    title: trimmed(120).min(1),
    color: trimmed(20).default("blue"),
    taskId: z.string().nullish(),
    completed: z.boolean().optional(),
  })
  .refine((b) => b.endMin > b.startMin, { message: "End must be after start", path: ["endMin"] });

export const timeBlockUpdateSchema = z.object({
  startMin: z.number().int().min(0).max(1439).optional(),
  endMin: z.number().int().min(1).max(1440).optional(),
  title: trimmed(120).min(1).optional(),
  color: trimmed(20).optional(),
  taskId: z.string().nullish(),
  completed: z.boolean().optional(),
  date: dateKey.optional(),
});

// ── Settings ──
const minutes = z.number().int().min(1).max(180);
export const settingsSchema = z
  .object({
    theme: z.enum(["cloud", "lavender", "sakura", "mint", "peach", "cream", "night"]),
    accentColor: z.string().regex(/^#[0-9a-fA-F]{6}$/).nullable(),
    wallpaper: trimmed(40),
    font: z.enum(["nunito", "inter", "jakarta", "dmsans"]),
    focusDuration: minutes,
    shortBreakDuration: minutes,
    longBreakDuration: minutes,
    sessionsBeforeLongBreak: z.number().int().min(1).max(12),
    autoStartBreaks: z.boolean(),
    autoStartFocus: z.boolean(),
    musicVolume: z.number().int().min(0).max(100),
    completionSound: z.boolean(),
    companionEnabled: z.boolean(),
    companionType: z.enum(["cat", "bunny", "bear", "panda", "hoodie", "cloud"]),
    companionSize: z.enum(["sm", "md", "lg"]),
    companionAccessory: trimmed(30),
    notificationsEnabled: z.boolean(),
    showQuotes: z.boolean(),
    showMusicPlayer: z.boolean(),
    focusArea: z.enum(["study", "work", "personal", "habits", "everything"]),
    workStartMin: z.number().int().min(0).max(1439),
    workEndMin: z.number().int().min(1).max(1440),
    onboarded: z.boolean(),
  })
  .partial();

export const profileSchema = z.object({
  name: trimmed(80).min(1),
  image: z.string().url().max(500).nullish().or(z.literal("")),
});

export const soundMixSchema = z.object({
  name: trimmed(40).min(1),
  levels: z.record(z.string(), z.number().min(0).max(1)),
});

export const gardenUnlockSchema = z.object({ rewardName: trimmed(40).min(1) });
export const gardenUpdateSchema = z.object({ selected: z.boolean().optional(), x: z.number().int().min(0).max(100).optional() });
