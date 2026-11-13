"use client";

import { create } from "zustand";
import type { Task } from "@/types";

interface TaskModalState {
  open: boolean;
  task: Task | null;
  defaults: Partial<Task>;
}

interface UiState {
  taskModal: TaskModalState;
  openNewTask: (defaults?: Partial<Task>) => void;
  openEditTask: (task: Task) => void;
  closeTaskModal: () => void;
  shortcutsOpen: boolean;
  setShortcutsOpen: (v: boolean) => void;
}

export const useUi = create<UiState>()((set) => ({
  taskModal: { open: false, task: null, defaults: {} },
  openNewTask: (defaults = {}) => set({ taskModal: { open: true, task: null, defaults } }),
  openEditTask: (task) => set({ taskModal: { open: true, task, defaults: {} } }),
  closeTaskModal: () => set((s) => ({ taskModal: { ...s.taskModal, open: false } })),
  shortcutsOpen: false,
  setShortcutsOpen: (shortcutsOpen) => set({ shortcutsOpen }),
}));
