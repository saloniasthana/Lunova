"use client";

import { useEffect } from "react";
import { toast } from "sonner";
import { useData } from "@/stores/data-store";
import { isHabitScheduled } from "@/lib/selectors";
import { todayKey } from "@/lib/dates";

/**
 * Checks once a minute for habit reminders and tasks due now.
 * Shows a browser notification when permitted, otherwise an in-app toast.
 */
export function useReminders() {
  useEffect(() => {
    const fired = new Set<string>();
    const check = () => {
      const { habits, tasks, settings } = useData.getState();
      if (!settings) return;
      const now = new Date();
      const hm = `${String(now.getHours()).padStart(2, "0")}:${String(now.getMinutes()).padStart(2, "0")}`;
      const today = todayKey();
      const notify = (key: string, title: string, body: string) => {
        if (fired.has(key)) return;
        fired.add(key);
        if (settings.notificationsEnabled && "Notification" in window && Notification.permission === "granted") {
          new Notification(title, { body, silent: false });
        } else {
          toast(title, { description: body });
        }
      };
      for (const h of habits ?? []) {
        if (h.paused || !h.reminderTime || h.reminderTime !== hm) continue;
        if (!isHabitScheduled(h, today) || h.completions.includes(today)) continue;
        notify(`h-${h.id}-${today}`, `Time for: ${h.name}`, "A small step for your routine 🌱");
      }
      for (const t of tasks ?? []) {
        if (t.status === "DONE" || t.dueDate !== today || t.dueTime !== hm) continue;
        notify(`t-${t.id}-${today}`, `Due now: ${t.title}`, "Gently reminding you of this task.");
      }
    };
    check();
    const id = window.setInterval(check, 30_000);
    return () => window.clearInterval(id);
  }, []);
}
