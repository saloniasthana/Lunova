"use client";

import * as React from "react";
import { motion } from "framer-motion";
import { Check, Eye, EyeOff, Flower2, Lock, Sprout, Star } from "lucide-react";
import { useData } from "@/stores/data-store";
import { PageContainer, PageHeader } from "@/components/layout/page-header";
import { Button } from "@/components/ui/button";
import { Badge, Card, CardHeader, ProgressBar, Segmented } from "@/components/ui/misc";
import { GARDEN_CATALOG, POINTS, catalogByKey, earnedPoints, spentPoints, type GardenItemType } from "@/lib/garden";
import { focusSessions } from "@/lib/selectors";
import { cn } from "@/lib/utils";

function GardenScene() {
  const garden = useData((s) => s.garden) ?? [];
  const updateReward = useData((s) => s.updateReward);
  const ref = React.useRef<HTMLDivElement>(null);
  const [drag, setDrag] = React.useState<{ id: string; x: number } | null>(null);
  const visible = garden.filter((g) => g.selected);
  const empty = visible.length === 0;

  const xFromEvent = (e: React.PointerEvent) => {
    const r = ref.current!.getBoundingClientRect();
    return Math.max(3, Math.min(97, Math.round(((e.clientX - r.left) / r.width) * 100)));
  };

  return (
    <div
      ref={ref}
      className="relative h-72 touch-none select-none overflow-hidden rounded-3xl sm:h-80"
      onPointerMove={(e) => drag && setDrag({ ...drag, x: xFromEvent(e) })}
      onPointerUp={() => {
        if (drag) void updateReward(drag.id, { x: drag.x });
        setDrag(null);
      }}
      onPointerCancel={() => setDrag(null)}
      role="img"
      aria-label={empty ? "An empty garden waiting for its first plant" : `Your garden with ${visible.length} items`}
    >
      <svg viewBox="0 0 800 320" preserveAspectRatio="xMidYMid slice" className="absolute inset-0 h-full w-full" aria-hidden>
        <defs>
          <linearGradient id="gsky" x1="0" y1="0" x2="0" y2="1">
            <stop offset="0" stopColor="#DCEAF7" />
            <stop offset="1" stopColor="#F7F2FA" />
          </linearGradient>
        </defs>
        <rect width="800" height="320" fill="url(#gsky)" />
        <circle cx="680" cy="70" r="34" fill="#FFF3D6" />
        <g fill="#fff" opacity="0.9">
          <ellipse cx="160" cy="70" rx="56" ry="16" />
          <ellipse cx="190" cy="58" rx="34" ry="18" />
          <ellipse cx="480" cy="46" rx="44" ry="12" />
        </g>
        <path d="M0 220 Q 200 180 400 215 T 800 205 V320 H0Z" fill="#CFE4CC" />
        <path d="M0 250 Q 250 225 500 252 T 800 245 V320 H0Z" fill="#B9D8B5" />
        <rect y="285" width="800" height="35" fill="#A9CBA4" />
      </svg>
      {empty && (
        <div className="absolute inset-0 grid place-items-center">
          <p className="rounded-2xl bg-white/80 px-4 py-2 text-sm font-semibold text-[#4a5a4a] backdrop-blur">Your garden is waiting for its first sprout 🌱</p>
        </div>
      )}
      {visible.map((g, i) => {
        const item = catalogByKey.get(g.rewardName);
        if (!item) return null;
        const x = drag?.id === g.id ? drag.x : g.x;
        const size = item.type === "tree" ? "text-7xl sm:text-8xl" : item.type === "decor" ? "text-4xl sm:text-5xl" : "text-5xl sm:text-6xl";
        const bottom = item.type === "tree" ? 18 : 10 + (i % 3) * 4;
        return (
          <motion.button
            key={g.id}
            type="button"
            initial={{ scale: 0, y: 20 }}
            animate={{ scale: 1, y: 0 }}
            transition={{ type: "spring", stiffness: 260, damping: 18, delay: i * 0.04 }}
            onPointerDown={(e) => {
              (e.currentTarget as HTMLElement).setPointerCapture(e.pointerId);
              setDrag({ id: g.id, x: g.x });
            }}
            className={cn("absolute -translate-x-1/2 cursor-grab leading-none drop-shadow-sm active:cursor-grabbing", size, drag?.id === g.id && "z-10 scale-110")}
            style={{ left: `${x}%`, bottom: `${bottom}%` }}
            aria-label={`${item.name} — drag to move`}
            title={`${item.name} · drag to move`}
          >
            <span className={cn("inline-block", item.key === "butterfly" && "animate-float")}>{item.emoji}</span>
          </motion.button>
        );
      })}
    </div>
  );
}

