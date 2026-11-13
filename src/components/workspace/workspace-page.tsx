"use client";

import * as React from "react";
import { Check, LayoutDashboard, Palette, PawPrint, RotateCcw, Type, Wallpaper as WallpaperIcon } from "lucide-react";
import { useData } from "@/stores/data-store";
import { usePrefs, type DashboardWidget } from "@/stores/prefs-store";
import { PageContainer, PageHeader } from "@/components/layout/page-header";
import { Button } from "@/components/ui/button";
import { Card, CardHeader, Segmented, Switch } from "@/components/ui/misc";
import { ConfirmDialog } from "@/components/ui/states";
import { ACCESSORIES, COMPANIONS, CompanionArt } from "@/components/companion/companion";
import { WALLPAPERS, WallpaperArt, type WallpaperCategory } from "./wallpapers";
import { ACCENT_PRESETS, FONTS, THEMES } from "@/lib/themes";
import type { CompanionType, FontId } from "@/types";
import { cn } from "@/lib/utils";

const WP_CATEGORIES: ("All" | WallpaperCategory)[] = ["All", "Minimal", "Pastel", "Sky", "Nature", "Cozy room", "Study room", "Seasonal"];
const BG_PRESETS = ["#FAF9F6", "#F7F4EF", "#F6F8FB", "#FBF7F9", "#F6F9F5"];

function Row({ label, hint, children }: { label: string; hint?: string; children: React.ReactNode }) {
  return (
    <div className="flex items-center justify-between gap-4 py-3">
      <div>
        <p className="text-sm font-semibold">{label}</p>
        {hint && <p className="text-xs text-muted">{hint}</p>}
      </div>
      {children}
    </div>
  );
}

