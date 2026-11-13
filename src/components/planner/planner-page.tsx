"use client";

import * as React from "react";
import { toast } from "sonner";
import { CalendarCheck2, CheckCircle2, ChevronLeft, ChevronRight, Clock, Pencil, Plus, Sparkles, Trash2, Wand2 } from "lucide-react";
import { useData } from "@/stores/data-store";
import { PageContainer, PageHeader } from "@/components/layout/page-header";
import { Button } from "@/components/ui/button";
import { Card, CardHeader, ProgressBar } from "@/components/ui/misc";
import { Dialog, DialogContent } from "@/components/ui/dialog";
import { Field, Input, Select } from "@/components/ui/input";
import { EmptyState } from "@/components/ui/states";
import { Checkbox, PriorityBadge } from "@/components/tasks/task-row";
import type { TimeBlock } from "@/types";
import { addDays, formatDuration, minToLabel, minToTime, prettyDate, relativeDay, timeToMin, toDateKey, todayKey } from "@/lib/dates";
import { firstFreeSlot, planDay, type Suggestion } from "@/lib/smart-planner";
import { focusSessions, isOverdue } from "@/lib/selectors";
import { SWATCHES, cn, swatch } from "@/lib/utils";

const EMPTY: never[] = [];

const PX_PER_MIN = 1.1;
const SNAP = 15;

type BlockDraft = { id?: string; title: string; start: string; end: string; color: string; taskId: string };

function BlockModal({ open, onOpenChange, draft, date }: { open: boolean; onOpenChange: (v: boolean) => void; draft: BlockDraft | null; date: string }) {
  const tasks = useData((s) => s.tasks) ?? EMPTY;
  const addBlocks = useData((s) => s.addBlocks);
  const updateBlock = useData((s) => s.updateBlock);
  // Remounted (via key) each time it opens.
  const [form, setForm] = React.useState<BlockDraft>(() => draft ?? { title: "", start: "09:00", end: "10:00", color: "blue", taskId: "" });
  const [error, setError] = React.useState<string | null>(null);

  const submit = async (e: React.FormEvent) => {
    e.preventDefault();
    const s = timeToMin(form.start);
    const en = form.end === "00:00" ? 1440 : timeToMin(form.end);
    const title = form.title.trim() || tasks.find((t) => t.id === form.taskId)?.title || "";
    if (!title) return setError("Give this block a title or pick a task");
    if (en <= s) return setError("End time must be after the start");
    const payload = { title, startMin: s, endMin: en, color: form.color, taskId: form.taskId || null };
    const ok = form.id ? await updateBlock(form.id, payload) : await addBlocks([{ ...payload, date }]);
    if (ok) onOpenChange(false);
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent title={form.id ? "Edit time block" : "Add time block"} description={prettyDate(date)} className="sm:max-w-md">
        <form onSubmit={submit} className="space-y-4" noValidate>
          <Field label="Link a task (optional)" htmlFor="b-task">
            <Select id="b-task" value={form.taskId} onChange={(e) => setForm({ ...form, taskId: e.target.value, title: form.title || tasks.find((t) => t.id === e.target.value)?.title || "" })}>
              <option value="">No task</option>
              {tasks
                .filter((t) => t.status !== "DONE" || t.id === form.taskId)
                .map((t) => (
                  <option key={t.id} value={t.id}>
                    {t.title}
                  </option>
                ))}
            </Select>
          </Field>
          <Field label="Title" htmlFor="b-title" error={error ?? undefined}>
            <Input id="b-title" value={form.title} onChange={(e) => setForm({ ...form, title: e.target.value })} placeholder="e.g. Morning routine" maxLength={120} />
          </Field>
          <div className="grid grid-cols-2 gap-3">
            <Field label="Start" htmlFor="b-start">
              <Input id="b-start" type="time" step={900} value={form.start} onChange={(e) => setForm({ ...form, start: e.target.value })} />
            </Field>
            <Field label="End" htmlFor="b-end">
              <Input id="b-end" type="time" step={900} value={form.end} onChange={(e) => setForm({ ...form, end: e.target.value })} />
            </Field>
          </div>
          <div className="flex gap-2" role="radiogroup" aria-label="Colour">
            {Object.entries(SWATCHES).map(([k, v]) => (
              <button key={k} type="button" role="radio" aria-checked={form.color === k} aria-label={v.label} onClick={() => setForm({ ...form, color: k })} className={cn("size-7 rounded-full border-2", form.color === k ? "scale-110 border-ink/40" : "border-transparent")} style={{ background: v.dot }} />
            ))}
          </div>
          <div className="flex justify-end gap-2">
            <Button variant="ghost" onClick={() => onOpenChange(false)}>
              Cancel
            </Button>
            <Button type="submit">{form.id ? "Save" : "Add block"}</Button>
          </div>
        </form>
      </DialogContent>
    </Dialog>
  );
}

