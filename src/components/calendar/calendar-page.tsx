"use client";

import * as React from "react";
import { Bell, CalendarPlus, CheckSquare, ChevronLeft, ChevronRight, Clock, ListPlus, Timer, Trash2 } from "lucide-react";
import { useData } from "@/stores/data-store";
import { useUi } from "@/stores/ui-store";
import { PageContainer, PageHeader } from "@/components/layout/page-header";
import { Button } from "@/components/ui/button";
import { Card, Segmented } from "@/components/ui/misc";
import { Dialog, DialogContent } from "@/components/ui/dialog";
import { Field, Input, Select, Textarea } from "@/components/ui/input";
import { ConfirmDialog, EmptyState } from "@/components/ui/states";
import type { CalendarEvent, EventCategory } from "@/types";
import { addDays, formatDuration, fromDateKey, minToLabel, prettyDate, startOfWeekKey, toDateKey, todayKey } from "@/lib/dates";
import { focusSessions, isHabitScheduled } from "@/lib/selectors";
import { cn, swatch } from "@/lib/utils";

const EMPTY: never[] = [];

type View = "month" | "week" | "day";

const CAT_COLORS: Record<EventCategory, string> = { personal: "pink", study: "blue", work: "lavender", health: "green", other: "peach" };
const CATS: EventCategory[] = ["personal", "study", "work", "health", "other"];

const timeOf = (iso: string) => {
  const d = new Date(iso);
  return `${String(d.getHours()).padStart(2, "0")}:${String(d.getMinutes()).padStart(2, "0")}`;
};
const minOf = (iso: string) => {
  const d = new Date(iso);
  return d.getHours() * 60 + d.getMinutes();
};
const combine = (date: string, time: string) => {
  const [h, m] = time.split(":").map(Number);
  const d = fromDateKey(date);
  d.setHours(h, m, 0, 0);
  return d.toISOString();
};

type Draft = { id?: string; title: string; description: string; date: string; start: string; end: string; category: EventCategory; taskId: string };

