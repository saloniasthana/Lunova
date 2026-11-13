"use client";

import * as React from "react";
import { motion } from "framer-motion";
import { Bell, Flame, MoreHorizontal, Pause, Pencil, Play, Plus, Trash2, Trophy } from "lucide-react";
import { useData } from "@/stores/data-store";
import { PageContainer, PageHeader } from "@/components/layout/page-header";
import { Button } from "@/components/ui/button";
import { Badge, Card, Menu, MenuContent, MenuItem, MenuSeparator, MenuTrigger, ProgressRing } from "@/components/ui/misc";
import { Dialog, DialogContent } from "@/components/ui/dialog";
import { Field, Input, Select } from "@/components/ui/input";
import { ConfirmDialog, EmptyState } from "@/components/ui/states";
import { HABIT_COLORS, HABIT_ICONS, STARTER_HABITS } from "./habit-icons";
import type { Habit, HabitFrequency } from "@/types";
import { habitStats, isHabitScheduled } from "@/lib/selectors";
import { addDays, fromDateKey, prettyDate, startOfWeekKey, todayKey } from "@/lib/dates";
import { cn } from "@/lib/utils";

const DOW = ["Sun", "Mon", "Tue", "Wed", "Thu", "Fri", "Sat"];

function freqLabel(h: Pick<Habit, "frequency" | "days">) {
  if (h.frequency === "daily") return "Every day";
  if (h.frequency === "weekdays") return "Weekdays";
  if (h.frequency === "weekends") return "Weekends";
  return h.days.length ? h.days.map((d) => DOW[d]).join(", ") : "Custom";
}

