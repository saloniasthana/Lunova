"use client";

import { useRouter } from "next/navigation";
import { Coffee, Home, RotateCcw, Sparkles, Timer } from "lucide-react";
import { Dialog, DialogContent } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { useTimer } from "@/stores/timer-store";
import { useData } from "@/stores/data-store";
import { CompanionArt } from "@/components/companion/companion";

export function CompletionDialog() {
  const router = useRouter();
  const completion = useTimer((s) => s.lastCompletion);
  const status = useTimer((s) => s.status);
  const settings = useData((s) => s.settings);
  const task = useData((s) => s.tasks?.find((t) => t.id === completion?.taskId));
  const open = !!completion && status === "idle";
  const dismiss = () => useTimer.getState().dismissCompletion();
  const focusDone = completion?.mode === "FOCUS";
  const longBreak = completion?.next === "LONG_BREAK";

  const startNext = (mode: "FOCUS" | "SHORT_BREAK" | "LONG_BREAK") => {
    const t = useTimer.getState();
    if (t.mode !== mode) t.setMode(mode);
    t.start();
    dismiss();
  };

  return (
    <Dialog open={open} onOpenChange={(v) => !v && dismiss()}>
      <DialogContent title={focusDone ? "Beautiful work!" : "Break complete"} className="sm:max-w-md">
        <div className="flex flex-col items-center text-center">
          {settings?.companionEnabled ? (
            <CompanionArt type={settings.companionType} accessory={settings.companionAccessory} mood="celebrate" size={110} />
          ) : (
            <span className="grid size-16 place-items-center rounded-3xl bg-accent-soft text-accent-strong">
              <Sparkles className="size-7" />
            </span>
          )}
          <p className="mt-3 text-sm text-muted">
            {focusDone
              ? task
                ? `You completed a focus session on “${task.title}”.`
                : "You completed a focus session."
              : "Feeling refreshed? Let’s get back to it gently."}
          </p>
          {focusDone && longBreak && <p className="mt-1 text-xs font-semibold text-accent-strong">You&apos;ve earned a longer break 🌙</p>}
          <div className="mt-5 grid w-full gap-2">
            {focusDone ? (
              <>
                <Button size="lg" onClick={() => startNext(longBreak ? "LONG_BREAK" : "SHORT_BREAK")}>
                  <Coffee /> Take a {longBreak ? "long" : "short"} break
                </Button>
                <Button size="lg" variant="soft" onClick={() => startNext("FOCUS")}>
                  <RotateCcw /> Start another session
                </Button>
              </>
            ) : (
              <Button size="lg" onClick={() => startNext("FOCUS")}>
                <Timer /> Start focusing
              </Button>
            )}
            <Button
              variant="ghost"
              onClick={() => {
                dismiss();
                router.push("/dashboard");
              }}
            >
              <Home /> Return to dashboard
            </Button>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}