function EventModal({ open, onOpenChange, draft }: { open: boolean; onOpenChange: (v: boolean) => void; draft: Draft | null }) {
  const tasks = useData((s) => s.tasks) ?? EMPTY;
  const addEvent = useData((s) => s.addEvent);
  const updateEvent = useData((s) => s.updateEvent);
  const deleteEvent = useData((s) => s.deleteEvent);
  // Remounted (via key) every time it opens, so initial state comes straight from the draft.
  const [form, setForm] = React.useState<Draft | null>(draft);
  const [error, setError] = React.useState<string | null>(null);
  const [confirm, setConfirm] = React.useState(false);
  if (!form) return null;

  const submit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!form.title.trim()) return setError("Give the event a title");
    const start = combine(form.date, form.start);
    const end = combine(form.date, form.end);
    if (end <= start) return setError("End must be after start");
    const payload = { title: form.title.trim(), description: form.description.trim() || null, startDateTime: start, endDateTime: end, category: form.category, taskId: form.taskId || null };
    if (form.id) {
      await updateEvent(form.id, payload);
      onOpenChange(false);
    } else if (await addEvent(payload)) onOpenChange(false);
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent title={form.id ? "Edit event" : "New event"} className="sm:max-w-md">
        <form onSubmit={submit} className="space-y-4" noValidate>
          <Field label="Title" htmlFor="e-title" error={error ?? undefined}>
            <Input id="e-title" value={form.title} onChange={(e) => setForm({ ...form, title: e.target.value })} placeholder="e.g. Study group" autoFocus maxLength={120} />
          </Field>
          <div className="grid grid-cols-2 gap-3 sm:grid-cols-3">
            <Field label="Date" htmlFor="e-date" className="col-span-2 sm:col-span-1">
              <Input id="e-date" type="date" value={form.date} onChange={(e) => e.target.value && setForm({ ...form, date: e.target.value })} />
            </Field>
            <Field label="Start" htmlFor="e-start">
              <Input id="e-start" type="time" value={form.start} onChange={(e) => setForm({ ...form, start: e.target.value })} />
            </Field>
            <Field label="End" htmlFor="e-end">
              <Input id="e-end" type="time" value={form.end} onChange={(e) => setForm({ ...form, end: e.target.value })} />
            </Field>
          </div>
          <div>
            <span className="mb-1.5 block text-xs font-semibold text-muted">Category</span>
            <div className="flex flex-wrap gap-1.5">
              {CATS.map((c) => {
                const sw = swatch(CAT_COLORS[c]);
                return (
                  <button key={c} type="button" onClick={() => setForm({ ...form, category: c })} className={cn("rounded-full border-2 px-3 py-1 text-xs font-bold capitalize", form.category === c ? "border-current" : "border-transparent")} style={{ background: sw.bg, color: sw.fg }} aria-pressed={form.category === c}>
                    {c}
                  </button>
                );
              })}
            </div>
          </div>
          <Field label="Linked task" htmlFor="e-task">
            <Select id="e-task" value={form.taskId} onChange={(e) => setForm({ ...form, taskId: e.target.value })}>
              <option value="">None</option>
              {tasks
                .filter((t) => t.status !== "DONE" || t.id === form.taskId)
                .map((t) => (
                  <option key={t.id} value={t.id}>
                    {t.title}
                  </option>
                ))}
            </Select>
          </Field>
          <Field label="Notes" htmlFor="e-desc">
            <Textarea id="e-desc" rows={2} value={form.description} onChange={(e) => setForm({ ...form, description: e.target.value })} maxLength={1000} />
          </Field>
          <div className="flex items-center justify-between gap-2">
            {form.id ? (
              <Button variant="danger" onClick={() => setConfirm(true)}>
                <Trash2 /> Delete
              </Button>
            ) : (
              <span />
            )}
            <div className="flex gap-2">
              <Button variant="ghost" onClick={() => onOpenChange(false)}>
                Cancel
              </Button>
              <Button type="submit">{form.id ? "Save" : "Create event"}</Button>
            </div>
          </div>
        </form>
        <ConfirmDialog
          open={confirm}
          onOpenChange={setConfirm}
          title="Delete this event?"
          onConfirm={async () => {
            await deleteEvent(form.id!);
            onOpenChange(false);
          }}
        />
      </DialogContent>
    </Dialog>
  );
}

function useDayItems() {
  const events = useData((s) => s.events) ?? EMPTY;
  const tasks = useData((s) => s.tasks) ?? EMPTY;
  const blocks = useData((s) => s.timeBlocks) ?? EMPTY;
  const sessions = useData((s) => s.sessions) ?? EMPTY;
  const habits = useData((s) => s.habits) ?? EMPTY;
  return React.useCallback(
    (key: string) => ({
      events: events.filter((e) => toDateKey(new Date(e.startDateTime)) === key).sort((a, b) => a.startDateTime.localeCompare(b.startDateTime)),
      tasks: tasks.filter((t) => t.dueDate === key),
      blocks: blocks.filter((b) => b.date === key),
      sessions: focusSessions(sessions).filter((s) => toDateKey(new Date(s.startedAt)) === key),
      reminders: habits.filter((h) => !h.paused && h.reminderTime && isHabitScheduled(h, key)),
    }),
    [events, tasks, blocks, sessions, habits],
  );
}

function Chip({ color, children, done }: { color: string; children: React.ReactNode; done?: boolean }) {
  const sw = swatch(color);
  return (
    <span className={cn("block truncate rounded-md px-1.5 py-0.5 text-[11px] font-semibold", done && "line-through opacity-60")} style={{ background: sw.bg, color: sw.fg }}>
      {children}
    </span>
  );
}

