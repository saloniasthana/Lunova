"use client";

import * as React from "react";
import Link from "next/link";
import { motion } from "framer-motion";
import { ArrowRight, CheckCircle2, Clock, Flame, Headphones, ListTodo, Palette, Plus, RefreshCw, Repeat, Sparkles, TrendingUp } from "lucide-react";
import { useData } from "@/stores/data-store";
import { useUi } from "@/stores/ui-store";
import { useAudio } from "@/stores/audio-store";
import { usePrefs } from "@/stores/prefs-store";
import { PageContainer } from "@/components/layout/page-header";
import { Card, CardHeader, ProgressBar, ProgressRing } from "@/components/ui/misc";
import { Button } from "@/components/ui/button";
import { EmptyState } from "@/components/ui/states";
import { TaskRow, Checkbox } from "@/components/tasks/task-row";
import { QuickAdd } from "@/components/tasks/quick-add";
import { FocusWidget } from "@/components/focus/focus-widget";
import { CompanionArt, Companion } from "@/components/companion/companion";
import { WallpaperArt, wallpaperById } from "@/components/workspace/wallpapers";
import { THEMES } from "@/lib/themes";
import { QUOTES, quoteOfTheDay } from "@/lib/quotes";
import { addDays, formatDuration, fromDateKey, greeting, prettyDate, toDateKey, todayKey } from "@/lib/dates";
import { currentStreak, focusSecondsOn, focusSessions, habitStats, isHabitScheduled, productiveDays, sessionDateKey, sortTasks, todaysTasks } from "@/lib/selectors";
import { PRIORITY_META, cn } from "@/lib/utils";

const fade = {
  hidden: { opacity: 0, y: 12 },
  show: (i: number) => ({ opacity: 1, y: 0, transition: { delay: i * 0.05, duration: 0.35, ease: [0.16, 1, 0.3, 1] as const } }),
};

function Section({ i, className, children }: { i: number; className?: string; children: React.ReactNode }) {
  return (
    <motion.div custom={i} variants={fade} initial="hidden" animate="show" className={className}>
      {children}
    </motion.div>
  );
}

function StatTile({ icon, label, value, sub, tint, children }: { icon: React.ReactNode; label: string; value: React.ReactNode; sub?: string; tint: string; children?: React.ReactNode }) {
  return (
    <Card className="flex items-center gap-4 p-4 sm:p-5">
      {children ?? (
        <span className="grid size-11 shrink-0 place-items-center rounded-2xl [&_svg]:size-5" style={{ background: tint }}>
          {icon}
        </span>
      )}
      <div className="min-w-0">
        <p className="text-xs font-semibold text-muted">{label}</p>
        <p className="font-display text-xl font-extrabold tabular-nums text-ink sm:text-2xl">{value}</p>
        {sub && <p className="truncate text-[11px] text-muted">{sub}</p>}
      </div>
    </Card>
  );
}

