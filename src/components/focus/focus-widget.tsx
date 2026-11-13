"use client";

import Link from "next/link";
import { Pause, Play, RotateCcw, Timer } from "lucide-react";
import { useTimerView } from "@/hooks/use-timer";
import { useTimer } from "@/stores/timer-store";
import { useData } from "@/stores/data-store";
import { Card, CardHeader, ProgressRing } from "@/components/ui/misc";
import { Button } from "@/components/ui/button";
import { Select } from "@/components/ui/input";
import type { SessionType } from "@/types";

export const MODE_META: Record<SessionType, { label: string; color: string; soft: string; prompt: string }> = {
  FOCUS: { label: "Focus", color: "#7FA8D6", soft: "#E6F0FA", prompt: "Ready to focus?" },
  SHORT_BREAK: { label: "Short break", color: "#86C08F", soft: "#E8F3E7", prompt: "Time for a little break." },
  LONG_BREAK: { label: "Long break", color: "#A98BD8", soft: "#F0E9FA", prompt: "Enjoy a longer rest." },
};

export function TaskPicker({ className, disabled }: { className?: string; disabled?: boolean }) {
  const tasks = useData((s) => s.tasks) ?? [];
  const taskId = useTimer((s) => s.taskId);
  const open = tasks.filter((t) => t.status !== "DONE" || t.id === taskId);
  return (
    <Select
      value={taskId ?? ""}
      onChange={(e) => useTimer.getState().setTask(e.target.value || null)}
      aria-label="Task to focus on"
      className={className}
      disabled={disabled}
    >
      <option value="">No specific task</option>
      {open.map((t) => (
        <option key={t.id} value={t.id}>
          {t.title}
        </option>
      ))}
    </Select>
  );
}

export function FocusWidget() {
  const v = useTimerView();
  const meta = MODE_META[v.mode];
  const t = useTimer.getState;

  return (
    <Card className="flex flex-col">
      <CardHeader
        title="Focus"
        icon={<Timer />}
        action={
          <Link href="/focus" className="text-xs font-semibold text-accent-strong hover:underline">
            Open studio
          </Link>
        }
      />
      <div className="flex flex-1 flex-col items-center">
        <ProgressRing value={v.progress} size={168} stroke={10} color={meta.color} track={meta.soft}>
          <div className="text-center">
            <p className="font-display text-4xl font-extrabold tabular-nums text-ink">{v.label}</p>
            <p className="mt-0.5 text-xs font-bold uppercase tracking-wider" style={{ color: meta.color }}>
              {meta.label}
            </p>
          </div>
        </ProgressRing>
        <p className="mt-3 text-sm text-muted">{v.status === "idle" ? meta.prompt : v.status === "paused" ? "Paused — take your time." : v.mode === "FOCUS" ? "You're in the zone." : meta.prompt}</p>
        <div className="mt-3 w-full">
          <TaskPicker />
        </div>
        <div className="mt-4 flex w-full gap-2">
          {v.status === "running" ? (
            <Button className="flex-1" variant="soft" onClick={() => t().pause()}>
              <Pause /> Pause
            </Button>
          ) : (
            <Button className="flex-1" onClick={() => t().start()}>
              <Play className="fill-current" /> {v.status === "paused" ? "Resume" : "Start focusing"}
            </Button>
          )}
          <Button variant="outline" size="icon" onClick={() => t().reset()} aria-label="Reset timer" disabled={v.status === "idle"}>
            <RotateCcw />
          </Button>
        </div>
        <p className="mt-3 text-xs text-muted">
          Session {(v.cycleCount % v.durations.every) + 1} of {v.durations.every} before a long break
        </p>
      </div>
    </Card>
  );
}
