"use client";

import { create } from "zustand";
import { toast } from "sonner";
import { api, ApiError } from "@/lib/client-api";
import type {
  CalendarEvent,
  Category,
  FocusSession,
  GardenReward,
  Habit,
  Me,
  Project,
  SoundMix,
  Task,
  TimeBlock,
  UserSettings,
} from "@/types";
import { useCompanion } from "@/stores/companion-store";

type Bootstrap = {
  me: Me;
  settings: UserSettings;
  tasks: Task[];
  categories: Category[];
  projects: Project[];
  sessions: FocusSession[];
  habits: Habit[];
  events: CalendarEvent[];
  timeBlocks: TimeBlock[];
  garden: GardenReward[];
  mixes: SoundMix[];
};

export type TaskInput = Partial<Omit<Task, "id" | "subtasks" | "focusSeconds" | "createdAt" | "updatedAt" | "completedAt">> & {
  title?: string;
  subtasks?: { id?: string; title: string; completed?: boolean }[];
};

interface DataState extends Partial<Bootstrap> {
  status: "idle" | "loading" | "ready" | "error";
  error?: string;
  load: () => Promise<void>;

  // tasks
  addTask: (input: TaskInput & { title: string }) => Promise<Task | null>;
  updateTask: (id: string, patch: TaskInput) => Promise<Task | null>;
  toggleTask: (id: string) => Promise<void>;
  deleteTask: (id: string) => Promise<void>;
  duplicateTask: (id: string) => Promise<void>;
  reorderTasks: (orderedIds: string[]) => Promise<void>;
  addCategory: (input: { name: string; color: string }) => Promise<Category | null>;
  deleteCategory: (id: string) => Promise<void>;
  addProject: (input: { name: string; color: string; description?: string }) => Promise<Project | null>;
  deleteProject: (id: string) => Promise<void>;

  // focus
  recordSession: (s: Omit<FocusSession, "id">) => Promise<void>;

  // habits
  addHabit: (input: Partial<Habit> & { name: string; startDate: string }) => Promise<Habit | null>;
  updateHabit: (id: string, patch: Partial<Habit>) => Promise<void>;
  deleteHabit: (id: string) => Promise<void>;
  toggleHabit: (id: string, date: string) => Promise<void>;

  // calendar
  addEvent: (input: Omit<CalendarEvent, "id">) => Promise<CalendarEvent | null>;
  updateEvent: (id: string, patch: Partial<CalendarEvent>) => Promise<void>;
  deleteEvent: (id: string) => Promise<void>;

  // planner
  addBlocks: (blocks: Omit<TimeBlock, "id" | "completed">[]) => Promise<boolean>;
  updateBlock: (id: string, patch: Partial<TimeBlock>) => Promise<boolean>;
  deleteBlock: (id: string) => Promise<void>;

  // settings / profile
  updateSettings: (patch: Partial<UserSettings>) => Promise<void>;
  updateProfile: (patch: { name: string; image?: string | null }) => Promise<void>;

  // garden & mixes
  unlockReward: (key: string) => Promise<void>;
  updateReward: (id: string, patch: { selected?: boolean; x?: number }) => Promise<void>;
  saveMix: (name: string, levels: Record<string, number>) => Promise<void>;
  deleteMix: (id: string) => Promise<void>;
}

function errMsg(e: unknown, fallback: string) {
  return e instanceof ApiError ? e.message : fallback;
}

/** Persist appearance locally so the theme applies before React hydrates. */
export function mirrorAppearance(s: Partial<UserSettings>) {
  try {
    const prev = JSON.parse(localStorage.getItem("lunova-appearance") || "{}");
    const next = {
      ...prev,
      ...(s.theme !== undefined && { theme: s.theme }),
      ...(s.font !== undefined && { font: s.font }),
      ...(s.accentColor !== undefined && { accent: s.accentColor }),
    };
    localStorage.setItem("lunova-appearance", JSON.stringify(next));
  } catch {
    /* storage unavailable */
  }
}

