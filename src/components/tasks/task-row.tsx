"use client";

import * as React from "react";
import { useRouter } from "next/navigation";
import { motion, AnimatePresence } from "framer-motion";
import { AlarmClock, CalendarDays, Check, Copy, Flag, ListChecks, MoreHorizontal, Pencil, Play, Timer, Trash2 } from "lucide-react";
import type { Priority, Task } from "@/types";
import { useData } from "@/stores/data-store";
import { useUi } from "@/stores/ui-store";
import { useTimer } from "@/stores/timer-store";
import { Badge, Menu, MenuContent, MenuItem, MenuSeparator, MenuTrigger } from "@/components/ui/misc";
import { ConfirmDialog } from "@/components/ui/states";
import { PRIORITY_META, cn, swatch } from "@/lib/utils";
import { formatDuration, relativeDay } from "@/lib/dates";
import { isOverdue } from "@/lib/selectors";

export function Checkbox({ checked, onChange, label, size = "md" }: { checked: boolean; onChange: () => void; label: string; size?: "sm" | "md" }) {
  return (
    <button
      type="button"
      role="checkbox"
      aria-checked={checked}
      aria-label={label}
      onClick={(e) => {
        e.stopPropagation();
        onChange();
      }}
      className={cn(
        "relative grid shrink-0 place-items-center rounded-full border-2 transition-colors duration-200",
        size === "sm" ? "size-[18px]" : "size-[22px]",
        checked ? "border-success bg-success" : "border-line bg-card hover:border-accent-strong",
      )}
    >
      <AnimatePresence>
        {checked && (
          <motion.span initial={{ scale: 0 }} animate={{ scale: 1 }} exit={{ scale: 0 }} transition={{ type: "spring", stiffness: 600, damping: 25 }}>
            <Check className={cn("text-white", size === "sm" ? "size-3" : "size-3.5")} strokeWidth={3} />
          </motion.span>
        )}
      </AnimatePresence>
      <AnimatePresence>
        {checked && (
          <motion.span
            className="pointer-events-none absolute inset-0 rounded-full border-2 border-success"
            initial={{ scale: 1, opacity: 0.8 }}
            animate={{ scale: 1.9, opacity: 0 }}
            transition={{ duration: 0.5 }}
          />
        )}
      </AnimatePresence>
    </button>
  );
}

export function PriorityBadge({ priority }: { priority: Priority }) {
  const m = PRIORITY_META[priority];
  const sw = swatch(m.color);
  return (
    <Badge style={{ background: sw.bg, color: sw.fg }}>
      <Flag className="size-3" aria-hidden />
      {m.label}
    </Badge>
  );
}

export function useStartFocus() {
  const router = useRouter();
  return (taskId: string | null) => {
    const t = useTimer.getState();
    if (t.status !== "idle" && t.mode === "FOCUS" && t.taskId === taskId) {
      router.push("/focus");
      return;
    }
    if (t.mode !== "FOCUS" || t.status !== "idle") t.setMode("FOCUS");
    t.setTask(taskId);
    t.start();
    router.push("/focus");
  };
}