function SmartPlanDialog({ open, onOpenChange, date }: { open: boolean; onOpenChange: (v: boolean) => void; date: string }) {
  const tasks = useData((s) => s.tasks) ?? EMPTY;
  const blocks = useData((s) => s.timeBlocks) ?? EMPTY;
  const settings = useData((s) => s.settings)!;
  const updateSettings = useData((s) => s.updateSettings);
  const addBlocks = useData((s) => s.addBlocks);
  // Remounted (via key) each time it opens, so working hours start from settings.
  const [start, setStart] = React.useState(() => minToTime(settings.workStartMin));
  const [end, setEnd] = React.useState(() => minToTime(settings.workEndMin));
  // Track what the user unticked; everything suggested is selected by default.
  const [deselected, setDeselected] = React.useState<Set<string>>(new Set());

  const plan = React.useMemo(() => {
    const now = new Date();
    return planDay({
      date,
      today: todayKey(),
      nowMin: now.getHours() * 60 + now.getMinutes(),
      tasks,
      blocks: blocks.filter((b) => b.date === date),
      workStartMin: timeToMin(start),
      workEndMin: end === "00:00" ? 1440 : timeToMin(end),
    });
  }, [date, tasks, blocks, start, end]);

  const selected = new Set(plan.suggestions.map((s) => s.taskId).filter((id) => !deselected.has(id)));

  const apply = async () => {
    const chosen = plan.suggestions.filter((s) => selected.has(s.taskId));
    if (!chosen.length) return onOpenChange(false);
    const ws = timeToMin(start);
    const we = end === "00:00" ? 1440 : timeToMin(end);
    if (ws !== settings.workStartMin || we !== settings.workEndMin) void updateSettings({ workStartMin: ws, workEndMin: we });
    const ok = await addBlocks(chosen.map((s: Suggestion) => ({ date, startMin: s.startMin, endMin: s.endMin, title: s.title, taskId: s.taskId, color: "lavender" })));
    if (ok) {
      toast.success(`Planned ${chosen.length} task${chosen.length > 1 ? "s" : ""} for ${relativeDay(date).toLowerCase()}`);
      onOpenChange(false);
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent title="Your suggested day" description="Sorted by priority and deadline, fitted into your free time. Nothing is saved until you accept." className="sm:max-w-lg">
        <div className="mb-4 grid grid-cols-2 gap-3">
          <Field label="Start working" htmlFor="sp-s">
            <Input id="sp-s" type="time" step={900} value={start} onChange={(e) => setStart(e.target.value)} />
          </Field>
          <Field label="Finish by" htmlFor="sp-e">
            <Input id="sp-e" type="time" step={900} value={end} onChange={(e) => setEnd(e.target.value)} />
          </Field>
        </div>
        {plan.suggestions.length === 0 ? (
          <EmptyState compact title="Nothing to plan right now." description={date < todayKey() ? "You can't plan a day that's already passed." : "All open tasks are scheduled, or there's no free time left in your working hours."} />
        ) : (
          <ol className="space-y-2">
            {plan.suggestions.map((s) => (
              <li key={s.taskId}>
                <label className="flex cursor-pointer items-center gap-3 rounded-2xl border border-line px-3 py-2.5 hover:bg-bg-2/50">
                  <input
                    type="checkbox"
                    checked={selected.has(s.taskId)}
                    onChange={(e) => {
                      const next = new Set(deselected);
                      if (e.target.checked) next.delete(s.taskId);
                      else next.add(s.taskId);
                      setDeselected(next);
                    }}
                    className="size-4 accent-[var(--accent-strong)]"
                  />
                  <span className="w-28 shrink-0 text-xs font-bold tabular-nums text-accent-strong">
                    {minToLabel(s.startMin)} – {minToLabel(s.endMin)}
                  </span>
                  <span className="min-w-0 flex-1">
                    <span className="block truncate text-sm font-semibold">{s.title}</span>
                    <span className="text-[11px] text-muted">
                      {s.endMin - s.startMin} min · {s.reason}
                    </span>
                  </span>
                </label>
              </li>
            ))}
          </ol>
        )}
        {plan.skipped.length > 0 && plan.suggestions.length > 0 && <p className="mt-3 text-xs text-muted">{plan.skipped.length} task(s) didn&apos;t fit today — try widening your hours.</p>}
        <p className="mt-3 text-xs text-muted">Tip: add estimated durations to tasks for a more accurate plan. A 10-minute break is left after each block.</p>
        <div className="mt-5 flex justify-end gap-2">
          <Button variant="ghost" onClick={() => onOpenChange(false)}>
            Not now
          </Button>
          <Button onClick={apply} disabled={!selected.size}>
            <CalendarCheck2 /> Accept {selected.size || ""}
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  );
}

function Timeline({ date, blocks, onEdit, onCreate }: { date: string; blocks: TimeBlock[]; onEdit: (b: TimeBlock) => void; onCreate: (startMin: number) => void }) {
  const updateBlock = useData((s) => s.updateBlock);
  const sessions = useData((s) => s.sessions) ?? EMPTY;
  const settings = useData((s) => s.settings)!;
  const [drag, setDrag] = React.useState<{ id: string; mode: "move" | "resize"; startY: number; orig: TimeBlock; start: number; end: number } | null>(null);
  const scrollRef = React.useRef<HTMLDivElement>(null);
  const isToday = date === todayKey();
  const [nowMin, setNowMin] = React.useState<number | null>(null);

  const startHour = Math.max(0, Math.min(Math.floor(settings.workStartMin / 60) - 2, ...blocks.map((b) => Math.floor(b.startMin / 60))));
  const endHour = Math.min(24, Math.max(Math.ceil(settings.workEndMin / 60) + 3, ...blocks.map((b) => Math.ceil(b.endMin / 60))));
  const top = (m: number) => (m - startHour * 60) * PX_PER_MIN;

  React.useEffect(() => {
    const tick = () => setNowMin(new Date().getHours() * 60 + new Date().getMinutes());
    tick();
    const id = window.setInterval(tick, 60_000);
    return () => window.clearInterval(id);
  }, []);

  const daySessions = focusSessions(sessions).filter((s) => toDateKey(new Date(s.startedAt)) === date);

  const onPointerDown = (e: React.PointerEvent, b: TimeBlock, mode: "move" | "resize") => {
    if (e.button !== 0) return;
    e.stopPropagation();
    (e.currentTarget as HTMLElement).setPointerCapture(e.pointerId);
    setDrag({ id: b.id, mode, startY: e.clientY, orig: b, start: b.startMin, end: b.endMin });
  };

  const onPointerMove = (e: React.PointerEvent) => {
    if (!drag) return;
    const delta = Math.round((e.clientY - drag.startY) / PX_PER_MIN / SNAP) * SNAP;
    if (drag.mode === "move") {
      const len = drag.orig.endMin - drag.orig.startMin;
      const s = Math.max(0, Math.min(1440 - len, drag.orig.startMin + delta));
      setDrag({ ...drag, start: s, end: s + len });
    } else {
      setDrag({ ...drag, end: Math.max(drag.orig.startMin + SNAP, Math.min(1440, drag.orig.endMin + delta)) });
    }
  };

  const onPointerUp = async () => {
    if (!drag) return;
    const d = drag;
    setDrag(null);
    if (d.start === d.orig.startMin && d.end === d.orig.endMin) {
      if (d.mode === "move") onEdit(d.orig);
      return;
    }
    const clash = blocks.find((o) => o.id !== d.id && o.startMin < d.end && d.start < o.endMin);
    if (clash) return void toast.error(`That overlaps with “${clash.title}”.`);
    await updateBlock(d.id, { startMin: d.start, endMin: d.end });
  };

  const hours = Array.from({ length: endHour - startHour }, (_, i) => startHour + i);

  return (
    <div ref={scrollRef} className="relative max-h-[70vh] overflow-y-auto rounded-2xl" onPointerMove={onPointerMove} onPointerUp={onPointerUp} onPointerCancel={() => setDrag(null)}>
      <div className="relative mt-3" style={{ height: (endHour - startHour) * 60 * PX_PER_MIN }}>
        {hours.map((h) => (
          <button
            key={h}
            type="button"
            onClick={() => onCreate(h * 60)}
            className="group absolute inset-x-0 flex border-t border-line/70 text-left"
            style={{ top: top(h * 60), height: 60 * PX_PER_MIN }}
            aria-label={`Add a block at ${minToLabel(h * 60)}`}
          >
            <span className="w-16 shrink-0 -translate-y-2 pr-2 text-right text-[11px] font-semibold text-muted">{minToLabel(h * 60)}</span>
            <span className="flex-1 rounded-lg transition-colors group-hover:bg-accent-soft/40" />
          </button>
        ))}

        {/* focus sessions */}
        {daySessions.map((s) => {
          const d = new Date(s.startedAt);
          const sm = d.getHours() * 60 + d.getMinutes();
          const len = Math.max(5, Math.round(s.actualDuration / 60));
          if (sm + len < startHour * 60) return null;
          return <span key={s.id} title={`Focus session · ${formatDuration(s.actualDuration)}`} className="absolute right-1 w-1.5 rounded-full bg-accent-strong/60" style={{ top: top(sm), height: len * PX_PER_MIN }} />;
        })}

        {/* now line */}
        {isToday && nowMin !== null && nowMin >= startHour * 60 && nowMin <= endHour * 60 && (
          <div className="pointer-events-none absolute left-14 right-0 z-20 flex items-center" style={{ top: top(nowMin) }}>
            <span className="size-2.5 rounded-full bg-[#e08a8a]" />
            <span className="h-px flex-1 bg-[#e08a8a]" />
          </div>
        )}

        {blocks.map((b) => {
          const live = drag?.id === b.id ? drag : null;
          const s = live ? live.start : b.startMin;
          const en = live ? live.end : b.endMin;
          const sw = swatch(b.color);
          const short = (en - s) * PX_PER_MIN < 44;
          return (
            <div
              key={b.id}
              role="button"
              tabIndex={0}
              onKeyDown={(e) => e.key === "Enter" && onEdit(b)}
              onPointerDown={(e) => onPointerDown(e, b, "move")}
              className={cn(
                "absolute left-[4.25rem] right-4 z-10 cursor-grab touch-none select-none overflow-hidden rounded-xl border-l-4 px-3 shadow-[var(--shadow-soft)] transition-shadow active:cursor-grabbing",
                live && "z-30 shadow-[var(--shadow-lift)] ring-2 ring-accent-strong/40",
                b.completed && "opacity-60",
              )}
              style={{ top: top(s) + 1, height: Math.max(18, (en - s) * PX_PER_MIN - 2), background: sw.bg, borderColor: sw.fg, color: sw.fg }}
              aria-label={`${b.title}, ${minToLabel(s)} to ${minToLabel(en)}. Drag to move.`}
            >
              <div className={cn("flex items-center gap-2", short ? "h-full" : "pt-1.5")}>
                <p className={cn("truncate text-xs font-bold", b.completed && "line-through")}>{b.title}</p>
                <p className="shrink-0 text-[10px] font-semibold opacity-80">
                  {minToLabel(s)} – {minToLabel(en)}
                </p>
              </div>
              <span onPointerDown={(e) => onPointerDown(e, b, "resize")} className="absolute inset-x-0 bottom-0 h-2 cursor-ns-resize" aria-hidden />
            </div>
          );
        })}
      </div>
    </div>
  );
}

export function PlannerPage() {
  const tasks = useData((s) => s.tasks) ?? EMPTY;
  const allBlocks = useData((s) => s.timeBlocks) ?? EMPTY;
  const addBlocks = useData((s) => s.addBlocks);
  const updateBlock = useData((s) => s.updateBlock);
  const deleteBlock = useData((s) => s.deleteBlock);
  const toggleTask = useData((s) => s.toggleTask);
  const [date, setDate] = React.useState(todayKey);
  const [modal, setModal] = React.useState<{ open: boolean; draft: BlockDraft | null }>({ open: false, draft: null });
  const [smartOpen, setSmartOpen] = React.useState(false);

  const blocks = allBlocks.filter((b) => b.date === date).sort((a, b) => a.startMin - b.startMin);
  const linked = new Set(blocks.map((b) => b.taskId).filter(Boolean));
  const unscheduled = tasks.filter((t) => t.status !== "DONE" && !linked.has(t.id) && (!t.dueDate || t.dueDate <= date)).slice(0, 12);
  const doneBlocks = blocks.filter((b) => b.completed || (b.taskId && tasks.find((t) => t.id === b.taskId)?.status === "DONE"));
  const plannedMin = blocks.reduce((s, b) => s + (b.endMin - b.startMin), 0);

  const openCreate = (startMin: number) =>
    setModal({ open: true, draft: { title: "", start: minToTime(startMin), end: minToTime(Math.min(1439, startMin + 60)), color: "blue", taskId: "" } });
  const openEdit = (b: TimeBlock) =>
    setModal({ open: true, draft: { id: b.id, title: b.title, start: minToTime(b.startMin), end: b.endMin >= 1440 ? "00:00" : minToTime(b.endMin), color: b.color, taskId: b.taskId ?? "" } });

  const schedule = async (taskId: string) => {
    const t = tasks.find((x) => x.id === taskId);
    if (!t) return;
    const now = new Date();
    const from = date === todayKey() ? now.getHours() * 60 + now.getMinutes() : 9 * 60;
    const dur = t.estimatedDuration ?? 30;
    const slot = firstFreeSlot(blocks, dur, from);
    if (slot === null) return void toast.error("No free slot left today for this task.");
    if (await addBlocks([{ date, startMin: slot, endMin: slot + dur, title: t.title, taskId: t.id, color: "lavender" }])) toast.success(`Scheduled at ${minToLabel(slot)}`);
  };

  return (
    <PageContainer>
      <PageHeader
        title="Daily Planner"
        subtitle="Give every part of your day a gentle shape."
        actions={
          <>
            <Button variant="soft" onClick={() => setSmartOpen(true)}>
              <Wand2 /> Plan my day
            </Button>
            <Button onClick={() => openCreate(Math.min(22 * 60, (new Date().getHours() + 1) * 60))}>
              <Plus /> Add block
            </Button>
          </>
        }
      />

      <div className="grid gap-5 xl:grid-cols-[1fr_360px]">
        <Card className="p-3 sm:p-5">
          <div className="mb-4 flex flex-wrap items-center justify-between gap-3 px-1">
            <div className="flex items-center gap-1">
              <Button size="icon-sm" variant="ghost" onClick={() => setDate(addDays(date, -1))} aria-label="Previous day">
                <ChevronLeft />
              </Button>
              <Button size="icon-sm" variant="ghost" onClick={() => setDate(addDays(date, 1))} aria-label="Next day">
                <ChevronRight />
              </Button>
              <h2 className="ml-1 font-display text-lg font-bold">{prettyDate(date)}</h2>
            </div>
            <div className="flex items-center gap-2">
              {date !== todayKey() && (
                <Button size="sm" variant="outline" onClick={() => setDate(todayKey())}>
                  Today
                </Button>
              )}
              <Input type="date" value={date} onChange={(e) => e.target.value && setDate(e.target.value)} className="h-8 w-auto text-xs" aria-label="Jump to date" />
            </div>
          </div>
          {blocks.length === 0 && (
            <div className="mb-3 rounded-2xl bg-accent-soft/50 px-4 py-3 text-sm text-ink">
              <Sparkles className="mr-1.5 inline size-4 text-accent-strong" />
              Make a little plan for your day — click any hour to add a block, or let <strong>Plan my day</strong> suggest one.
            </div>
          )}
          <Timeline date={date} blocks={blocks} onEdit={openEdit} onCreate={openCreate} />
        </Card>

        <div className="space-y-5">
          <Card>
            <CardHeader title="Daily progress" icon={<CheckCircle2 />} subtitle={`${formatDuration(plannedMin * 60)} planned`} />
            <ProgressBar value={blocks.length ? (doneBlocks.length / blocks.length) * 100 : 0} color="var(--success)" />
            <p className="mt-2 text-xs text-muted">
              {doneBlocks.length} of {blocks.length} activities done
            </p>
            {blocks.length > 0 && (
              <ul className="mt-4 space-y-1.5">
                {blocks.map((b) => {
                  const task = tasks.find((t) => t.id === b.taskId);
                  const done = b.completed || task?.status === "DONE";
                  return (
                    <li key={b.id} className="group flex items-center gap-2.5 rounded-xl px-1.5 py-1.5 hover:bg-bg-2/50">
                      <Checkbox
                        size="sm"
                        checked={!!done}
                        onChange={() => (task ? void toggleTask(task.id) : void updateBlock(b.id, { completed: !b.completed }))}
                        label={done ? `Mark ${b.title} not done` : `Mark ${b.title} done`}
                      />
                      <span className="w-16 shrink-0 text-[11px] font-bold tabular-nums text-muted">{minToLabel(b.startMin)}</span>
                      <span className={cn("min-w-0 flex-1 truncate text-sm font-semibold", done && "text-muted line-through")}>{b.title}</span>
                      <button onClick={() => openEdit(b)} className="rounded-lg p-1 text-muted opacity-0 hover:text-ink group-hover:opacity-100 focus:opacity-100" aria-label={`Edit ${b.title}`}>
                        <Pencil className="size-3.5" />
                      </button>
                      <button onClick={() => void deleteBlock(b.id)} className="rounded-lg p-1 text-muted opacity-0 hover:text-[#a14a4a] group-hover:opacity-100 focus:opacity-100" aria-label={`Delete ${b.title}`}>
                        <Trash2 className="size-3.5" />
                      </button>
                    </li>
                  );
                })}
              </ul>
            )}
          </Card>

          <Card>
            <CardHeader title="Plan your day" icon={<Clock />} subtitle="Unscheduled tasks" />
            {unscheduled.length ? (
              <ul className="space-y-1.5">
                {unscheduled.map((t) => (
                  <li key={t.id} className="flex items-center gap-2 rounded-2xl border border-line px-3 py-2">
                    <div className="min-w-0 flex-1">
                      <p className="truncate text-sm font-semibold">{t.title}</p>
                      <div className="mt-1 flex flex-wrap items-center gap-1.5">
                        <PriorityBadge priority={t.priority} />
                        <span className={cn("text-[11px] font-semibold", isOverdue(t) ? "text-[#b45555]" : "text-muted")}>
                          {t.estimatedDuration ?? 30} min{t.dueDate ? ` · ${relativeDay(t.dueDate)}` : ""}
                        </span>
                      </div>
                    </div>
                    <Button size="sm" variant="soft" onClick={() => void schedule(t.id)} disabled={date < todayKey()}>
                      Schedule
                    </Button>
                  </li>
                ))}
              </ul>
            ) : (
              <EmptyState compact title="Everything has a place." description="No unscheduled tasks for this day." />
            )}
          </Card>
        </div>
      </div>

      <BlockModal key={`${modal.open}-${modal.draft?.id ?? modal.draft?.start ?? ""}`} open={modal.open} draft={modal.draft} date={date} onOpenChange={(open) => setModal((m) => ({ ...m, open }))} />
      <SmartPlanDialog key={String(smartOpen)} open={smartOpen} onOpenChange={setSmartOpen} date={date} />
    </PageContainer>
  );
}
