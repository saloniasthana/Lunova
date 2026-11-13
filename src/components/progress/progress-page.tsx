"use client";

import * as React from "react";
import { Bar, BarChart, CartesianGrid, ResponsiveContainer, Tooltip, XAxis, YAxis } from "recharts";
import { Award, BarChart3, CalendarCheck, CheckCircle2, Clock, Flame, Timer, TrendingUp } from "lucide-react";
import { useData } from "@/stores/data-store";
import { PageContainer, PageHeader } from "@/components/layout/page-header";
import { Card, CardHeader, Segmented } from "@/components/ui/misc";
import { Input } from "@/components/ui/input";
import { EmptyState } from "@/components/ui/states";
import { addDays, formatDuration, fromDateKey, prettyDate, rangeKeys, startOfWeekKey, toDateKey, todayKey } from "@/lib/dates";
import { currentStreak, focusSessions, longestStreak, productiveDays } from "@/lib/selectors";

const EMPTY: never[] = [];

type Range = "today" | "week" | "month" | "30d" | "custom";

interface Point {
  label: string;
  full: string;
  value: number;
}

function ChartTooltip({ active, payload, unit }: { active?: boolean; payload?: { payload: Point }[]; unit: (v: number) => string }) {
  if (!active || !payload?.length) return null;
  const p = payload[0].payload;
  return (
    <div className="rounded-xl border border-line bg-card px-3 py-2 text-xs shadow-[var(--shadow-lift)]">
      <p className="font-semibold text-muted">{p.full}</p>
      <p className="mt-0.5 font-display text-sm font-extrabold text-ink">{unit(p.value)}</p>
    </div>
  );
}

function ColumnChart({ data, unit, height = 220, horizontal }: { data: Point[]; unit: (v: number) => string; height?: number; horizontal?: boolean }) {
  const axis = { stroke: "var(--line)", tick: { fill: "var(--muted)", fontSize: 11, fontWeight: 600 }, tickLine: false, axisLine: false } as const;
  return (
    <div style={{ height }} className="w-full">
      <ResponsiveContainer width="100%" height="100%">
        <BarChart data={data} layout={horizontal ? "vertical" : "horizontal"} margin={{ top: 8, right: horizontal ? 24 : 4, bottom: 0, left: horizontal ? 8 : -16 }} barCategoryGap={2}>
          <CartesianGrid stroke="var(--line)" strokeWidth={1} vertical={!!horizontal} horizontal={!horizontal} />
          {horizontal ? (
            <>
              <XAxis type="number" {...axis} allowDecimals={false} />
              <YAxis type="category" dataKey="label" {...axis} width={88} />
            </>
          ) : (
            <>
              <XAxis dataKey="label" {...axis} interval="preserveStartEnd" minTickGap={8} />
              <YAxis {...axis} allowDecimals={false} width={40} />
            </>
          )}
          <Tooltip cursor={{ fill: "var(--accent-soft)", opacity: 0.6 }} content={<ChartTooltip unit={unit} />} />
          <Bar dataKey="value" fill="var(--accent-strong)" radius={horizontal ? [0, 4, 4, 0] : [4, 4, 0, 0]} maxBarSize={24} isAnimationActive />
        </BarChart>
      </ResponsiveContainer>
    </div>
  );
}