export const useData = create<DataState>()((set, get) => {
  /** Optimistically replace one item in a collection, rolling back on failure. */
  async function optimistic<K extends keyof Bootstrap>(
    key: K,
    mutate: (items: Bootstrap[K]) => Bootstrap[K],
    run: () => Promise<void>,
    failMsg: string,
  ) {
    const before = get()[key] as Bootstrap[K];
    set({ [key]: mutate(before) } as Partial<DataState>);
    try {
      await run();
    } catch (e) {
      set({ [key]: before } as Partial<DataState>);
      toast.error(errMsg(e, failMsg));
      throw e;
    }
  }

  const replaceTask = (t: Task) => set((s) => ({ tasks: (s.tasks ?? []).map((x) => (x.id === t.id ? t : x)) }));
  const replaceHabit = (h: Habit) => set((s) => ({ habits: (s.habits ?? []).map((x) => (x.id === h.id ? h : x)) }));

  return {
    status: "idle",

    async load() {
      if (get().status === "loading") return;
      set({ status: "loading", error: undefined });
      try {
        const data = await api.get<Bootstrap>("/api/bootstrap");
        set({ ...data, status: "ready" });
        mirrorAppearance(data.settings);
      } catch (e) {
        set({ status: "error", error: errMsg(e, "We couldn't load your workspace.") });
      }
    },

    // ───────── Tasks ─────────
    async addTask(input) {
      try {
        const task = await api.post<Task>("/api/tasks", input);
        set((s) => ({ tasks: [task, ...(s.tasks ?? [])] }));
        return task;
      } catch (e) {
        toast.error(errMsg(e, "Unable to save your task. Please try again."));
        return null;
      }
    },

    async updateTask(id, patch) {
      const before = get().tasks?.find((t) => t.id === id);
      if (before && !patch.subtasks) {
        replaceTask({ ...before, ...(patch as Partial<Task>) });
      }
      try {
        const task = await api.patch<Task>(`/api/tasks/${id}`, patch);
        replaceTask(task);
        return task;
      } catch (e) {
        if (before) replaceTask(before);
        toast.error(errMsg(e, "Unable to save your task. Please try again."));
        return null;
      }
    },

    async toggleTask(id) {
      const t = get().tasks?.find((x) => x.id === id);
      if (!t) return;
      const completed = t.status !== "DONE";
      await optimistic(
        "tasks",
        (tasks) =>
          tasks.map((x) =>
            x.id === id ? { ...x, status: completed ? "DONE" : "TODO", completedAt: completed ? new Date().toISOString() : null } : x,
          ),
        async () => {
          const task = await api.post<Task>(`/api/tasks/${id}/complete`, { completed });
          replaceTask(task);
        },
        "Unable to update your task.",
      ).catch(() => undefined);
      if (completed) useCompanion.getState().react("celebrate", "You did amazing!");
    },

    async deleteTask(id) {
      const removed = get().tasks?.find((t) => t.id === id);
      await optimistic(
        "tasks",
        (tasks) => tasks.filter((t) => t.id !== id),
        async () => void (await api.del(`/api/tasks/${id}`)),
        "Unable to delete your task.",
      ).catch(() => undefined);
      if (removed) toast.success("Task deleted");
    },

    async duplicateTask(id) {
      try {
        const task = await api.post<Task>(`/api/tasks/${id}/duplicate`);
        set((s) => {
          const list = [...(s.tasks ?? [])];
          const idx = list.findIndex((t) => t.id === id);
          list.splice(idx + 1, 0, task);
          return { tasks: list };
        });
        toast.success("Task duplicated");
      } catch (e) {
        toast.error(errMsg(e, "Unable to duplicate this task."));
      }
    },

    async reorderTasks(orderedIds) {
      const pos = new Map(orderedIds.map((id, i) => [id, i]));
      await optimistic(
        "tasks",
        (tasks) => tasks.map((t) => (pos.has(t.id) ? { ...t, position: pos.get(t.id)! } : t)),
        async () => void (await api.post("/api/tasks/reorder", { ids: orderedIds })),
        "Unable to save the new order.",
      ).catch(() => undefined);
    },

    async addCategory(input) {
      try {
        const c = await api.post<Category>("/api/categories", input);
        set((s) => ({ categories: [...(s.categories ?? []), c].sort((a, b) => a.name.localeCompare(b.name)) }));
        return c;
      } catch (e) {
        toast.error(errMsg(e, "Unable to create category."));
        return null;
      }
    },

    async deleteCategory(id) {
      await optimistic(
        "categories",
        (cs) => cs.filter((c) => c.id !== id),
        async () => {
          await api.del(`/api/categories/${id}`);
          set((s) => ({ tasks: s.tasks?.map((t) => (t.categoryId === id ? { ...t, categoryId: null } : t)) }));
        },
        "Unable to delete category.",
      ).catch(() => undefined);
    },

    async addProject(input) {
      try {
        const p = await api.post<Project>("/api/projects", input);
        set((s) => ({ projects: [...(s.projects ?? []), p] }));
        return p;
      } catch (e) {
        toast.error(errMsg(e, "Unable to create project."));
        return null;
      }
    },

    async deleteProject(id) {
      await optimistic(
        "projects",
        (ps) => ps.filter((p) => p.id !== id),
        async () => {
          await api.del(`/api/projects/${id}`);
          set((s) => ({ tasks: s.tasks?.map((t) => (t.projectId === id ? { ...t, projectId: null } : t)) }));
        },
        "Unable to delete project.",
      ).catch(() => undefined);
    },

    // ───────── Focus ─────────
    async recordSession(session) {
      try {
        const saved = await api.post<FocusSession>("/api/sessions", session);
        set((s) => ({
          sessions: [saved, ...(s.sessions ?? [])],
          tasks:
            saved.taskId && saved.sessionType === "FOCUS"
              ? s.tasks?.map((t) => (t.id === saved.taskId ? { ...t, focusSeconds: t.focusSeconds + saved.actualDuration } : t))
              : s.tasks,
        }));
      } catch (e) {
        toast.error(errMsg(e, "We couldn't save this focus session."));
      }
    },

    // ───────── Habits ─────────
    async addHabit(input) {
      try {
        const h = await api.post<Habit>("/api/habits", input);
        set((s) => ({ habits: [...(s.habits ?? []), h] }));
        return h;
      } catch (e) {
        toast.error(errMsg(e, "Unable to save your habit."));
        return null;
      }
    },

    async updateHabit(id, patch) {
      await optimistic(
        "habits",
        (hs) => hs.map((h) => (h.id === id ? { ...h, ...patch } : h)),
        async () => replaceHabit(await api.patch<Habit>(`/api/habits/${id}`, patch)),
        "Unable to update your habit.",
      ).catch(() => undefined);
    },

    async deleteHabit(id) {
      await optimistic(
        "habits",
        (hs) => hs.filter((h) => h.id !== id),
        async () => void (await api.del(`/api/habits/${id}`)),
        "Unable to delete your habit.",
      ).catch(() => undefined);
    },

    async toggleHabit(id, date) {
      const h = get().habits?.find((x) => x.id === id);
      if (!h) return;
      const done = h.completions.includes(date);
      await optimistic(
        "habits",
        (hs) =>
          hs.map((x) =>
            x.id === id
              ? { ...x, completions: done ? x.completions.filter((d) => d !== date) : [...x.completions, date].sort() }
              : x,
          ),
        async () => {
          const updated = done
            ? await api.del<Habit>(`/api/habits/${id}/complete?date=${date}`)
            : await api.post<Habit>(`/api/habits/${id}/complete`, { date });
          replaceHabit(updated);
        },
        "Unable to update your habit.",
      ).catch(() => undefined);
      if (!done) useCompanion.getState().react("celebrate", "Small habits, beautiful routines.");
    },

    // ───────── Calendar ─────────
    async addEvent(input) {
      try {
        const ev = await api.post<CalendarEvent>("/api/events", input);
        set((s) => ({ events: [...(s.events ?? []), ev] }));
        return ev;
      } catch (e) {
        toast.error(errMsg(e, "Unable to save this event."));
        return null;
      }
    },

    async updateEvent(id, patch) {
      await optimistic(
        "events",
        (evs) => evs.map((e) => (e.id === id ? { ...e, ...patch } : e)),
        async () => {
          const ev = await api.patch<CalendarEvent>(`/api/events/${id}`, patch);
          set((s) => ({ events: s.events?.map((e) => (e.id === id ? ev : e)) }));
        },
        "Unable to update this event.",
      ).catch(() => undefined);
    },

    async deleteEvent(id) {
      await optimistic(
        "events",
        (evs) => evs.filter((e) => e.id !== id),
        async () => void (await api.del(`/api/events/${id}`)),
        "Unable to delete this event.",
      ).catch(() => undefined);
    },

    // ───────── Planner ─────────
    async addBlocks(blocks) {
      try {
        const created = await api.post<TimeBlock[] | TimeBlock>("/api/time-blocks", blocks.length === 1 ? blocks[0] : blocks);
        const list = Array.isArray(created) ? created : [created];
        set((s) => ({ timeBlocks: [...(s.timeBlocks ?? []), ...list] }));
        return true;
      } catch (e) {
        toast.error(errMsg(e, "Unable to add that time block."));
        return false;
      }
    },

    async updateBlock(id, patch) {
      try {
        await optimistic(
          "timeBlocks",
          (bs) => bs.map((b) => (b.id === id ? { ...b, ...patch } : b)),
          async () => {
            const b = await api.patch<TimeBlock>(`/api/time-blocks/${id}`, patch);
            set((s) => ({ timeBlocks: s.timeBlocks?.map((x) => (x.id === id ? b : x)) }));
          },
          "Unable to move that block.",
        );
        return true;
      } catch {
        return false;
      }
    },

    async deleteBlock(id) {
      await optimistic(
        "timeBlocks",
        (bs) => bs.filter((b) => b.id !== id),
        async () => void (await api.del(`/api/time-blocks/${id}`)),
        "Unable to delete that block.",
      ).catch(() => undefined);
    },

    // ───────── Settings ─────────
    async updateSettings(patch) {
      const before = get().settings;
      if (!before) return;
      set({ settings: { ...before, ...patch } });
      mirrorAppearance(patch);
      try {
        const saved = await api.patch<UserSettings>("/api/settings", patch);
        set({ settings: saved });
      } catch (e) {
        set({ settings: before });
        mirrorAppearance(before);
        toast.error(errMsg(e, "Unable to save your settings."));
      }
    },

    async updateProfile(patch) {
      try {
        const me = await api.patch<Me>("/api/profile", patch);
        set({ me });
        toast.success("Profile updated");
      } catch (e) {
        toast.error(errMsg(e, "Unable to update your profile."));
      }
    },

    // ───────── Garden & mixes ─────────
    async unlockReward(key) {
      try {
        const r = await api.post<GardenReward>("/api/garden", { rewardName: key });
        set((s) => ({ garden: [...(s.garden ?? []), r] }));
        useCompanion.getState().react("celebrate", "Your garden is growing!");
        toast.success("Planted in your garden 🌱");
      } catch (e) {
        toast.error(errMsg(e, "Unable to unlock this item."));
      }
    },

    async updateReward(id, patch) {
      await optimistic(
        "garden",
        (gs) => gs.map((g) => (g.id === id ? { ...g, ...patch } : g)),
        async () => void (await api.patch(`/api/garden/${id}`, patch)),
        "Unable to update your garden.",
      ).catch(() => undefined);
    },

    async saveMix(name, levels) {
      try {
        const m = await api.post<SoundMix>("/api/mixes", { name, levels });
        set((s) => ({ mixes: [...(s.mixes ?? []), m] }));
        toast.success(`Saved “${name}”`);
      } catch (e) {
        toast.error(errMsg(e, "Unable to save this mix."));
      }
    },

    async deleteMix(id) {
      await optimistic(
        "mixes",
        (ms) => ms.filter((m) => m.id !== id),
        async () => void (await api.del(`/api/mixes/${id}`)),
        "Unable to delete this mix.",
      ).catch(() => undefined);
    },
  };
});
