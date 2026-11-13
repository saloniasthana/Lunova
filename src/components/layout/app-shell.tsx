"use client";

import * as React from "react";
import { usePathname } from "next/navigation";
import { Sidebar, signOutClient } from "./sidebar";
import { MobileBottomNav, MobileTopBar } from "./mobile-nav";
import { Onboarding } from "./onboarding";
import { ShortcutsDialog, useKeyboardShortcuts } from "./shortcuts";
import { LogoMark } from "./logo";
import { useData } from "@/stores/data-store";
import { usePrefs } from "@/stores/prefs-store";
import { useTimerEngine } from "@/hooks/use-timer";
import { useReminders } from "@/hooks/use-reminders";
import { TaskModal } from "@/components/tasks/task-modal";
import { MusicDock } from "@/components/music/music-dock";
import { CompletionDialog } from "@/components/focus/completion-dialog";
import { WallpaperArt } from "@/components/workspace/wallpapers";
import { ErrorState } from "@/components/ui/states";
import { Skeleton } from "@/components/ui/misc";

function useAppearance() {
  const settings = useData((s) => s.settings);
  const cardStyle = usePrefs((s) => s.cardStyle);
  const sidebarStyle = usePrefs((s) => s.sidebarStyle);
  const bgColor = usePrefs((s) => s.bgColor);
  React.useEffect(() => {
    const d = document.documentElement;
    d.dataset.cards = cardStyle;
    d.dataset.sidebar = sidebarStyle;
    if (bgColor) {
      d.style.setProperty("--bg", bgColor);
      d.style.setProperty("--bg-2", `color-mix(in oklab, ${bgColor} 92%, #8a7f70)`);
    } else {
      d.style.removeProperty("--bg");
      d.style.removeProperty("--bg-2");
    }
  }, [cardStyle, sidebarStyle, bgColor]);
  React.useEffect(() => {
    if (!settings) return;
    const d = document.documentElement;
    d.dataset.theme = settings.theme;
    d.dataset.font = settings.font;
    if (settings.accentColor) d.style.setProperty("--accent-strong", settings.accentColor);
    else d.style.removeProperty("--accent-strong");
    const meta = document.querySelector('meta[name="theme-color"]');
    meta?.setAttribute("content", getComputedStyle(d).getPropertyValue("--bg").trim() || "#FAF9F6");
  }, [settings]);
}

export function LoadingScreen() {
  return (
    <div className="flex min-h-dvh">
      <div className="hidden w-64 shrink-0 border-r border-line/70 p-6 lg:block">
        <Skeleton className="mb-8 h-8 w-32" />
        {Array.from({ length: 9 }, (_, i) => (
          <Skeleton key={i} className="mb-2 h-9 w-full" />
        ))}
      </div>
      <div className="flex-1 p-6 lg:p-10">
        <div className="mb-8 flex items-center gap-3">
          <LogoMark className="animate-breathe" />
          <span className="text-sm font-semibold text-muted">Preparing your little universe…</span>
        </div>
        <Skeleton className="mb-3 h-9 w-72" />
        <Skeleton className="mb-8 h-5 w-96 max-w-full" />
        <div className="grid gap-5 md:grid-cols-2 xl:grid-cols-3">
          {Array.from({ length: 6 }, (_, i) => (
            <Skeleton key={i} className="h-48 rounded-3xl" />
          ))}
        </div>
      </div>
    </div>
  );
}

export function AppShell({ children }: { children: React.ReactNode }) {
  const status = useData((s) => s.status);
  const error = useData((s) => s.error);
  const load = useData((s) => s.load);
  const wallpaper = useData((s) => s.settings?.wallpaper ?? "none");
  const pathname = usePathname();

  React.useEffect(() => {
    // Honour "Remember me" = off: a fresh browser session signs the user out.
    try {
      if (localStorage.getItem("lunova-session-only") && !sessionStorage.getItem("lunova-alive")) {
        localStorage.removeItem("lunova-session-only");
        void signOutClient();
        return;
      }
      sessionStorage.setItem("lunova-alive", "1");
    } catch {
      /* storage unavailable */
    }
    if (useData.getState().status === "idle") void load();
  }, [load]);

  useAppearance();
  useTimerEngine();
  useReminders();
  useKeyboardShortcuts();

  if (status === "idle" || status === "loading") return <LoadingScreen />;
  if (status === "error")
    return (
      <div className="grid min-h-dvh place-items-center p-6">
        <ErrorState message={error ?? "We couldn't load your workspace."} onRetry={load} />
      </div>
    );

  // Focus Studio paints its own full-bleed room.
  const showWallpaper = wallpaper !== "none" && !pathname.startsWith("/focus");

  return (
    // `isolate` creates a stacking context so the wallpaper's z-index:-1 stays inside the app
    // instead of slipping behind <body>'s solid background (which hid it completely).
    <div className="relative isolate flex min-h-dvh">
      {showWallpaper && (
        <div className="wallpaper-layer" aria-hidden>
          <WallpaperArt id={wallpaper} className="h-full w-full" />
          <div className="absolute inset-0 bg-bg/40" />
        </div>
      )}
      <a href="#main" className="sr-only focus:not-sr-only focus:fixed focus:left-4 focus:top-4 focus:z-50 focus:rounded-xl focus:bg-card focus:px-4 focus:py-2 focus:shadow-lg">
        Skip to content
      </a>
      <Sidebar />
      <div className="flex min-w-0 flex-1 flex-col">
        <MobileTopBar />
        <main id="main" className={pathname.startsWith("/focus") ? "flex-1" : "flex-1 pb-28 lg:pb-10"}>
          {children}
        </main>
      </div>
      <MobileBottomNav />
      <MusicDock />
      <TaskModal />
      <CompletionDialog />
      <ShortcutsDialog />
      <Onboarding />
    </div>
  );
}