function HabitModal({ open, onOpenChange, habit }: { open: boolean; onOpenChange: (v: boolean) => void; habit: Habit | null }) {
  const addHabit = useData((s) => s.addHabit);
  const updateHabit = useData((s) => s.updateHabit);
  // Remounted (via key) each time it opens, so the initial state comes from props.
  const [form, setForm] = React.useState(() =>
    habit
      ? { name: habit.name, description: habit.description ?? "", icon: habit.icon, color: habit.color, frequency: habit.frequency, days: habit.days, target: habit.target, reminderTime: habit.reminderTime ?? "", startDate: habit.startDate }
      : { name: "", description: "", icon: "sparkles", color: HABIT_COLORS[0], frequency: "daily" as HabitFrequency, days: [] as number[], target: 7, reminderTime: "", startDate: todayKey() },
  );
  const [error, setError] = React.useState<string | null>(null);
  const [busy, setBusy] = React.useState(false);

  const maxTarget = form.frequency === "weekdays" ? 5 : form.frequency === "weekends" ? 2 : form.frequency === "custom" ? Math.max(1, form.days.length) : 7;

  const submit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!form.name.trim()) return setError("Name your habit");
    if (form.frequency === "custom" && !form.days.length) return setError("Pick at least one day");
    setBusy(true);
    const payload = {
      name: form.name.trim(),
      description: form.description.trim() || null,
      icon: form.icon,
      color: form.color,
      frequency: form.frequency,
      days: form.frequency === "custom" ? form.days : [],
      target: Math.min(form.target, maxTarget),
      reminderTime: form.reminderTime || null,
      startDate: form.startDate,
    };
    if (habit) {
      await updateHabit(habit.id, payload);
      onOpenChange(false);
    } else if (await addHabit(payload)) onOpenChange(false);
    setBusy(false);
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent title={habit ? "Edit habit" : "New habit"} description={habit ? undefined : "Small, steady, kind to yourself."}>
        <form onSubmit={submit} className="space-y-4" noValidate>
          <Field label="Habit name" htmlFor="h-name" error={error ?? undefined}>
            <Input id="h-name" value={form.name} onChange={(e) => setForm({ ...form, name: e.target.value })} placeholder="e.g. Read for 30 minutes" autoFocus maxLength={80} />
          </Field>
          <Field label="Description" htmlFor="h-desc">
            <Input id="h-desc" value={form.description} onChange={(e) => setForm({ ...form, description: e.target.value })} placeholder="Why it matters to you (optional)" maxLength={300} />
          </Field>
          <div>
            <span className="mb-1.5 block text-xs font-semibold text-muted">Icon & colour</span>
            <div className="flex flex-wrap gap-1.5">
              {Object.entries(HABIT_ICONS).map(([k, Icon]) => (
                <button
                  key={k}
                  type="button"
                  onClick={() => setForm({ ...form, icon: k })}
                  className={cn("grid size-9 place-items-center rounded-xl border-2 transition-colors", form.icon === k ? "border-accent-strong bg-accent-soft text-accent-strong" : "border-transparent bg-bg-2 text-muted hover:text-ink")}
                  aria-label={`Icon ${k}`}
                  aria-pressed={form.icon === k}
                >
                  <Icon className="size-4" />
                </button>
              ))}
            </div>
            <div className="mt-2 flex gap-2">
              {HABIT_COLORS.map((c) => (
                <button key={c} type="button" onClick={() => setForm({ ...form, color: c })} className={cn("size-7 rounded-full border-2 transition-transform", form.color === c ? "scale-110 border-ink/40" : "border-transparent")} style={{ background: c }} aria-label={`Colour ${c}`} aria-pressed={form.color === c} />
              ))}
            </div>
          </div>
          <div className="grid gap-3 sm:grid-cols-2">
            <Field label="Frequency" htmlFor="h-freq">
              <Select id="h-freq" value={form.frequency} onChange={(e) => setForm({ ...form, frequency: e.target.value as HabitFrequency })}>
                <option value="daily">Every day</option>
                <option value="weekdays">Weekdays</option>
                <option value="weekends">Weekends</option>
                <option value="custom">Selected days</option>
              </Select>
            </Field>
            <Field label="Weekly target (days)" htmlFor="h-target" hint={`Up to ${maxTarget} for this schedule`}>
              <Input id="h-target" type="number" min={1} max={maxTarget} value={Math.min(form.target, maxTarget)} onChange={(e) => setForm({ ...form, target: Math.max(1, Math.min(maxTarget, Number(e.target.value) || 1)) })} />
            </Field>
          </div>
          {form.frequency === "custom" && (
            <div className="flex flex-wrap gap-1.5" role="group" aria-label="Days of the week">
              {DOW.map((d, i) => (
                <button
                  key={d}
                  type="button"
                  onClick={() => setForm({ ...form, days: form.days.includes(i) ? form.days.filter((x) => x !== i) : [...form.days, i].sort() })}
                  className={cn("rounded-xl px-3 py-1.5 text-xs font-bold transition-colors", form.days.includes(i) ? "bg-accent-strong text-white dark:text-bg" : "bg-bg-2 text-muted hover:text-ink")}
                  aria-pressed={form.days.includes(i)}
                >
                  {d}
                </button>
              ))}
            </div>
          )}
          <div className="grid gap-3 sm:grid-cols-2">
            <Field label="Reminder time" htmlFor="h-rem" hint="Needs notifications enabled in Settings">
              <Input id="h-rem" type="time" value={form.reminderTime} onChange={(e) => setForm({ ...form, reminderTime: e.target.value })} />
            </Field>
            <Field label="Start date" htmlFor="h-start">
              <Input id="h-start" type="date" value={form.startDate} max={todayKey()} onChange={(e) => setForm({ ...form, startDate: e.target.value || todayKey() })} />
            </Field>
          </div>
          <div className="flex justify-end gap-2 pt-1">
            <Button variant="ghost" onClick={() => onOpenChange(false)}>
              Cancel
            </Button>
            <Button type="submit" disabled={busy}>
              {habit ? "Save changes" : "Create habit"}
            </Button>
          </div>
        </form>
      </DialogContent>
    </Dialog>
  );
}

function Heatmap({ habit, weeks = 18 }: { habit: Habit; weeks?: number }) {
  const today = todayKey();
  const start = addDays(startOfWeekKey(today, 0), -(weeks - 1) * 7);
  const done = new Set(habit.completions);
  const cols = Array.from({ length: weeks }, (_, w) => Array.from({ length: 7 }, (_, d) => addDays(start, w * 7 + d)));
  return (
    <div className="overflow-x-auto pb-1">
      <div className="flex w-max gap-[3px]" role="img" aria-label={`${habit.name}: ${habit.completions.length} completions in total`}>
        {cols.map((col, i) => (
          <div key={i} className="flex flex-col gap-[3px]">
            {col.map((k) => {
              const future = k > today;
              const scheduled = isHabitScheduled(habit, k);
              const hit = done.has(k);
              return (
                <span
                  key={k}
                  title={`${prettyDate(k, { month: "short", day: "numeric" })}${hit ? " · done" : ""}`}
                  className={cn("size-3 rounded-[4px]", future && "opacity-0", !hit && !scheduled && "opacity-40")}
                  style={{ background: hit ? habit.color : "var(--bg-2)", outline: k === today ? "1.5px solid var(--accent-strong)" : undefined }}
                />
              );
            })}
          </div>
        ))}
      </div>
    </div>
  );
}