export function TaskRow({ task, compact, dragHandle }: { task: Task; compact?: boolean; dragHandle?: React.ReactNode }) {
  const categories = useData((s) => s.categories);
  const projects = useData((s) => s.projects);
  const toggleTask = useData((s) => s.toggleTask);
  const updateTask = useData((s) => s.updateTask);
  const deleteTask = useData((s) => s.deleteTask);
  const duplicateTask = useData((s) => s.duplicateTask);
  const openEdit = useUi((s) => s.openEditTask);
  const activeTaskId = useTimer((s) => (s.status !== "idle" && s.mode === "FOCUS" ? s.taskId : null));
  const startFocus = useStartFocus();
  const [confirm, setConfirm] = React.useState(false);

  const cat = categories?.find((c) => c.id === task.categoryId);
  const proj = projects?.find((p) => p.id === task.projectId);
  const done = task.status === "DONE";
  const overdue = isOverdue(task);
  const subDone = task.subtasks.filter((s) => s.completed).length;
  const focusing = activeTaskId === task.id;

  return (
    <>
      <motion.div
        layout="position"
        className={cn(
          "group flex items-start gap-3 rounded-2xl border border-transparent px-3 transition-colors hover:border-line hover:bg-bg-2/50",
          compact ? "py-2" : "py-3",
          focusing && "border-accent/60 bg-accent-soft/50",
        )}
      >
        {dragHandle}
        <div className="pt-0.5">
          <Checkbox checked={done} onChange={() => void toggleTask(task.id)} label={done ? `Mark “${task.title}” as not done` : `Complete “${task.title}”`} />
        </div>
        <button type="button" onClick={() => openEdit(task)} className="min-w-0 flex-1 text-left" aria-label={`Open “${task.title}”`}>
          <p className={cn("break-words text-sm font-semibold leading-snug transition-colors", done ? "text-muted line-through decoration-muted/60" : "text-ink")}>
            {task.title}
          </p>
          {!compact && task.description && <p className="mt-0.5 line-clamp-1 text-xs text-muted">{task.description}</p>}
          <div className="mt-1.5 flex flex-wrap items-center gap-1.5">
            {!done && <PriorityBadge priority={task.priority} />}
            {cat && (
              <Badge style={{ background: swatch(cat.color).bg, color: swatch(cat.color).fg }}>
                <span className="size-1.5 rounded-full" style={{ background: swatch(cat.color).fg }} />
                {cat.name}
              </Badge>
            )}
            {proj && !compact && <Badge className="bg-bg-2 text-muted">{proj.name}</Badge>}
            {task.dueDate && (
              <Badge className={cn(overdue ? "bg-danger/20 text-[#a14a4a] dark:text-danger" : "bg-bg-2 text-muted")}>
                {overdue ? <AlarmClock className="size-3" /> : <CalendarDays className="size-3" />}
                {overdue ? "Overdue · " : ""}
                {relativeDay(task.dueDate)}
                {task.dueTime ? ` · ${task.dueTime}` : ""}
              </Badge>
            )}
            {task.subtasks.length > 0 && (
              <Badge className="bg-bg-2 text-muted">
                <ListChecks className="size-3" />
                {subDone}/{task.subtasks.length}
              </Badge>
            )}
            {task.focusSeconds >= 60 && (
              <Badge className="bg-accent-soft text-accent-strong">
                <Timer className="size-3" />
                {formatDuration(task.focusSeconds)} focused
              </Badge>
            )}
            {!compact && task.tags.map((t) => <span key={t} className="text-[11px] font-semibold text-muted">#{t}</span>)}
          </div>
        </button>
        <div className="flex shrink-0 items-center gap-0.5">
          {!done && (
            <button
              type="button"
              onClick={() => startFocus(task.id)}
              className={cn(
                "flex items-center gap-1 rounded-xl px-2 py-1.5 text-xs font-bold transition-all",
                focusing ? "bg-accent-strong text-white dark:text-bg" : "text-accent-strong opacity-100 hover:bg-accent-soft sm:opacity-0 sm:focus:opacity-100 sm:group-hover:opacity-100",
              )}
              aria-label={focusing ? "Focusing on this task" : `Start focus on “${task.title}”`}
            >
              <Play className="size-3 fill-current" />
              <span className="hidden sm:inline">{focusing ? "Focusing" : "Focus"}</span>
            </button>
          )}
          <Menu>
            <MenuTrigger asChild>
              <button className="rounded-xl p-1.5 text-muted transition-colors hover:bg-bg-2 hover:text-ink" aria-label={`More actions for “${task.title}”`}>
                <MoreHorizontal className="size-4" />
              </button>
            </MenuTrigger>
            <MenuContent>
              <MenuItem icon={<Pencil />} onSelect={() => openEdit(task)}>
                Edit task
              </MenuItem>
              {!done && (
                <MenuItem icon={<Play />} onSelect={() => startFocus(task.id)}>
                  Start focus
                </MenuItem>
              )}
              <MenuItem icon={<Copy />} onSelect={() => void duplicateTask(task.id)}>
                Duplicate
              </MenuItem>
              <MenuSeparator />
              <p className="px-2.5 pb-1 pt-1.5 text-[11px] font-bold uppercase tracking-wider text-muted">Priority</p>
              {(Object.keys(PRIORITY_META) as Priority[]).map((p) => (
                <MenuItem
                  key={p}
                  icon={<span className="grid size-4 place-items-center"><span className="size-2 rounded-full" style={{ background: swatch(PRIORITY_META[p].color).fg }} /></span>}
                  onSelect={() => void updateTask(task.id, { priority: p })}
                >
                  {PRIORITY_META[p].label}
                  {task.priority === p && <Check className="ml-auto !size-3.5 text-accent-strong" />}
                </MenuItem>
              ))}
              <MenuSeparator />
              <MenuItem icon={<Trash2 />} danger onSelect={() => setConfirm(true)}>
                Delete
              </MenuItem>
            </MenuContent>
          </Menu>
        </div>
      </motion.div>
      <ConfirmDialog
        open={confirm}
        onOpenChange={setConfirm}
        title="Delete this task?"
        description={`“${task.title}” and its subtasks will be removed. Focus history stays in your stats.`}
        onConfirm={() => deleteTask(task.id)}
      />
    </>
  );
}