function ChartCard({ title, subtitle, icon, data, unit, empty, horizontal, height }: { title: string; subtitle?: string; icon: React.ReactNode; data: Point[]; unit: (v: number) => string; empty: string; horizontal?: boolean; height?: number }) {
  const hasData = data.some((d) => d.value > 0);
  return (
    <Card>
      <CardHeader title={title} subtitle={subtitle} icon={icon} />
      {hasData ? (
        <>
          <ColumnChart data={data} unit={unit} horizontal={horizontal} height={height} />
          <details className="mt-3 text-xs">
            <summary className="cursor-pointer font-semibold text-muted hover:text-ink">View as table</summary>
            <table className="mt-2 w-full text-left">
              <thead>
                <tr className="text-muted">
                  <th className="py-1 font-semibold">Period</th>
                  <th className="py-1 text-right font-semibold">Value</th>
                </tr>
              </thead>
              <tbody>
                {data.map((d) => (
                  <tr key={d.full} className="border-t border-line">
                    <td className="py-1">{d.full}</td>
                    <td className="py-1 text-right tabular-nums">{unit(d.value)}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </details>
        </>
      ) : (
        <EmptyState compact title={empty} description="Your progress will appear here as you begin." />
      )}
    </Card>
  );
}

function Stat({ icon, label, value, sub }: { icon: React.ReactNode; label: string; value: string; sub?: string }) {
  return (
    <Card className="p-4 sm:p-5">
      <div className="mb-2 flex items-center gap-2 text-muted [&_svg]:size-4">
        {icon}
        <span className="text-xs font-semibold">{label}</span>
      </div>
      <p className="font-display text-2xl font-extrabold tabular-nums text-ink">{value}</p>
      {sub && <p className="mt-0.5 truncate text-[11px] text-muted">{sub}</p>}
    </Card>
  );
}

export function ProgressPage() {
  const sessions = useData((s) => s.sessions) ?? EMPTY;
  const tasks = useData((s) => s.tasks) ?? EMPTY;
  const categories = useData((s) => s.categories) ?? EMPTY;
  const today = todayKey();
  const [range, setRange] = React.useState<Range>("week");
  const [custom, setCustom] = React.useState({ from: addDays(today, -13), to: today });

  const [from, to] = React.useMemo((): [string, string] => {
    switch (range) {
      case "today":
        return [today, today];
      case "week":
        return [startOfWeekKey(today, 1), today];
      case "month": {
        const d = fromDateKey(today);
        d.setDate(1);
        return [toDateKey(d), today];
      }
      case "30d":
        return [addDays(today, -29), today];
      default:
        return custom.from <= custom.to ? [custom.from, custom.to] : [custom.to, custom.from];
    }
  }, [range, custom, today]);

  const data = React.useMemo(() => {
    const focus = focusSessions(sessions).filter((s) => {
      const k = toDateKey(new Date(s.startedAt));
      return k >= from && k <= to;
    });
    const done = tasks.filter((t) => {
      if (!t.completedAt) return false;
      const k = toDateKey(new Date(t.completedAt));
      return k >= from && k <= to;
    });
    const singleDay = from === to;
    const keys = rangeKeys(from, to);

    const bucket = (dateIso: string) => (singleDay ? String(new Date(dateIso).getHours()) : toDateKey(new Date(dateIso)));
    const buckets: { key: string; label: string; full: string }[] = singleDay
      ? Array.from({ length: 24 }, (_, h) => ({ key: String(h), label: `${h % 12 || 12}${h < 12 ? "a" : "p"}`, full: `${h % 12 || 12}:00 ${h < 12 ? "AM" : "PM"}` }))
      : keys.map((k) => ({
          key: k,
          label: keys.length <= 7 ? fromDateKey(k).toLocaleDateString(undefined, { weekday: "short" }) : fromDateKey(k).toLocaleDateString(undefined, { month: "short", day: "numeric" }),
          full: prettyDate(k, { weekday: "short", month: "short", day: "numeric" }),
        }));

    const series = (fn: (key: string) => number): Point[] => buckets.map((b) => ({ label: b.label, full: b.full, value: fn(b.key) }));
    const focusByBucket = new Map<string, number>();
    const sessionsByBucket = new Map<string, number>();
    for (const s of focus) {
      const b = bucket(s.startedAt);
      focusByBucket.set(b, (focusByBucket.get(b) ?? 0) + s.actualDuration);
      if (s.completed) sessionsByBucket.set(b, (sessionsByBucket.get(b) ?? 0) + 1);
    }
    const tasksByBucket = new Map<string, number>();
    for (const t of done) {
      const b = bucket(t.completedAt!);
      tasksByBucket.set(b, (tasksByBucket.get(b) ?? 0) + 1);
    }

    // Focus by category (via the linked task).
    const byCat = new Map<string, number>();
    for (const s of focus) {
      const t = tasks.find((x) => x.id === s.taskId);
      const name = t?.categoryId ? (categories.find((c) => c.id === t.categoryId)?.name ?? "Other") : t ? "Uncategorised" : "No task";
      byCat.set(name, (byCat.get(name) ?? 0) + s.actualDuration);
    }
    const catData: Point[] = [...byCat.entries()]
      .sort((a, b) => b[1] - a[1])
      .map(([name, secs]) => ({ label: name, full: name, value: Math.round(secs / 60) }));

    // Time per task
    const byTask = new Map<string, number>();
    for (const s of focus) if (s.taskId) byTask.set(s.taskId, (byTask.get(s.taskId) ?? 0) + s.actualDuration);
    const topTasks = [...byTask.entries()]
      .sort((a, b) => b[1] - a[1])
      .slice(0, 5)
      .map(([id, secs]) => ({ task: tasks.find((t) => t.id === id), secs }));

    // Weekly consistency: productive days per week, last 8 weeks.
    const prod = productiveDays(sessions, tasks);
    const weekStart = startOfWeekKey(today, 1);
    const consistency: Point[] = Array.from({ length: 8 }, (_, i) => {
      const ws = addDays(weekStart, -(7 - i) * 7);
      const days = rangeKeys(ws, addDays(ws, 6)).filter((k) => prod.has(k)).length;
      return { label: fromDateKey(ws).toLocaleDateString(undefined, { month: "short", day: "numeric" }), full: `Week of ${prettyDate(ws, { month: "short", day: "numeric" })}`, value: days };
    });

    // Best day & average
    const perDay = new Map<string, number>();
    for (const s of focus) {
      const k = toDateKey(new Date(s.startedAt));
      perDay.set(k, (perDay.get(k) ?? 0) + s.actualDuration);
    }
    const best = [...perDay.entries()].sort((a, b) => b[1] - a[1])[0];
    const totalFocus = focus.reduce((s, x) => s + x.actualDuration, 0);

    // Most productive hour (all time)
    const hours = new Array(24).fill(0);
    for (const s of focusSessions(sessions)) hours[new Date(s.startedAt).getHours()] += s.actualDuration;
    const peak = hours.some((h) => h > 0) ? hours.indexOf(Math.max(...hours)) : null;

    return {
      focusMinutes: series((k) => Math.round((focusByBucket.get(k) ?? 0) / 60)),
      sessionsSeries: series((k) => sessionsByBucket.get(k) ?? 0),
      tasksSeries: series((k) => tasksByBucket.get(k) ?? 0),
      catData,
      topTasks,
      consistency,
      totalFocus,
      completedTasks: done.length,
      completedSessions: focus.filter((s) => s.completed).length,
      best,
      avg: totalFocus / keys.length,
      streak: currentStreak(prod, today),
      longest: longestStreak(prod),
      peak,
      activeDays: keys.filter((k) => prod.has(k)).length,
      days: keys.length,
    };
  }, [sessions, tasks, categories, from, to, today]);

  const mins = (v: number) => `${v} min`;
  const count = (word: string) => (v: number) => `${v} ${word}${v === 1 ? "" : "s"}`;
  const isEmpty = !sessions.length && !tasks.some((t) => t.completedAt);

  return (
    <PageContainer>
      <PageHeader
        title="My Progress"
        subtitle="Gentle insights from your real activity — consistency over perfection."
        actions={
          <div className="flex flex-wrap items-center gap-2">
            <Segmented
              label="Time range"
              size="sm"
              value={range}
              onChange={setRange}
              options={[
                { value: "today", label: "Today" },
                { value: "week", label: "This week" },
                { value: "month", label: "This month" },
                { value: "30d", label: "30 days" },
                { value: "custom", label: "Custom" },
              ]}
            />
            {range === "custom" && (
              <div className="flex items-center gap-1.5">
                <Input type="date" value={custom.from} max={today} onChange={(e) => e.target.value && setCustom((c) => ({ ...c, from: e.target.value }))} className="h-8 w-auto text-xs" aria-label="From date" />
                <span className="text-xs text-muted">to</span>
                <Input type="date" value={custom.to} max={today} onChange={(e) => e.target.value && setCustom((c) => ({ ...c, to: e.target.value }))} className="h-8 w-auto text-xs" aria-label="To date" />
              </div>
            )}
          </div>
        }
      />

      {isEmpty ? (
        <Card>
          <EmptyState title="Your first focus session will appear here." description="Complete a focus session or a task and your progress will start to bloom." />
        </Card>
      ) : (
        <>
          <div className="mb-5 grid grid-cols-2 gap-3 sm:gap-5 lg:grid-cols-3 xl:grid-cols-6">
            <Stat icon={<Clock />} label="Total focus" value={formatDuration(data.totalFocus)} sub={`${data.activeDays} of ${data.days} days active`} />
            <Stat icon={<CheckCircle2 />} label="Tasks completed" value={String(data.completedTasks)} />
            <Stat icon={<Timer />} label="Focus sessions" value={String(data.completedSessions)} sub="completed" />
            <Stat icon={<Flame />} label="Current streak" value={`${data.streak}d`} sub={`Longest: ${data.longest} days`} />
            <Stat icon={<Award />} label="Best focus day" value={data.best ? formatDuration(data.best[1]) : "—"} sub={data.best ? prettyDate(data.best[0], { weekday: "short", month: "short", day: "numeric" }) : "No sessions yet"} />
            <Stat icon={<TrendingUp />} label="Daily average" value={formatDuration(data.avg)} sub={data.peak !== null ? `Most focused around ${data.peak % 12 || 12} ${data.peak < 12 ? "AM" : "PM"}` : undefined} />
          </div>

          <div className="grid gap-5 lg:grid-cols-2">
            <ChartCard title="Focus time" subtitle={from === to ? "Minutes by hour" : "Minutes per day"} icon={<Clock />} data={data.focusMinutes} unit={mins} empty="No focus time in this period." />
            <ChartCard title="Tasks completed" subtitle={from === to ? "By hour" : "Per day"} icon={<CheckCircle2 />} data={data.tasksSeries} unit={count("task")} empty="No completed tasks in this period." />
            <ChartCard title="Focus sessions" subtitle="Completed sessions" icon={<Timer />} data={data.sessionsSeries} unit={count("session")} empty="Your first focus session is waiting." />
            <ChartCard title="Where your focus goes" subtitle="Minutes by task category" icon={<BarChart3 />} data={data.catData} unit={mins} horizontal height={Math.max(160, data.catData.length * 40)} empty="Link tasks to focus sessions to see this." />
            <ChartCard title="Weekly consistency" subtitle="Productive days per week (last 8 weeks)" icon={<CalendarCheck />} data={data.consistency} unit={count("day")} empty="Consistency builds over a few weeks." />
            <Card>
              <CardHeader title="Time per task" subtitle="Top tasks in this period" icon={<Timer />} />
              {data.topTasks.length ? (
                <ul className="space-y-3">
                  {data.topTasks.map(({ task, secs }) => (
                    <li key={task?.id ?? secs}>
                      <div className="mb-1 flex justify-between gap-3 text-sm">
                        <span className="truncate font-semibold">{task?.title ?? "Deleted task"}</span>
                        <span className="shrink-0 tabular-nums text-muted">{formatDuration(secs)}</span>
                      </div>
                      <div className="h-2 rounded-full bg-bg-2">
                        <div className="h-full rounded-full bg-accent-strong" style={{ width: `${(secs / data.topTasks[0].secs) * 100}%` }} />
                      </div>
                    </li>
                  ))}
                </ul>
              ) : (
                <EmptyState compact title="No task-linked focus yet." description="Press “Focus” on a task to track time against it." />
              )}
            </Card>
          </div>
          <p className="mt-6 text-center text-sm text-muted">Every bit of progress counts — missed days are just rest days. 🌙</p>
        </>
      )}
    </PageContainer>
  );
}