function HabitCard({ habit, onEdit }: { habit: Habit; onEdit: () => void }) {
  const toggleHabit = useData((s) => s.toggleHabit);
  const updateHabit = useData((s) => s.updateHabit);
  const deleteHabit = useData((s) => s.deleteHabit);
  const [confirm, setConfirm] = React.useState(false);
  const today = todayKey();
  const st = habitStats(habit, today);
  const Icon = HABIT_ICONS[habit.icon] ?? HABIT_ICONS.sparkles;
  const weekStart = startOfWeekKey(today, 1);
  const days = Array.from({ length: 7 }, (_, i) => addDays(weekStart, i));
  const weekDone = days.filter((d) => habit.completions.includes(d)).length;

  return (
    <Card className={cn("flex flex-col gap-4", habit.paused && "opacity-70")}>
      <div className="flex items-start gap-3">
        <span className="grid size-11 shrink-0 place-items-center rounded-2xl" style={{ background: `${habit.color}55`, color: "#4a4a55" }}>
          <Icon className="size-5" />
        </span>
        <div className="min-w-0 flex-1">
          <h3 className="truncate font-display text-base font-bold">{habit.name}</h3>
          <p className="truncate text-xs text-muted">
            {freqLabel(habit)}
            {habit.reminderTime && (
              <span className="ml-1.5 inline-flex items-center gap-0.5">
                · <Bell className="size-3" /> {habit.reminderTime}
              </span>
            )}
          </p>
        </div>
        {habit.paused && <Badge className="bg-bg-2 text-muted">Paused</Badge>}
        <Menu>
          <MenuTrigger asChild>
            <button className="rounded-xl p-1.5 text-muted hover:bg-bg-2 hover:text-ink" aria-label={`Actions for ${habit.name}`}>
              <MoreHorizontal className="size-4" />
            </button>
          </MenuTrigger>
          <MenuContent>
            <MenuItem icon={<Pencil />} onSelect={onEdit}>
              Edit habit
            </MenuItem>
            <MenuItem icon={habit.paused ? <Play /> : <Pause />} onSelect={() => void updateHabit(habit.id, { paused: !habit.paused })}>
              {habit.paused ? "Resume" : "Pause"}
            </MenuItem>
            <MenuSeparator />
            <MenuItem icon={<Trash2 />} danger onSelect={() => setConfirm(true)}>
              Delete
            </MenuItem>
          </MenuContent>
        </Menu>
      </div>

      {/* This week */}
      <div className="grid grid-cols-7 gap-1.5">
        {days.map((d) => {
          const hit = habit.completions.includes(d);
          const scheduled = isHabitScheduled(habit, d);
          const future = d > today;
          return (
            <button
              key={d}
              disabled={future || habit.paused || d < habit.startDate}
              onClick={() => void toggleHabit(habit.id, d)}
              className={cn(
                "flex flex-col items-center gap-1 rounded-xl py-1.5 text-[10px] font-bold transition-colors disabled:cursor-not-allowed",
                d === today ? "text-ink" : "text-muted",
                !future && !habit.paused && "hover:bg-bg-2/70",
              )}
              aria-pressed={hit}
              aria-label={`${prettyDate(d)}: ${hit ? "done" : "not done"}`}
            >
              {fromDateKey(d).toLocaleDateString(undefined, { weekday: "narrow" })}
              <motion.span
                animate={{ scale: hit ? [1, 1.2, 1] : 1 }}
                className={cn("grid size-7 place-items-center rounded-full border-2", hit ? "border-transparent" : scheduled && !future ? "border-line" : "border-dashed border-line/60")}
                style={hit ? { background: habit.color } : undefined}
              >
                {hit && <span className="size-2 rounded-full bg-white" />}
              </motion.span>
            </button>
          );
        })}
      </div>

      <div className="grid grid-cols-3 gap-2 text-center">
        <div className="rounded-2xl bg-bg-2/50 py-2">
          <p className="flex items-center justify-center gap-1 font-display text-lg font-extrabold tabular-nums">
            <Flame className="size-4 text-[#cc7d4c]" />
            {st.streak}
          </p>
          <p className="text-[11px] font-semibold text-muted">Current streak</p>
        </div>
        <div className="rounded-2xl bg-bg-2/50 py-2">
          <p className="flex items-center justify-center gap-1 font-display text-lg font-extrabold tabular-nums">
            <Trophy className="size-4 text-[#b8963f]" />
            {st.longest}
          </p>
          <p className="text-[11px] font-semibold text-muted">Longest</p>
        </div>
        <div className="flex flex-col items-center justify-center rounded-2xl bg-bg-2/50 py-2">
          <p className="font-display text-lg font-extrabold tabular-nums">{Math.round(st.month * 100)}%</p>
          <p className="text-[11px] font-semibold text-muted">Last 30 days</p>
        </div>
      </div>

      <div className="flex items-center gap-3">
        <ProgressRing value={Math.min(1, weekDone / habit.target)} size={40} stroke={4} color={habit.color}>
          <span className="text-[10px] font-bold">{weekDone}</span>
        </ProgressRing>
        <p className="text-xs text-muted">
          <span className="font-semibold text-ink">
            {weekDone} of {habit.target}
          </span>{" "}
          days this week {weekDone >= habit.target && "— target reached 🌟"}
        </p>
      </div>

      <Heatmap habit={habit} />

      <ConfirmDialog open={confirm} onOpenChange={setConfirm} title={`Delete “${habit.name}”?`} description="Its history and streaks will be removed permanently." onConfirm={() => deleteHabit(habit.id)} />
    </Card>
  );
}