function MonthView({ cursor, selected, onSelect, onOpenEvent }: { cursor: string; selected: string; onSelect: (k: string) => void; onOpenEvent: (e: CalendarEvent) => void }) {
  const itemsFor = useDayItems();
  const updateEvent = useData((s) => s.updateEvent);
  const first = fromDateKey(cursor);
  first.setDate(1);
  const gridStart = startOfWeekKey(toDateKey(first), 1);
  const month = first.getMonth();
  const today = todayKey();
  const days = Array.from({ length: 42 }, (_, i) => addDays(gridStart, i));
  const [dragOver, setDragOver] = React.useState<string | null>(null);

  const moveEvent = (id: string, toKey: string) => {
    const ev = useData.getState().events?.find((e) => e.id === id);
    if (!ev) return;
    const s = new Date(ev.startDateTime);
    const e = new Date(ev.endDateTime);
    const target = fromDateKey(toKey);
    const diff = Math.round((target.getTime() - fromDateKey(toDateKey(s)).getTime()) / 86400000);
    if (!diff) return;
    s.setDate(s.getDate() + diff);
    e.setDate(e.getDate() + diff);
    void updateEvent(id, { startDateTime: s.toISOString(), endDateTime: e.toISOString() });
  };

  return (
    <div>
      <div className="mb-2 grid grid-cols-7 text-center text-[11px] font-bold uppercase tracking-wider text-muted">
        {["Mon", "Tue", "Wed", "Thu", "Fri", "Sat", "Sun"].map((d) => (
          <span key={d}>{d}</span>
        ))}
      </div>
      <div className="grid grid-cols-7 gap-1">
        {days.map((k) => {
          const d = fromDateKey(k);
          const it = itemsFor(k);
          const all = [
            ...it.events.map((e) => ({ key: e.id, el: <span key={e.id} draggable onDragStart={(ev) => ev.dataTransfer.setData("text/event", e.id)} onClick={(ev) => (ev.stopPropagation(), onOpenEvent(e))} className="cursor-grab"><Chip color={CAT_COLORS[e.category]}>{timeOf(e.startDateTime)} {e.title}</Chip></span> })),
            ...it.tasks.map((t) => ({ key: t.id, el: <Chip key={t.id} color="gray" done={t.status === "DONE"}>☐ {t.title}</Chip> })),
            ...it.blocks.map((b) => ({ key: b.id, el: <Chip key={b.id} color={b.color}>{minToLabel(b.startMin)} {b.title}</Chip> })),
          ];
          return (
            <div
              key={k}
              role="button"
              tabIndex={0}
              onClick={() => onSelect(k)}
              onKeyDown={(e) => e.key === "Enter" && onSelect(k)}
              onDragOver={(e) => {
                if (e.dataTransfer.types.includes("text/event")) {
                  e.preventDefault();
                  setDragOver(k);
                }
              }}
              onDragLeave={() => setDragOver((v) => (v === k ? null : v))}
              onDrop={(e) => {
                e.preventDefault();
                setDragOver(null);
                const id = e.dataTransfer.getData("text/event");
                if (id) moveEvent(id, k);
              }}
              className={cn(
                "flex min-h-24 flex-col gap-0.5 rounded-xl border p-1.5 text-left transition-colors sm:min-h-28",
                d.getMonth() !== month ? "border-transparent bg-transparent opacity-50" : "border-line/70 bg-card",
                selected === k && "ring-2 ring-accent-strong/50",
                dragOver === k && "bg-accent-soft",
              )}
              aria-label={`${prettyDate(k)}: ${all.length} items`}
            >
              <span className={cn("mb-0.5 grid size-6 place-items-center rounded-full text-xs font-bold", k === today ? "bg-accent-strong text-white dark:text-bg" : "text-ink")}>{d.getDate()}</span>
              <div className="hidden space-y-0.5 sm:block">
                {all.slice(0, 3).map((x) => x.el)}
                {all.length > 3 && <span className="px-1 text-[10px] font-bold text-muted">+{all.length - 3} more</span>}
              </div>
              {all.length > 0 && (
                <div className="flex gap-0.5 sm:hidden">
                  {all.slice(0, 4).map((x) => (
                    <span key={x.key} className="size-1.5 rounded-full bg-accent-strong" />
                  ))}
                </div>
              )}
              {it.sessions.length > 0 && (
                <span className="mt-auto hidden items-center gap-0.5 text-[10px] font-semibold text-accent-strong sm:flex">
                  <Timer className="size-3" />
                  {formatDuration(it.sessions.reduce((s, x) => s + x.actualDuration, 0))}
                </span>
              )}
            </div>
          );
        })}
      </div>
    </div>
  );
}