export function GardenPage() {
  const sessions = useData((s) => s.sessions) ?? [];
  const tasks = useData((s) => s.tasks) ?? [];
  const habits = useData((s) => s.habits) ?? [];
  const garden = useData((s) => s.garden) ?? [];
  const unlockReward = useData((s) => s.unlockReward);
  const updateReward = useData((s) => s.updateReward);
  const [filter, setFilter] = React.useState<"all" | GardenItemType>("all");
  const [busy, setBusy] = React.useState<string | null>(null);

  const focusSecs = focusSessions(sessions)
    .filter((s) => s.completed)
    .reduce((sum, s) => sum + s.actualDuration, 0);
  const tasksDone = tasks.filter((t) => t.status === "DONE").length;
  const habitDone = habits.reduce((sum, h) => sum + h.completions.length, 0);
  const earned = earnedPoints({ focusSeconds: focusSecs, tasksDone, habitCompletions: habitDone });
  const owned = new Set(garden.map((g) => g.rewardName));
  const spent = spentPoints([...owned]);
  const available = earned - spent;
  const next = GARDEN_CATALOG.filter((i) => !owned.has(i.key)).sort((a, b) => a.cost - b.cost)[0];
  const items = GARDEN_CATALOG.filter((i) => filter === "all" || i.type === filter);

  const unlock = async (key: string) => {
    setBusy(key);
    await unlockReward(key);
    setBusy(null);
  };

  return (
    <PageContainer>
      <PageHeader title="Focus Garden" subtitle="Every focus session helps your little garden grow." />

      <div className="grid gap-5 xl:grid-cols-[1fr_340px]">
        <div className="space-y-5">
          <Card className="p-3 sm:p-4">
            <GardenScene />
            <p className="mt-3 px-1 text-xs text-muted">Drag plants to rearrange your garden. Hide or show them from the shop below.</p>
          </Card>

          <Card>
            <CardHeader
              title="Garden shop"
              icon={<Flower2 />}
              subtitle="Unlock with points you earn by focusing"
              action={
                <Segmented
                  size="sm"
                  label="Item type"
                  value={filter}
                  onChange={setFilter}
                  options={[
                    { value: "all", label: "All" },
                    { value: "flower", label: "Flowers" },
                    { value: "plant", label: "Plants" },
                    { value: "tree", label: "Trees" },
                    { value: "decor", label: "Decor" },
                  ]}
                  className="hidden sm:inline-flex"
                />
              }
            />
            <div className="grid grid-cols-2 gap-3 sm:grid-cols-3 lg:grid-cols-4">
              {items.map((item) => {
                const reward = garden.find((g) => g.rewardName === item.key);
                const affordable = available >= item.cost;
                return (
                  <div key={item.key} className={cn("flex flex-col items-center rounded-2xl border p-3 text-center transition-colors", reward ? "border-success/60 bg-green/30" : "border-line")}>
                    <span className={cn("text-4xl leading-none", !reward && !affordable && "opacity-40 grayscale")} aria-hidden>
                      {item.emoji}
                    </span>
                    <p className="mt-2 text-sm font-bold">{item.name}</p>
                    <p className="line-clamp-2 min-h-8 text-[11px] text-muted">{item.description}</p>
                    {reward ? (
                      <Button size="sm" variant="ghost" className="mt-2 w-full" onClick={() => void updateReward(reward.id, { selected: !reward.selected })} aria-label={reward.selected ? `Hide ${item.name}` : `Show ${item.name}`}>
                        {reward.selected ? <Eye /> : <EyeOff />} {reward.selected ? "In garden" : "Hidden"}
                      </Button>
                    ) : (
                      <Button size="sm" variant={affordable ? "soft" : "outline"} className="mt-2 w-full" disabled={!affordable || busy === item.key} onClick={() => void unlock(item.key)}>
                        {affordable ? <Star /> : <Lock />} {item.cost === 0 ? "Free" : `${item.cost} pts`}
                      </Button>
                    )}
                  </div>
                );
              })}
            </div>
          </Card>
        </div>

        <div className="space-y-5">
          <Card className="bg-gradient-to-br from-card to-green/40">
            <p className="text-xs font-bold uppercase tracking-wider text-muted">Garden points</p>
            <p className="mt-1 font-display text-4xl font-extrabold tabular-nums">{available}</p>
            <p className="text-xs text-muted">
              {earned} earned · {spent} spent
            </p>
            {next && (
              <div className="mt-4">
                <div className="mb-1.5 flex justify-between text-xs font-semibold">
                  <span>
                    Next: {next.emoji} {next.name}
                  </span>
                  <span className="tabular-nums text-muted">
                    {Math.min(available, next.cost)}/{next.cost}
                  </span>
                </div>
                <ProgressBar value={next.cost ? (available / next.cost) * 100 : 100} color="#8DB98B" />
              </div>
            )}
          </Card>
          <Card>
            <CardHeader title="How your garden grows" icon={<Sprout />} />
            <ul className="space-y-3 text-sm">
              <li className="flex items-center justify-between gap-3">
                <span>Completed focus minute</span>
                <Badge className="bg-accent-soft text-accent-strong">+{POINTS.perFocusMinute}</Badge>
              </li>
              <li className="flex items-center justify-between gap-3">
                <span>Completed task</span>
                <Badge className="bg-accent-soft text-accent-strong">+{POINTS.perTask}</Badge>
              </li>
              <li className="flex items-center justify-between gap-3">
                <span>Habit check-in</span>
                <Badge className="bg-accent-soft text-accent-strong">+{POINTS.perHabit}</Badge>
              </li>
            </ul>
            <p className="mt-4 text-xs text-muted">A full 25-minute session earns 25 points. No pressure, no wilting — your garden only ever grows.</p>
            <ul className="mt-4 space-y-1 border-t border-line pt-4 text-xs text-muted">
              <li className="flex items-center gap-2">
                <Check className="size-3.5 text-[#5a9a66]" /> {Math.floor(focusSecs / 60)} focus minutes
              </li>
              <li className="flex items-center gap-2">
                <Check className="size-3.5 text-[#5a9a66]" /> {tasksDone} tasks completed
              </li>
              <li className="flex items-center gap-2">
                <Check className="size-3.5 text-[#5a9a66]" /> {habitDone} habit check-ins
              </li>
            </ul>
          </Card>
        </div>
      </div>
    </PageContainer>
  );
}