export function WorkspacePage() {
  const settings = useData((s) => s.settings)!;
  const update = useData((s) => s.updateSettings);
  const prefs = usePrefs();
  const [wpCat, setWpCat] = React.useState<(typeof WP_CATEGORIES)[number]>("All");
  const [picked, setPreview] = React.useState<string | null>(null);
  const preview = picked ?? settings.wallpaper;
  const [confirmReset, setConfirmReset] = React.useState(false);

  const resetAll = async () => {
    prefs.reset();
    await update({ theme: "cloud", accentColor: null, wallpaper: "none", font: "nunito", companionEnabled: true, companionType: "cat", companionAccessory: "none", companionSize: "md", showQuotes: true, showMusicPlayer: true });
  };

  return (
    <PageContainer>
      <PageHeader
        title="Customize your space"
        subtitle="Make Lunova feel like your own little room."
        actions={
          <Button variant="outline" onClick={() => setConfirmReset(true)}>
            <RotateCcw /> Reset to default
          </Button>
        }
      />

      <div className="grid gap-5 xl:grid-cols-2">
        {/* Themes */}
        <Card className="xl:col-span-2">
          <CardHeader title="Theme" icon={<Palette />} subtitle="Soft palettes for long, comfortable sessions" />
          <div className="grid grid-cols-2 gap-3 sm:grid-cols-4 xl:grid-cols-7">
            {THEMES.map((t) => {
              const active = settings.theme === t.id;
              return (
                <button key={t.id} onClick={() => void update({ theme: t.id })} className={cn("group overflow-hidden rounded-2xl border-2 text-left transition-all", active ? "border-accent-strong shadow-[var(--shadow-lift)]" : "border-line hover:border-accent")} aria-pressed={active}>
                  <div className="relative h-20 p-2.5" style={{ background: t.swatches[0] }}>
                    <div className="h-2.5 w-14 rounded-full" style={{ background: t.swatches[1] }} />
                    <div className="mt-1.5 h-2 w-9 rounded-full opacity-70" style={{ background: t.swatches[2] }} />
                    <div className="absolute bottom-2.5 right-2.5 size-7 rounded-xl" style={{ background: t.swatches[1] }} />
                    {active && (
                      <span className="absolute left-2.5 top-8 grid size-5 place-items-center rounded-full bg-white shadow">
                        <Check className="size-3 text-[#34343B]" />
                      </span>
                    )}
                  </div>
                  <div className="px-2.5 py-2">
                    <p className="truncate text-xs font-bold">{t.name}</p>
                    <p className="truncate text-[11px] text-muted">{t.description}</p>
                  </div>
                </button>
              );
            })}
          </div>
          <div className="mt-5 grid gap-5 border-t border-line pt-5 md:grid-cols-2">
            <div>
              <p className="mb-2 text-sm font-semibold">Accent colour</p>
              <div className="flex flex-wrap items-center gap-2">
                <button onClick={() => void update({ accentColor: null })} className={cn("h-8 rounded-full border-2 px-3 text-xs font-bold", !settings.accentColor ? "border-accent-strong bg-accent-soft" : "border-line")}>
                  Theme default
                </button>
                {ACCENT_PRESETS.map((c) => (
                  <button key={c} onClick={() => void update({ accentColor: c })} className={cn("size-8 rounded-full border-2 transition-transform", settings.accentColor?.toLowerCase() === c.toLowerCase() ? "scale-110 border-ink/40" : "border-transparent")} style={{ background: c }} aria-label={`Accent ${c}`} aria-pressed={settings.accentColor === c} />
                ))}
                <label className="relative size-8 cursor-pointer overflow-hidden rounded-full border-2 border-dashed border-line" title="Custom colour">
                  <input type="color" value={settings.accentColor ?? "#5f8fc4"} onChange={(e) => void update({ accentColor: e.target.value })} className="absolute inset-0 size-full cursor-pointer opacity-0" aria-label="Custom accent colour" />
                  <span className="grid size-full place-items-center text-xs text-muted">+</span>
                </label>
              </div>
            </div>
            <div>
              <p className="mb-2 text-sm font-semibold">Background tone</p>
              <div className="flex flex-wrap items-center gap-2">
                <button onClick={() => prefs.set({ bgColor: null })} className={cn("h-8 rounded-full border-2 px-3 text-xs font-bold", !prefs.bgColor ? "border-accent-strong bg-accent-soft" : "border-line")}>
                  Theme default
                </button>
                {BG_PRESETS.map((c) => (
                  <button key={c} onClick={() => prefs.set({ bgColor: c })} className={cn("size-8 rounded-full border-2", prefs.bgColor === c ? "border-accent-strong" : "border-line")} style={{ background: c }} aria-label={`Background ${c}`} aria-pressed={prefs.bgColor === c} />
                ))}
              </div>
              <p className="mt-1.5 text-[11px] text-muted">Saved on this device. Best with light themes.</p>
            </div>
          </div>
        </Card>

        {/* Wallpaper */}
        <Card className="xl:col-span-2">
          <CardHeader
            title="Wallpaper"
            icon={<WallpaperIcon />}
            subtitle="Original illustrations, softened behind your workspace"
            action={
              settings.wallpaper !== "none" ? (
                <Button size="sm" variant="ghost" onClick={() => void update({ wallpaper: "none" })}>
                  <RotateCcw /> Reset
                </Button>
              ) : undefined
            }
          />
          <div className="grid gap-5 lg:grid-cols-[1.2fr_1fr]">
            <div>
              <div className="relative aspect-video overflow-hidden rounded-2xl border border-line">
                {preview === "none" ? <div className="grid h-full place-items-center bg-bg-2 text-sm font-semibold text-muted">Plain background</div> : <WallpaperArt id={preview} className="h-full w-full" />}
                <span className="absolute left-3 top-3 rounded-full bg-white/85 px-2.5 py-1 text-[11px] font-bold text-[#34343B]">{preview === settings.wallpaper ? "Current" : "Preview"}</span>
              </div>
              <div className="mt-3 flex items-center justify-between gap-3">
                <p className="text-sm font-semibold">{WALLPAPERS.find((w) => w.id === preview)?.name}</p>
                <Button size="sm" disabled={preview === settings.wallpaper} onClick={() => {
                    void update({ wallpaper: preview });
                    setPreview(null);
                  }}>
                  Apply wallpaper
                </Button>
              </div>
            </div>
            <div>
              <div className="-mx-1 mb-3 overflow-x-auto px-1 pb-1">
                <Segmented size="sm" label="Wallpaper category" value={wpCat} onChange={setWpCat} options={WP_CATEGORIES.map((c) => ({ value: c, label: c }))} className="w-max" />
              </div>
              <div className="grid grid-cols-3 gap-2">
                {WALLPAPERS.filter((w) => wpCat === "All" || w.category === wpCat).map((w) => (
                  <button key={w.id} onClick={() => setPreview(w.id)} className={cn("relative aspect-[4/3] overflow-hidden rounded-xl border-2 transition-all", preview === w.id ? "border-accent-strong" : "border-transparent hover:border-accent")} aria-label={`Preview ${w.name}`} aria-pressed={preview === w.id}>
                    {w.id === "none" ? <div className="h-full bg-bg-2" /> : <WallpaperArt id={w.id} className="pointer-events-none h-full w-full" />}
                    <span className="absolute inset-x-0 bottom-0 truncate bg-black/30 px-1.5 py-0.5 text-left text-[10px] font-bold text-white">{w.name}</span>
                    {settings.wallpaper === w.id && <Check className="absolute right-1 top-1 size-4 rounded-full bg-white p-0.5 text-[#34343B]" />}
                  </button>
                ))}
              </div>
            </div>
          </div>
        </Card>

        {/* Companion */}
        <Card>
          <CardHeader title="Companion" icon={<PawPrint />} subtitle="A quiet friend who studies with you" action={<Switch checked={settings.companionEnabled} onCheckedChange={(v) => void update({ companionEnabled: v })} label="Show companion" />} />
          <div className={cn("grid gap-5 sm:grid-cols-[140px_1fr]", !settings.companionEnabled && "pointer-events-none opacity-50")}>
            <div className="grid place-items-center rounded-2xl bg-gradient-to-b from-accent-soft to-card p-3">
              <CompanionArt type={settings.companionType} accessory={settings.companionAccessory} mood="idle" size={120} />
            </div>
            <div className="space-y-4">
              <div>
                <p className="mb-1.5 text-xs font-semibold text-muted">Friend</p>
                <div className="grid grid-cols-3 gap-2">
                  {COMPANIONS.map((c) => (
                    <button key={c.id} onClick={() => void update({ companionType: c.id as CompanionType })} className={cn("grid place-items-center rounded-2xl border-2 p-1.5", settings.companionType === c.id ? "border-accent-strong bg-accent-soft" : "border-line")} aria-label={c.name} aria-pressed={settings.companionType === c.id}>
                      <CompanionArt type={c.id} size={48} />
                    </button>
                  ))}
                </div>
              </div>
              <div>
                <p className="mb-1.5 text-xs font-semibold text-muted">Accessory</p>
                <div className="flex flex-wrap gap-1.5">
                  {ACCESSORIES.map((a) => (
                    <button key={a.id} onClick={() => void update({ companionAccessory: a.id })} className={cn("rounded-full border px-2.5 py-1 text-xs font-semibold", settings.companionAccessory === a.id ? "border-accent-strong bg-accent-soft text-accent-strong" : "border-line text-muted hover:text-ink")} aria-pressed={settings.companionAccessory === a.id}>
                      {a.name}
                    </button>
                  ))}
                </div>
              </div>
              <div className="flex items-center justify-between gap-3">
                <p className="text-xs font-semibold text-muted">Size</p>
                <Segmented size="sm" label="Companion size" value={settings.companionSize} onChange={(v) => void update({ companionSize: v })} options={[{ value: "sm", label: "Small" }, { value: "md", label: "Medium" }, { value: "lg", label: "Large" }]} />
              </div>
            </div>
          </div>
        </Card>

        {/* Typography & layout */}
        <Card>
          <CardHeader title="Typography & layout" icon={<Type />} />
          <div className="grid grid-cols-2 gap-2">
            {FONTS.map((f) => (
              <button key={f.id} onClick={() => void update({ font: f.id as FontId })} className={cn("rounded-2xl border-2 px-3 py-2.5 text-left", settings.font === f.id ? "border-accent-strong bg-accent-soft" : "border-line hover:border-accent")} style={{ fontFamily: `var(--font-${f.id})` }} aria-pressed={settings.font === f.id}>
                <p className="text-sm font-bold">{f.name}</p>
                <p className="text-[11px] text-muted">{f.note}</p>
              </button>
            ))}
          </div>
          <div className="mt-4 divide-y divide-line">
            <Row label="Card style">
              <Segmented size="sm" label="Card style" value={prefs.cardStyle} onChange={(v) => prefs.set({ cardStyle: v })} options={[{ value: "soft", label: "Soft" }, { value: "flat", label: "Flat" }, { value: "glass", label: "Glass" }]} />
            </Row>
            <Row label="Sidebar">
              <Segmented size="sm" label="Sidebar style" value={prefs.sidebarStyle} onChange={(v) => prefs.set({ sidebarStyle: v })} options={[{ value: "light", label: "Light" }, { value: "tinted", label: "Tinted" }]} />
            </Row>
          </div>
        </Card>

        {/* Workspace widgets */}
        <Card className="xl:col-span-2">
          <CardHeader title="Workspace" icon={<LayoutDashboard />} subtitle="Choose what appears in your space" />
          <div className="grid gap-x-8 divide-y divide-line md:grid-cols-2 md:divide-y-0">
            <div className="divide-y divide-line">
              <Row label="Motivational quotes" hint="Shown on your home dashboard">
                <Switch checked={settings.showQuotes} onCheckedChange={(v) => void update({ showQuotes: v })} label="Motivational quotes" />
              </Row>
              <Row label="Floating music player" hint="Stays with you across pages">
                <Switch checked={settings.showMusicPlayer} onCheckedChange={(v) => void update({ showMusicPlayer: v })} label="Floating music player" />
              </Row>
              <Row label="Companion" hint="Visible on Home and in Focus Studio">
                <Switch checked={settings.companionEnabled} onCheckedChange={(v) => void update({ companionEnabled: v })} label="Companion" />
              </Row>
            </div>
            <div className="divide-y divide-line">
              {(
                [
                  ["habits", "Habits widget"],
                  ["stats", "Weekly focus widget"],
                  ["workspace", "My space preview"],
                  ["motivation", "Encouragement card"],
                ] as [DashboardWidget, string][]
              ).map(([k, label]) => (
                <Row key={k} label={label} hint="Home dashboard">
                  <Switch checked={prefs.widgets[k]} onCheckedChange={() => prefs.toggleWidget(k)} label={label} />
                </Row>
              ))}
            </div>
          </div>
        </Card>
      </div>

      <ConfirmDialog open={confirmReset} onOpenChange={setConfirmReset} title="Reset your workspace look?" description="Theme, colours, wallpaper, companion and layout go back to the defaults. Your tasks and data are untouched." confirmLabel="Reset" danger={false} onConfirm={resetAll} />
    </PageContainer>
  );
}