function TimeGrid({ keys, onOpenEvent, onCreateAt }: { keys: string[]; onOpenEvent: (e: CalendarEvent) => void; onCreateAt: (k: string, min: number) => void }) {
  const itemsFor = useDayItems();
  const PX = 0.8;
  const startH = 6;
  const endH = 24;
  const today = todayKey();
  const hours = Array.from({ length: endH - startH }, (_, i) => startH + i);
  const top = (m: number) => Math.max(0, (m - startH * 60) * PX);
  return (
    <div className="max-h-[70vh] overflow-auto">
      <div className="grid min-w-[640px] pt-2" style={{ gridTemplateColumns: `56px repeat(${keys.length}, minmax(0,1fr))` }}>
        <div />
        {keys.map((k) => (
          <div key={k} className={cn("pb-2 text-center text-xs font-bold", k === today ? "text-accent-strong" : "text-muted")}>
            {fromDateKey(k).toLocaleDateString(undefined, { weekday: "short", day: "numeric" })}
          </div>
        ))}
        <div className="relative" style={{ height: (endH - startH) * 60 * PX }}>
          {hours.map((h) => (
            <span key={h} className="absolute right-2 -translate-y-2 text-[10px] font-semibold text-muted" style={{ top: top(h * 60) }}>
              {minToLabel(h * 60)}
            </span>
          ))}
        </div>
        {keys.map((k) => {
          const it = itemsFor(k);
          return (
            <div key={k} className="relative border-l border-line/60" style={{ height: (endH - startH) * 60 * PX }}>
              {hours.map((h) => (
                <button key={h} type="button" onClick={() => onCreateAt(k, h * 60)} className="absolute inset-x-0 border-t border-line/50 hover:bg-accent-soft/40" style={{ top: top(h * 60), height: 60 * PX }} aria-label={`New event ${prettyDate(k)} at ${minToLabel(h * 60)}`} />
              ))}
              {it.blocks.map((b) => (
                <div key={b.id} className="pointer-events-none absolute inset-x-1 rounded-lg border border-dashed px-1.5 py-0.5 text-[10px] font-semibold opacity-80" style={{ top: top(b.startMin), height: Math.max(14, (b.endMin - b.startMin) * PX), borderColor: swatch(b.color).fg, color: swatch(b.color).fg }}>
                  {b.title}
                </div>
              ))}
              {it.sessions.map((s) => (
                <span key={s.id} className="pointer-events-none absolute right-0.5 w-1 rounded-full bg-accent-strong/60" style={{ top: top(minOf(s.startedAt)), height: Math.max(4, (s.actualDuration / 60) * PX) }} />
              ))}
              {it.events.map((e) => {
                const sm = minOf(e.startDateTime);
                const em = Math.max(sm + 15, minOf(e.endDateTime) || 1440);
                const sw = swatch(CAT_COLORS[e.category]);
                return (
                  <button key={e.id} onClick={() => onOpenEvent(e)} className="absolute inset-x-1 z-10 overflow-hidden rounded-lg border-l-4 px-1.5 py-0.5 text-left text-[11px] font-bold shadow-[var(--shadow-soft)]" style={{ top: top(sm), height: Math.max(18, (em - sm) * PX), background: sw.bg, color: sw.fg, borderColor: sw.fg }}>
                    <span className="block truncate">{e.title}</span>
                    <span className="block truncate text-[10px] font-semibold opacity-80">
                      {timeOf(e.startDateTime)}–{timeOf(e.endDateTime)}
                    </span>
                  </button>
                );
              })}
            </div>
          );
        })}
      </div>
    </div>
  );
}

