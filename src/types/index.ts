// Client-side shapes (JSON-serialised versions of the Prisma models).

export type Priority = "LOW" | "MEDIUM" | "HIGH" | "URGENT";
export type TaskStatus = "TODO" | "DONE";
export type SessionType = "FOCUS" | "SHORT_BREAK" | "LONG_BREAK";

export interface Subtask {
  id: string;
  taskId: string;
  title: string;
  completed: boolean;
}

export interface Task {
  id: string;
  title: string;
  description: string | null;
  notes: string | null;
  priority: Priority;
  status: TaskStatus;
  categoryId: string | null;
  projectId: string | null;
  dueDate: string | null;
  dueTime: string | null;
  estimatedDuration: number | null;
  tags: string[];
  position: number;
  createdAt: string;
  updatedAt: string;
  completedAt: string | null;
  subtasks: Subtask[];
  focusSeconds: number;
}

export interface Category {
  id: string;
  name: string;
  color: string;
  icon: string | null;
}

export interface Project {
  id: string;
  name: string;
  description: string | null;
  color: string;
}

export interface FocusSession {
  id: string;
  taskId: string | null;
  sessionType: SessionType;
  plannedDuration: number;
  actualDuration: number;
  startedAt: string;
  endedAt: string;
  completed: boolean;
}

export type HabitFrequency = "daily" | "weekdays" | "weekends" | "custom";

export interface Habit {
  id: string;
  name: string;
  description: string | null;
  icon: string;
  color: string;
  frequency: HabitFrequency;
  days: number[];
  target: number;
  reminderTime: string | null;
  startDate: string;
  paused: boolean;
  createdAt: string;
  completions: string[]; // date keys
}

export type EventCategory = "personal" | "study" | "work" | "health" | "other";

export interface CalendarEvent {
  id: string;
  title: string;
  description: string | null;
  startDateTime: string;
  endDateTime: string;
  category: EventCategory;
  taskId: string | null;
}

export interface TimeBlock {
  id: string;
  date: string;
  startMin: number;
  endMin: number;
  title: string;
  color: string;
  taskId: string | null;
  completed: boolean;
}

export type ThemeId = "cloud" | "lavender" | "sakura" | "mint" | "peach" | "cream" | "night";
export type FontId = "nunito" | "inter" | "jakarta" | "dmsans";
export type CompanionType = "cat" | "bunny" | "bear" | "panda" | "hoodie" | "cloud";

export interface UserSettings {
  theme: ThemeId;
  accentColor: string | null;
  wallpaper: string;
  font: FontId;
  focusDuration: number;
  shortBreakDuration: number;
  longBreakDuration: number;
  sessionsBeforeLongBreak: number;
  autoStartBreaks: boolean;
  autoStartFocus: boolean;
  musicVolume: number;
  completionSound: boolean;
  companionEnabled: boolean;
  companionType: CompanionType;
  companionSize: "sm" | "md" | "lg";
  companionAccessory: string;
  notificationsEnabled: boolean;
  showQuotes: boolean;
  showMusicPlayer: boolean;
  focusArea: "study" | "work" | "personal" | "habits" | "everything";
  workStartMin: number;
  workEndMin: number;
  onboarded: boolean;
}

export interface GardenReward {
  id: string;
  rewardType: string;
  rewardName: string;
  unlockedAt: string;
  selected: boolean;
  x: number;
}

export interface SoundMix {
  id: string;
  name: string;
  levels: Record<string, number>;
}

export interface Me {
  id: string;
  name: string | null;
  email: string;
  image: string | null;
}