export function Dashboard() {
  const me = useData((s) => s.me);
  const settings = useData((s) => s.settings)!;
  const tasks = useData((s) => s.tasks) ?? [];
  const sessions = useData((s) => s.sessions) ?? [];
  const habits = useData((s) => s.habits) ?? [];
  const toggleHabit = useData((s) => s.toggleHabit);
  const openNewTask = useUi((s) => s.openNewTask);
  const track = useAudio((s) => s.current());
  const playing = useAudio((s) => s.playing);
  const widgets = usePrefs((s) => s.widgets);

  const today = todayKey();
  const [quoteIdx, setQuoteIdx] = React.useState(() => quoteOfTheDay(today));
  // The workspace only renders on the client (after data loads), so this can't mismatch SSR.
  const hello = greeting();

  const todayList = todaysTasks(tasks, today);
  const doneToday = todayList.filter((t) => t.status === "DONE").length;
  const visibleTasks = sortTasks(todayList, "smart")
    .sort((a, b) => Number(a.status === "DONE") - Number(b.status === "DONE") || PRIORITY_META[b.priority].rank - PRIORITY_META[a.priority].rank)
    .slice(0, 6);
  const focusToday = focusSecondsOn(sessions, today);
  const sessionsToday = focusSessions(sessions).filter((s) => s.completed && sessionDateKey(s) === today).length;
  const completedToday = tasks.filter((t) => t.completedAt && toDateKey(new Date(t.completedAt)) === today).length;
  const streak = currentStreak(productiveDays(sessions, tasks), today);

  const week = Array.from({ length: 7 }, (_, i) => {
    const k = addDays(today, i - 6);
    return { key: k, secs: focusSecondsOn(sessions, k) };
  });
  const weekMax = Math.max(1, ...week.map((d) => d.secs));
  const weekTotal = week.reduce((s, d) => s + d.secs, 0);

  const todaysHabits = habits.filter((h) => !h.paused && isHabitScheduled(h, today));
  const habitsDone = todaysHabits.filter((h) => h.completions.includes(today)).length;

  const theme = THEMES.find((t) => t.id === settings.theme);
  const wp = wallpaperById(settings.wallpaper);
  const firstName = me?.name?.split(" ")[0];

  return (
    <PageContainer>
      {/* Header */}
      <Section i={0} className="mb-8 flex flex-col gap-5 md:flex-row md:items-end md:justify-between">
        <div>
          <p className="text-sm font-semibold text-muted">{prettyDate(today)}</p>
          <h1 className="mt-1 font-display text-3xl font-extrabold tracking-tight text-ink sm:text-4xl">
            {hello}
            {firstName ? `, ${firstName}` : ""} <span aria-hidden>☁️</span>
          </h1>
          <p className="mt-1.5 text-muted">Let&apos;s make today a little more productive.</p>
        </div>
        {settings.showQuotes && (
          <div className="flex max-w-sm items-center gap-3 rounded-2xl border border-line bg-card/80 px-4 py-3 shadow-[var(--shadow-soft)] backdrop-blur">
            <Sparkles className="size-4 shrink-0 text-accent-strong" aria-hidden />
            <p className="text-sm italic text-ink">“{QUOTES[quoteIdx]}”</p>
            <button
              onClick={() => setQuoteIdx((i) => (i + 1) % QUOTES.length)}
              className="shrink-0 rounded-lg p-1.5 text-muted hover:bg-bg-2 hover:text-ink"
              aria-label="Show another quote"
            >
              <RefreshCw className="size-3.5" />
            </button>
          </div>
        )}
      </Section>

      {/* A. Today's overview */}
      <Section i={1} className="mb-5 grid grid-cols-2 gap-3 sm:gap-5 xl:grid-cols-4">
        <StatTile icon={null} label="Tasks completed" value={`${doneToday}/${todayList.length}`} sub={todayList.length ? `${todayList.length - doneToday} pending` : "Nothing planned yet"} tint="">
          <ProgressRing value={todayList.length ? doneToday / todayList.length : 0} size={48} stroke={5} color="var(--success)">
            <CheckCircle2 className="size-4 text-[#5a9a66]" />
          </ProgressRing>
        </StatTile>
        <StatTile icon={<Clock className="text-[#4A78A8]" />} label="Focus time today" value={formatDuration(focusToday)} sub={`${sessionsToday} session${sessionsToday === 1 ? "" : "s"} completed`} tint="#E6F0FA" />
        <StatTile icon={<Flame className="text-[#B8703F]" />} label="Current streak" value={`${streak} day${streak === 1 ? "" : "s"}`} sub={streak ? "Keep the glow going" : "Start one today"} tint="#FDEEE3" />
        <StatTile icon={<Repeat className="text-[#7A5BAF]" />} label="Habits today" value={`${habitsDone}/${todaysHabits.length}`} sub={todaysHabits.length ? "Small routines, big change" : "No habits scheduled"} tint="#F0E9FA" />
      </Section>

      <div className="grid gap-5 xl:grid-cols-3">
        {/* B. Today's tasks */}
        <Section i={2} className="xl:col-span-2">
          <Card className="h-full">
            <CardHeader
              title="Today's tasks"
              subtitle={todayList.length ? `${doneToday} of ${todayList.length} done` : undefined}
              icon={<ListTodo />}
              action={
                <div className="flex items-center gap-1">
                  <Button size="sm" variant="soft" onClick={() => openNewTask()}>
                    <Plus /> Add task
                  </Button>
                </div>
              }
            />
            {todayList.length > 0 && <ProgressBar value={(doneToday / todayList.length) * 100} className="mb-3" color="var(--success)" />}
            <QuickAdd className="mb-2" />
            {visibleTasks.length ? (
              <div className="-mx-2">
                {visibleTasks.map((t) => (
                  <TaskRow key={t.id} task={t} compact />
                ))}
              </div>
            ) : (
              <EmptyState compact title="Your day is a blank canvas." description="Add your first task and start creating your day." />
            )}
            <div className="mt-3 flex justify-end">
              <Link href="/tasks" className="inline-flex items-center gap-1 text-sm font-semibold text-accent-strong hover:underline">
                View all tasks <ArrowRight className="size-4" />
              </Link>
            </div>
          </Card>
        </Section>

        {/* C. Focus widget */}
        <Section i={3}>
          <FocusWidget />
        </Section>

        {/* D. Habits */}
        {widgets.habits && <Section i={4}>
          <Card className="h-full">
            <CardHeader
              title="Today's habits"
              icon={<Repeat />}
              action={
                <Link href="/habits" className="text-xs font-semibold text-accent-strong hover:underline">
                  Manage
                </Link>
              }
            />
            {todaysHabits.length ? (
              <>
                <ProgressBar value={(habitsDone / todaysHabits.length) * 100} className="mb-3" color="var(--lavender)" />
                <ul className="space-y-1">
                  {todaysHabits.map((h) => {
                    const done = h.completions.includes(today);
                    const st = habitStats(h, today);
                    return (
                      <li key={h.id} className="flex items-center gap-3 rounded-2xl px-2 py-2 hover:bg-bg-2/50">
                        <Checkbox checked={done} onChange={() => void toggleHabit(h.id, today)} label={done ? `Undo ${h.name}` : `Complete ${h.name}`} />
                        <span className={cn("flex-1 text-sm font-semibold", done && "text-muted line-through")}>{h.name}</span>
                        {st.streak > 0 && (
                          <span className="flex items-center gap-1 text-xs font-semibold text-[#B8703F]">
                            <Flame className="size-3.5" /> {st.streak}
                          </span>
                        )}
                      </li>
                    );
                  })}
                </ul>
              </>
            ) : (
              <EmptyState
                compact
                title="Small habits create beautiful routines."
                action={
                  <Button size="sm" variant="soft" asChild>
                    <Link href="/habits">Add a habit</Link>
                  </Button>
                }
              />
            )}
          </Card>
        </Section>}

        {/* E. Focus statistics */}
        {widgets.stats && <Section i={5}>
          <Card className="h-full">
            <CardHeader
              title="Focus this week"
              subtitle={`${formatDuration(weekTotal)} in total`}
              icon={<TrendingUp />}
              action={
                <Link href="/progress" className="text-xs font-semibold text-accent-strong hover:underline">
                  Details
                </Link>
              }
            />
            <div className="flex h-32 items-end justify-between gap-2" role="img" aria-label={`Focus minutes for the last 7 days: ${week.map((d) => Math.round(d.secs / 60)).join(", ")}`}>
              {week.map((d) => (
                <div key={d.key} className="flex flex-1 flex-col items-center gap-1.5">
                  <div className="flex h-24 w-full items-end">
                    <motion.div
                      initial={{ height: 0 }}
                      animate={{ height: `${Math.max(d.secs ? 8 : 4, (d.secs / weekMax) * 100)}%` }}
                      transition={{ duration: 0.6, ease: "easeOut" }}
                      className={cn("w-full rounded-lg", d.key === today ? "bg-accent-strong" : d.secs ? "bg-accent" : "bg-bg-2")}
                      title={`${formatDuration(d.secs)}`}
                    />
                  </div>
                  <span className={cn("text-[11px] font-semibold", d.key === today ? "text-ink" : "text-muted")}>
                    {fromDateKey(d.key).toLocaleDateString(undefined, { weekday: "narrow" })}
                  </span>
                </div>
              ))}
            </div>
            <div className="mt-4 grid grid-cols-3 gap-2 text-center">
              {[
                ["Today", formatDuration(focusToday)],
                ["Sessions", String(sessionsToday)],
                ["Tasks done", String(completedToday)],
              ].map(([l, v]) => (
                <div key={l} className="rounded-2xl bg-bg-2/60 py-2">
                  <p className="font-display text-base font-extrabold tabular-nums">{v}</p>
                  <p className="text-[11px] font-semibold text-muted">{l}</p>
                </div>
              ))}
            </div>
          </Card>
        </Section>}

        {/* F + G. Workspace & motivation */}
        {(widgets.workspace || widgets.motivation) && <Section i={6} className="flex flex-col gap-5">
          {widgets.workspace && <Card className="overflow-hidden p-0 sm:p-0">
            <div className="relative h-28 overflow-hidden">
              {wp.id === "none" ? <div className="h-full bg-gradient-to-br from-accent-soft to-lavender/50" /> : <WallpaperArt id={wp.id} className="h-full" />}
              <div className="absolute bottom-0 right-4 translate-y-3">
                {settings.companionEnabled && <CompanionArt type={settings.companionType} accessory={settings.companionAccessory} mood={playing ? "focus" : "idle"} size={80} />}
              </div>
            </div>
            <div className="p-5">
              <p className="font-display text-[15px] font-bold">My space</p>
              <dl className="mt-2 space-y-1 text-xs text-muted">
                <div className="flex justify-between gap-2">
                  <dt>Theme</dt>
                  <dd className="font-semibold text-ink">{theme?.name}</dd>
                </div>
                <div className="flex justify-between gap-2">
                  <dt>Wallpaper</dt>
                  <dd className="font-semibold text-ink">{wp.name}</dd>
                </div>
                <div className="flex justify-between gap-2">
                  <dt className="flex items-center gap-1">
                    <Headphones className="size-3" /> Music
                  </dt>
                  <dd className="truncate font-semibold text-ink">{playing ? track?.title : "Paused"}</dd>
                </div>
              </dl>
              <Button variant="soft" size="sm" className="mt-4 w-full" asChild>
                <Link href="/workspace">
                  <Palette /> Customize my space
                </Link>
              </Button>
            </div>
          </Card>}
          {widgets.motivation && <Card className="flex items-center gap-4 bg-gradient-to-br from-card to-pink/30">
            <div className="min-w-0 flex-1">
              <p className="font-display text-base font-bold leading-snug">You&apos;re doing better than you think.</p>
              <p className="mt-1 text-xs text-muted">Every small step counts. Be gentle with yourself today.</p>
            </div>
            {settings.companionEnabled ? <Companion forceSize={72} /> : <Sparkles className="size-8 text-accent-strong" />}
          </Card>}
        </Section>}
      </div>
    </PageContainer>
  );
}