export function CalendarPage() {
  const openNewTask = useUi((s) => s.openNewTask);
  const toggleTask = useData((s) => s.toggleTask);
  const itemsFor = useDayItems();
  const [view, setView] = React.useState<View>("month");
  const [cursor, setCursor] = React.useState(todayKey);
  const [selected, setSelected] = React.useState(todayKey);
  const [modal, setModal] = React.useState<{ open: boolean; draft: Draft | null }>({ open: false, draft: null });

  const newEvent = (date: string, startMin = 9 * 60) => {
    const s = `${String(Math.floor(startMin / 60)).padStart(2, "0")}:${String(startMin % 60).padStart(2, "0")}`;
    const em = Math.min(23 * 60 + 45, startMin + 60);
    const e = `${String(Math.floor(em / 60)).padStart(2, "0")}:${String(em % 60).padStart(2, "0")}`;
    setModal({ open: true, draft: { title: "", description: "", date, start: s, end: e, category: "personal", taskId: "" } });
  };
  const openEvent = (ev: CalendarEvent) =>
    setModal({ open: true, draft: { id: ev.id, title: ev.title, description: ev.description ?? "", date: toDateKey(new Date(ev.startDateTime)), start: timeOf(ev.startDateTime), end: timeOf(ev.endDateTime), category: ev.category, taskId: ev.taskId ?? "" } });

  const step = (dir: number) => {
    if (view === "month") {
      const d = fromDateKey(cursor);
      d.setDate(1);
      d.setMonth(d.getMonth() + dir);
      setCursor(toDateKey(d));
    } else setCursor(addDays(cursor, dir * (view === "week" ? 7 : 1)));
  };

  const title =
    view === "month"
      ? fromDateKey(cursor).toLocaleDateString(undefined, { month: "long", year: "numeric" })
      : view === "week"
        ? `Week of ${prettyDate(startOfWeekKey(cursor, 1), { month: "short", day: "numeric" })}`
        : prettyDate(cursor);

  const day = itemsFor(selected);
  const dayEmpty = !day.events.length && !day.tasks.length && !day.blocks.length && !day.sessions.length && !day.reminders.length;

  return (
    <PageContainer>
      <PageHeader
        title="Calendar"
        subtitle="Deadlines, plans, and focus — all in one view."
        actions={
          <>
            <Button variant="outline" onClick={() => openNewTask({ dueDate: selected })}>
              <ListPlus /> New task
            </Button>
            <Button onClick={() => newEvent(selected)}>
              <CalendarPlus /> New event
            </Button>
          </>
        }
      />
      <div className="grid gap-5 xl:grid-cols-[1fr_320px]">
        <Card className="p-3 sm:p-5">
          <div className="mb-4 flex flex-wrap items-center justify-between gap-3">
            <div className="flex items-center gap-1">
              <Button size="icon-sm" variant="ghost" onClick={() => step(-1)} aria-label="Previous">
                <ChevronLeft />
              </Button>
              <Button size="icon-sm" variant="ghost" onClick={() => step(1)} aria-label="Next">
                <ChevronRight />
              </Button>
              <h2 className="ml-1 font-display text-lg font-bold">{title}</h2>
              <Button size="sm" variant="outline" className="ml-2" onClick={() => (setCursor(todayKey()), setSelected(todayKey()))}>
                Today
              </Button>
            </div>
            <Segmented label="Calendar view" size="sm" value={view} onChange={setView} options={[{ value: "month", label: "Month" }, { value: "week", label: "Week" }, { value: "day", label: "Day" }]} />
          </div>
          {view === "month" && <MonthView cursor={cursor} selected={selected} onSelect={setSelected} onOpenEvent={openEvent} />}
          {view === "week" && <TimeGrid keys={Array.from({ length: 7 }, (_, i) => addDays(startOfWeekKey(cursor, 1), i))} onOpenEvent={openEvent} onCreateAt={(k, m) => (setSelected(k), newEvent(k, m))} />}
          {view === "day" && <TimeGrid keys={[cursor]} onOpenEvent={openEvent} onCreateAt={(k, m) => newEvent(k, m)} />}
          {view === "month" && <p className="mt-3 text-xs text-muted">Tip: drag an event to another day to move it.</p>}
        </Card>

        <Card className="h-fit">
          <h2 className="font-display text-base font-bold">{prettyDate(selected)}</h2>
          <p className="mb-4 text-xs text-muted">Everything happening on this day</p>
          {dayEmpty ? (
            <EmptyState compact title="Make a little plan for your day." action={<Button size="sm" variant="soft" onClick={() => newEvent(selected)}>Add an event</Button>} />
          ) : (
            <div className="space-y-4">
              {day.events.length > 0 && (
                <section>
                  <h3 className="mb-1.5 text-[11px] font-bold uppercase tracking-wider text-muted">Events</h3>
                  <ul className="space-y-1">
                    {day.events.map((e) => (
                      <li key={e.id}>
                        <button onClick={() => openEvent(e)} className="flex w-full items-center gap-2 rounded-xl px-2 py-1.5 text-left hover:bg-bg-2/60">
                          <span className="size-2.5 rounded-full" style={{ background: swatch(CAT_COLORS[e.category]).fg }} />
                          <span className="flex-1 truncate text-sm font-semibold">{e.title}</span>
                          <span className="text-[11px] text-muted">{timeOf(e.startDateTime)}</span>
                        </button>
                      </li>
                    ))}
                  </ul>
                </section>
              )}
              {day.tasks.length > 0 && (
                <section>
                  <h3 className="mb-1.5 text-[11px] font-bold uppercase tracking-wider text-muted">Deadlines</h3>
                  <ul className="space-y-1">
                    {day.tasks.map((t) => (
                      <li key={t.id} className="flex items-center gap-2 px-2 py-1">
                        <button onClick={() => void toggleTask(t.id)} aria-label={t.status === "DONE" ? `Undo ${t.title}` : `Complete ${t.title}`}>
                          <CheckSquare className={cn("size-4", t.status === "DONE" ? "text-[#5a9a66]" : "text-muted")} />
                        </button>
                        <span className={cn("flex-1 truncate text-sm", t.status === "DONE" && "text-muted line-through")}>{t.title}</span>
                        {t.dueTime && <span className="text-[11px] text-muted">{t.dueTime}</span>}
                      </li>
                    ))}
                  </ul>
                </section>
              )}
              {day.blocks.length > 0 && (
                <section>
                  <h3 className="mb-1.5 text-[11px] font-bold uppercase tracking-wider text-muted">Time blocks</h3>
                  <ul className="space-y-1">
                    {day.blocks.map((b) => (
                      <li key={b.id} className="flex items-center gap-2 px-2 py-1 text-sm">
                        <Clock className="size-3.5 text-muted" />
                        <span className="flex-1 truncate">{b.title}</span>
                        <span className="text-[11px] text-muted">{minToLabel(b.startMin)}</span>
                      </li>
                    ))}
                  </ul>
                </section>
              )}
              {day.reminders.length > 0 && (
                <section>
                  <h3 className="mb-1.5 text-[11px] font-bold uppercase tracking-wider text-muted">Habit reminders</h3>
                  <ul className="space-y-1">
                    {day.reminders.map((h) => (
                      <li key={h.id} className="flex items-center gap-2 px-2 py-1 text-sm">
                        <Bell className="size-3.5 text-muted" />
                        <span className="flex-1 truncate">{h.name}</span>
                        <span className="text-[11px] text-muted">{h.reminderTime}</span>
                      </li>
                    ))}
                  </ul>
                </section>
              )}
              {day.sessions.length > 0 && (
                <section>
                  <h3 className="mb-1.5 text-[11px] font-bold uppercase tracking-wider text-muted">Focus</h3>
                  <p className="flex items-center gap-2 px-2 text-sm">
                    <Timer className="size-3.5 text-accent-strong" />
                    {day.sessions.length} session{day.sessions.length > 1 ? "s" : ""} · {formatDuration(day.sessions.reduce((s, x) => s + x.actualDuration, 0))}
                  </p>
                </section>
              )}
            </div>
          )}
        </Card>
      </div>
      <EventModal key={`${modal.open}-${modal.draft?.id ?? ""}-${modal.draft?.date}-${modal.draft?.start}`} open={modal.open} draft={modal.draft} onOpenChange={(open) => setModal((m) => ({ ...m, open }))} />
    </PageContainer>
  );
}
