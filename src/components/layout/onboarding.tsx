"use client";

import * as React from "react";
import { AnimatePresence, motion } from "framer-motion";
import { ArrowRight, Check } from "lucide-react";
import { Dialog as D } from "radix-ui";
import { Button } from "@/components/ui/button";
import { useData } from "@/stores/data-store";
import { THEMES } from "@/lib/themes";
import { CompanionArt } from "@/components/companion/companion";
import type { ThemeId, UserSettings } from "@/types";
import { cn } from "@/lib/utils";
import { LogoMark } from "./logo";

const FOCUS_AREAS: { id: UserSettings["focusArea"]; label: string; emoji: string }[] = [
  { id: "study", label: "Study", emoji: "📚" },
  { id: "work", label: "Work", emoji: "💼" },
  { id: "personal", label: "Personal goals", emoji: "🌱" },
  { id: "habits", label: "Daily habits", emoji: "☀️" },
  { id: "everything", label: "Everything", emoji: "✨" },
];

function previewThemeOnDocument(t: ThemeId) {
  document.documentElement.dataset.theme = t;
}

export function Onboarding() {
  const settings = useData((s) => s.settings);
  const updateSettings = useData((s) => s.updateSettings);
  const [step, setStep] = React.useState(0);
  const [theme, setTheme] = React.useState<ThemeId>("cloud");
  const [area, setArea] = React.useState<UserSettings["focusArea"]>("everything");
  const [focus, setFocus] = React.useState(25);
  const [closing, setClosing] = React.useState(false);

  if (!settings || settings.onboarded) return null;

  const previewTheme = (t: ThemeId) => {
    setTheme(t);
    previewThemeOnDocument(t);
  };

  const finish = (skip = false) => {
    setClosing(true);
    void updateSettings(skip ? { onboarded: true } : { onboarded: true, theme, focusArea: area, focusDuration: focus });
    if (skip) previewThemeOnDocument(settings.theme);
  };

  const steps = [
    <div key="0" className="text-center">
      <LogoMark size={56} className="mx-auto" />
      <h2 className="mt-5 font-display text-2xl font-extrabold">Welcome to Lunova.</h2>
      <p className="mx-auto mt-2 max-w-xs text-muted">Create a peaceful space for your productivity.</p>
      <div className="mt-6 flex justify-center">
        <CompanionArt type="cat" mood="idle" size={110} />
      </div>
    </div>,
    <div key="1">
      <h2 className="font-display text-xl font-extrabold">Pick a workspace theme</h2>
      <p className="mt-1 text-sm text-muted">You can change this anytime.</p>
      <div className="mt-5 grid grid-cols-2 gap-2.5">
        {THEMES.filter((t) => t.id !== "night" && t.id !== "peach").map((t) => (
          <button
            key={t.id}
            onClick={() => previewTheme(t.id)}
            className={cn(
              "flex items-center gap-3 rounded-2xl border-2 p-3 text-left transition-all",
              theme === t.id ? "border-accent-strong bg-accent-soft" : "border-line hover:border-accent",
            )}
            aria-pressed={theme === t.id}
          >
            <span className="flex -space-x-1.5">
              {t.swatches.map((c) => (
                <span key={c} className="size-5 rounded-full border-2 border-card" style={{ background: c }} />
              ))}
            </span>
            <span className="text-sm font-semibold">{t.name}</span>
          </button>
        ))}
      </div>
    </div>,
    <div key="2">
      <h2 className="font-display text-xl font-extrabold">What would you like to focus on?</h2>
      <p className="mt-1 text-sm text-muted">We&apos;ll keep things relevant to you.</p>
      <div className="mt-5 grid gap-2">
        {FOCUS_AREAS.map((a) => (
          <button
            key={a.id}
            onClick={() => setArea(a.id)}
            className={cn(
              "flex items-center gap-3 rounded-2xl border-2 px-4 py-3 text-left font-semibold transition-all",
              area === a.id ? "border-accent-strong bg-accent-soft" : "border-line hover:border-accent",
            )}
            aria-pressed={area === a.id}
          >
            <span className="text-lg" aria-hidden>
              {a.emoji}
            </span>
            {a.label}
            {area === a.id && <Check className="ml-auto size-4 text-accent-strong" />}
          </button>
        ))}
      </div>
    </div>,
    <div key="3" className="text-center">
      <h2 className="font-display text-xl font-extrabold">Set your focus timer</h2>
      <p className="mt-1 text-sm text-muted">How long feels right for one focus session?</p>
      <div className="mt-6 font-display text-6xl font-extrabold tabular-nums text-accent-strong">
        {focus}
        <span className="text-2xl text-muted"> min</span>
      </div>
      <input
        type="range"
        min={5}
        max={90}
        step={5}
        value={focus}
        onChange={(e) => setFocus(Number(e.target.value))}
        className="lun-range mt-6 w-full"
        style={{ ["--fill" as string]: `${((focus - 5) / 85) * 100}%` }}
        aria-label="Focus duration in minutes"
      />
      <div className="mt-4 flex justify-center gap-2">
        {[15, 25, 50].map((m) => (
          <Button key={m} size="sm" variant={focus === m ? "soft" : "outline"} onClick={() => setFocus(m)}>
            {m} min
          </Button>
        ))}
      </div>
    </div>,
    <div key="4" className="text-center">
      <div className="flex justify-center">
        <CompanionArt type="cat" mood="celebrate" size={120} />
      </div>
      <h2 className="mt-4 font-display text-2xl font-extrabold">Your little universe is ready.</h2>
      <p className="mx-auto mt-2 max-w-xs text-muted">Add your first task, start a focus session, or just enjoy the quiet.</p>
    </div>,
  ];

  const last = step === steps.length - 1;

  return (
    <D.Root open={!closing}>
      <D.Portal>
        <D.Overlay className="fixed inset-0 z-50 bg-bg/70 backdrop-blur-md" />
        <D.Content
          onEscapeKeyDown={(e) => e.preventDefault()}
          onPointerDownOutside={(e) => e.preventDefault()}
          className="fixed left-1/2 top-1/2 z-50 w-[calc(100%-2rem)] max-w-md -translate-x-1/2 -translate-y-1/2 rounded-3xl border border-line bg-card p-7 shadow-[var(--shadow-lift)] focus:outline-none"
        >
          <D.Title className="sr-only">Welcome to Lunova</D.Title>
          <D.Description className="sr-only">Set up your workspace in a few quick steps</D.Description>
          <div className="mb-6 flex items-center justify-between">
            <div className="flex gap-1.5" aria-label={`Step ${step + 1} of ${steps.length}`}>
              {steps.map((_, i) => (
                <span key={i} className={cn("h-1.5 rounded-full transition-all", i === step ? "w-6 bg-accent-strong" : "w-1.5 bg-line")} />
              ))}
            </div>
            {!last && (
              <button onClick={() => finish(true)} className="text-xs font-semibold text-muted hover:text-ink">
                Skip
              </button>
            )}
          </div>
          <div className="min-h-[300px]">
            <AnimatePresence mode="wait">
              <motion.div key={step} initial={{ opacity: 0, x: 16 }} animate={{ opacity: 1, x: 0 }} exit={{ opacity: 0, x: -16 }} transition={{ duration: 0.2 }}>
                {steps[step]}
              </motion.div>
            </AnimatePresence>
          </div>
          <div className="mt-6 flex justify-between gap-2">
            <Button variant="ghost" onClick={() => setStep((s) => s - 1)} className={cn(step === 0 && "invisible")}>
              Back
            </Button>
            <Button onClick={() => (last ? finish() : setStep((s) => s + 1))}>
              {step === 0 ? "Let's begin" : last ? "Enter my space" : "Continue"} <ArrowRight />
            </Button>
          </div>
        </D.Content>
      </D.Portal>
    </D.Root>
  );
}