export function HabitsPage() {
  const habits = useData((s) => s.habits) ?? [];
  const addHabit = useData((s) => s.addHabit);
  const toggleHabit = useData((s) => s.toggleHabit);
  const [modal, setModal] = React.useState<{ open: boolean; habit: Habit | null }>({ open: false, habit: null });
  const today = todayKey();
  const dueToday = habits.filter((h) => !h.paused && isHabitScheduled(h, today));
  const doneToday = dueToday.filter((h) => h.completions.includes(today)).length;
  const missingStarters = STARTER_HABITS.filter((s) => !habits.some((h) => h.name.toLowerCase() === s.name.toLowerCase()));

  return (
    <PageContainer>
      <PageHeader
        title="Habits"
        subtitle="Small habits create beautiful routines."
        actions={
          <Button onClick={() => setModal({ open: true, habit: null })}>
            <Plus /> New habit
          </Button>
        }
      />

      {dueToday.length > 0 && (
        <Card className="mb-5 flex flex-col gap-4 sm:flex-row sm:items-center">
          <ProgressRing value={doneToday / dueToday.length} size={64} stroke={6} color="var(--lavender)">
            <span className="text-sm font-extrabold">
              {doneToday}/{dueToday.length}
            </span>
          </ProgressRing>
          <div className="flex-1">
            <p className="font-display text-base font-bold">{doneToday === dueToday.length ? "All done for today. Beautiful." : "Today's routine"}</p>
            <div className="mt-2 flex flex-wrap gap-2">
              {dueToday.map((h) => {
                const done = h.completions.includes(today);
                const Icon = HABIT_ICONS[h.icon] ?? HABIT_ICONS.sparkles;
                return (
                  <button
                    key={h.id}
                    onClick={() => void toggleHabit(h.id, today)}
                    className={cn("flex items-center gap-1.5 rounded-full border px-3 py-1.5 text-xs font-bold transition-all", done ? "border-transparent text-[#3d3d46]" : "border-line bg-card text-muted hover:text-ink")}
                    style={done ? { background: h.color } : undefined}
                    aria-pressed={done}
                  >
                    <Icon className="size-3.5" />
                    {h.name}
                  </button>
                );
              })}
            </div>
          </div>
        </Card>
      )}

      {habits.length === 0 ? (
        <Card>
          <EmptyState title="Small habits create beautiful routines." description="Start with one tiny habit. You can add a starter below or create your own." action={<Button onClick={() => setModal({ open: true, habit: null })}><Plus /> Create a habit</Button>} />
        </Card>
      ) : (
        <div className="grid gap-5 md:grid-cols-2 xl:grid-cols-3">
          {habits.map((h) => (
            <HabitCard key={h.id} habit={h} onEdit={() => setModal({ open: true, habit: h })} />
          ))}
        </div>
      )}

      {missingStarters.length > 0 && (
        <div className="mt-8">
          <p className="mb-3 text-sm font-semibold text-muted">Need ideas? Add a starter habit:</p>
          <div className="flex flex-wrap gap-2">
            {missingStarters.map((s) => {
              const Icon = HABIT_ICONS[s.icon];
              return (
                <Button key={s.name} variant="outline" size="sm" onClick={() => void addHabit({ ...s, startDate: today })}>
                  <Icon /> {s.name}
                </Button>
              );
            })}
          </div>
        </div>
      )}

      <HabitModal key={`${modal.open}-${modal.habit?.id ?? "new"}`} open={modal.open} habit={modal.habit} onOpenChange={(open) => setModal((m) => ({ ...m, open }))} />
    </PageContainer>
  );
}
