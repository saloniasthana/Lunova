"use client";

import * as React from "react";
import Link from "next/link";
import { toast } from "sonner";
import { Bell, Database, Download, Keyboard, LogOut, Music2, Palette, Timer, Trash2, User, Volume2 } from "lucide-react";
import { useData } from "@/stores/data-store";
import { useAudio } from "@/stores/audio-store";
import { useUi } from "@/stores/ui-store";
import { PageContainer, PageHeader } from "@/components/layout/page-header";
import { Button } from "@/components/ui/button";
import { Card, CardHeader, Switch } from "@/components/ui/misc";
import { Field, Input, Select } from "@/components/ui/input";
import { ConfirmDialog } from "@/components/ui/states";
import { VolumeSlider } from "@/components/music/music-dock";
import { signOutClient } from "@/components/layout/sidebar";
import { api } from "@/lib/client-api";
import { playChime } from "@/lib/audio/chime";
import { CATALOG } from "@/lib/audio/tracks";
import { THEMES } from "@/lib/themes";
import { clamp } from "@/lib/utils";

const SECTIONS = [
  { id: "account", label: "Account", icon: User },
  { id: "appearance", label: "Appearance", icon: Palette },
  { id: "focus", label: "Focus", icon: Timer },
  { id: "music", label: "Music", icon: Music2 },
  { id: "notifications", label: "Notifications", icon: Bell },
  { id: "data", label: "Data", icon: Database },
];

function Row({ label, hint, children }: { label: string; hint?: string; children: React.ReactNode }) {
  return (
    <div className="flex flex-wrap items-center justify-between gap-3 py-3.5">
      <div className="min-w-0">
        <p className="text-sm font-semibold">{label}</p>
        {hint && <p className="text-xs text-muted">{hint}</p>}
      </div>
      {children}
    </div>
  );
}

function MinutesInput({ value, onCommit, label, max = 180 }: { value: number; onCommit: (v: number) => void; label: string; max?: number }) {
  const [v, setV] = React.useState(String(value));
  const commit = () => {
    const n = clamp(Math.round(Number(v)) || value, 1, max);
    setV(String(n));
    if (n !== value) onCommit(n);
  };
  return (
    <div className="flex items-center gap-2">
      <Input type="number" min={1} max={max} value={v} onChange={(e) => setV(e.target.value)} onBlur={commit} onKeyDown={(e) => e.key === "Enter" && commit()} className="h-9 w-20 text-center" aria-label={label} />
      {max === 180 && <span className="text-xs text-muted">min</span>}
    </div>
  );
}

export function SettingsPage() {
  const me = useData((s) => s.me)!;
  const settings = useData((s) => s.settings)!;
  const update = useData((s) => s.updateSettings);
  const updateProfile = useData((s) => s.updateProfile);
  const load = useData((s) => s.load);
  const audio = useAudio();
  const setShortcutsOpen = useUi((s) => s.setShortcutsOpen);
  const [name, setName] = React.useState(me.name ?? "");
  const [image, setImage] = React.useState(me.image ?? "");
  const [confirm, setConfirm] = React.useState<null | "completed" | "workspace" | "everything" | "account">(null);
  // Rendered client-side only (behind AppShell), so reading `window` here is safe.
  const [perm, setPerm] = React.useState<NotificationPermission | "unsupported">(() => ("Notification" in window ? Notification.permission : "unsupported"));

  const toggleNotifications = async (on: boolean) => {
    if (!on) return void update({ notificationsEnabled: false });
    if (!("Notification" in window)) return void toast.error("This browser doesn't support notifications.");
    const p = Notification.permission === "default" ? await Notification.requestPermission() : Notification.permission;
    setPerm(p);
    if (p !== "granted") return void toast.error("Notifications are blocked. Allow them in your browser's site settings.");
    await update({ notificationsEnabled: true });
    toast.success("Notifications on");
  };

  const reset = async (scope: "completed-tasks" | "workspace" | "everything") => {
    try {
      await api.post("/api/account/reset", { scope });
      useData.setState({ status: "idle" });
      await load();
      toast.success(scope === "completed-tasks" ? "Completed tasks cleared" : scope === "workspace" ? "Workspace reset" : "Your workspace is fresh and empty");
    } catch (e) {
      toast.error(e instanceof Error ? e.message : "Something went wrong.");
    }
  };

  return (
    <PageContainer>
      <PageHeader title="Settings" subtitle="Tune Lunova to fit the way you work." />
      <div className="grid gap-6 lg:grid-cols-[200px_1fr]">
        <nav aria-label="Settings sections" className="-mx-4 flex gap-1 overflow-x-auto px-4 lg:sticky lg:top-6 lg:mx-0 lg:h-fit lg:flex-col lg:px-0">
          {SECTIONS.map((s) => (
            <a key={s.id} href={`#${s.id}`} className="flex shrink-0 items-center gap-2.5 rounded-2xl px-3.5 py-2.5 text-sm font-semibold text-muted transition-colors hover:bg-card hover:text-ink">
              <s.icon className="size-4" /> {s.label}
            </a>
          ))}
        </nav>

        <div className="space-y-5">
          <Card id="account" className="scroll-mt-6">
            <CardHeader title="Account" icon={<User />} />
            <form
              className="grid gap-4 sm:grid-cols-2"
              onSubmit={(e) => {
                e.preventDefault();
                if (!name.trim()) return void toast.error("Name can't be empty");
                if (image && !/^https?:\/\//.test(image)) return void toast.error("Profile picture must be an http(s) image URL");
                void updateProfile({ name: name.trim(), image: image.trim() || null });
              }}
            >
              <Field label="Name" htmlFor="s-name">
                <Input id="s-name" value={name} onChange={(e) => setName(e.target.value)} maxLength={80} />
              </Field>
              <Field label="Email" htmlFor="s-email" hint="Email changes aren't supported yet">
                <Input id="s-email" value={me.email} disabled />
              </Field>
              <Field label="Profile picture URL" htmlFor="s-img" className="sm:col-span-2" hint="Paste a link to an image (optional)">
                <div className="flex items-center gap-3">
                  {image && /^https?:\/\//.test(image) && (
                    // eslint-disable-next-line @next/next/no-img-element
                    <img src={image} alt="" className="size-10 rounded-xl object-cover" />
                  )}
                  <Input id="s-img" value={image} onChange={(e) => setImage(e.target.value)} placeholder="https://…" maxLength={500} />
                </div>
              </Field>
              <div className="flex flex-wrap justify-between gap-2 sm:col-span-2">
                <Button variant="ghost" onClick={() => void signOutClient()}>
                  <LogOut /> Sign out
                </Button>
                <Button type="submit">Save profile</Button>
              </div>
            </form>
          </Card>

          <Card id="appearance" className="scroll-mt-6">
            <CardHeader title="Appearance" icon={<Palette />} action={<Link href="/workspace" className="text-xs font-semibold text-accent-strong hover:underline">More in Customize</Link>} />
            <div className="divide-y divide-line">
              <Row label="Theme">
                <Select value={settings.theme} onChange={(e) => void update({ theme: e.target.value as typeof settings.theme })} className="w-48" aria-label="Theme">
                  {THEMES.map((t) => (
                    <option key={t.id} value={t.id}>
                      {t.name}
                    </option>
                  ))}
                </Select>
              </Row>
              <Row label="Font">
                <Select value={settings.font} onChange={(e) => void update({ font: e.target.value as typeof settings.font })} className="w-48" aria-label="Font">
                  <option value="nunito">Nunito</option>
                  <option value="jakarta">Plus Jakarta Sans</option>
                  <option value="dmsans">DM Sans</option>
                  <option value="inter">Inter</option>
                </Select>
              </Row>
              <Row label="Keyboard shortcuts" hint="Press ? anywhere to see them">
                <Button size="sm" variant="outline" onClick={() => setShortcutsOpen(true)}>
                  <Keyboard /> View shortcuts
                </Button>
              </Row>
            </div>
          </Card>

          <Card id="focus" className="scroll-mt-6">
            <CardHeader title="Focus" icon={<Timer />} />
            <div className="divide-y divide-line">
              <Row label="Focus duration">
                <MinutesInput key={settings.focusDuration} label="Focus duration" value={settings.focusDuration} onCommit={(v) => void update({ focusDuration: v })} />
              </Row>
              <Row label="Short break">
                <MinutesInput key={settings.shortBreakDuration} label="Short break" value={settings.shortBreakDuration} onCommit={(v) => void update({ shortBreakDuration: v })} />
              </Row>
              <Row label="Long break">
                <MinutesInput key={settings.longBreakDuration} label="Long break" value={settings.longBreakDuration} onCommit={(v) => void update({ longBreakDuration: v })} />
              </Row>
              <Row label="Sessions before a long break">
                <MinutesInput key={settings.sessionsBeforeLongBreak} label="Sessions before long break" max={12} value={settings.sessionsBeforeLongBreak} onCommit={(v) => void update({ sessionsBeforeLongBreak: v })} />
              </Row>
              <Row label="Auto-start breaks">
                <Switch checked={settings.autoStartBreaks} onCheckedChange={(v) => void update({ autoStartBreaks: v })} label="Auto-start breaks" />
              </Row>
              <Row label="Auto-start focus sessions">
                <Switch checked={settings.autoStartFocus} onCheckedChange={(v) => void update({ autoStartFocus: v })} label="Auto-start focus sessions" />
              </Row>
            </div>
          </Card>

          <Card id="music" className="scroll-mt-6">
            <CardHeader title="Music" icon={<Music2 />} />
            <div className="divide-y divide-line">
              <Row label="Default volume">
                <div className="flex w-48 items-center gap-2">
                  <Volume2 className="size-4 text-muted" />
                  <VolumeSlider
                    value={settings.musicVolume / 100}
                    onChange={(v) => {
                      audio.setVolume(v);
                      void update({ musicVolume: Math.round(v * 100) });
                    }}
                    label="Default volume"
                  />
                </div>
              </Row>
              <Row label="Default music" hint="What plays when you press play">
                <Select value={audio.currentId} onChange={(e) => useAudio.setState({ currentId: e.target.value })} className="w-48" aria-label="Default music">
                  {CATALOG.map((t) => (
                    <option key={t.id} value={t.id}>
                      {t.title}
                    </option>
                  ))}
                </Select>
              </Row>
              <Row label="Ambient sound preferences" hint="Mix and save your favourite blends">
                <Button size="sm" variant="outline" asChild>
                  <Link href="/music">Open mixer</Link>
                </Button>
              </Row>
              <Row label="Completion sound" hint="A soft chime when a session ends">
                <div className="flex items-center gap-2">
                  <Button size="sm" variant="ghost" onClick={() => playChime(settings.musicVolume / 100)}>
                    Preview
                  </Button>
                  <Switch checked={settings.completionSound} onCheckedChange={(v) => void update({ completionSound: v })} label="Completion sound" />
                </div>
              </Row>
            </div>
          </Card>

          <Card id="notifications" className="scroll-mt-6">
            <CardHeader title="Notifications" icon={<Bell />} />
            <div className="divide-y divide-line">
              <Row label="Browser notifications" hint={perm === "denied" ? "Blocked in your browser — allow them in site settings" : perm === "unsupported" ? "Not supported in this browser" : "Session completions, task reminders and habit reminders"}>
                <Switch checked={settings.notificationsEnabled && perm === "granted"} onCheckedChange={(v) => void toggleNotifications(v)} label="Browser notifications" disabled={perm === "unsupported"} />
              </Row>
              <Row label="Task reminders" hint="When a task with a due time is due (while Lunova is open)">
                <span className="text-xs font-semibold text-muted">{settings.notificationsEnabled ? "On" : "In-app only"}</span>
              </Row>
              <Row label="Habit reminders" hint="At each habit's reminder time (while Lunova is open)">
                <span className="text-xs font-semibold text-muted">{settings.notificationsEnabled ? "On" : "In-app only"}</span>
              </Row>
              {settings.notificationsEnabled && perm === "granted" && (
                <Row label="Test it">
                  <Button size="sm" variant="outline" onClick={() => new Notification("Hello from Lunova 🌙", { body: "Notifications are working." })}>
                    Send a test notification
                  </Button>
                </Row>
              )}
            </div>
          </Card>

          <Card id="data" className="scroll-mt-6">
            <CardHeader title="Your data" icon={<Database />} />
            <div className="divide-y divide-line">
              <Row label="Export your data" hint="Download everything as JSON">
                <Button size="sm" variant="outline" asChild>
                  <a href="/api/account/export" download>
                    <Download /> Export
                  </a>
                </Button>
              </Row>
              <Row label="Clear completed tasks">
                <Button size="sm" variant="outline" onClick={() => setConfirm("completed")}>
                  Clear
                </Button>
              </Row>
              <Row label="Reset workspace settings" hint="Theme, timer and companion back to defaults">
                <Button size="sm" variant="outline" onClick={() => setConfirm("workspace")}>
                  Reset
                </Button>
              </Row>
              <Row label="Erase all productivity data" hint="Tasks, habits, sessions, events, garden — keeps your account">
                <Button size="sm" variant="danger" onClick={() => setConfirm("everything")}>
                  Erase
                </Button>
              </Row>
              <Row label="Delete account" hint="Permanently removes your account and every piece of data">
                <Button size="sm" variant="danger" onClick={() => setConfirm("account")}>
                  <Trash2 /> Delete account
                </Button>
              </Row>
            </div>
          </Card>
        </div>
      </div>

      <ConfirmDialog open={confirm === "completed"} onOpenChange={(v) => !v && setConfirm(null)} title="Clear completed tasks?" description="All finished tasks will be deleted. Your focus stats stay." confirmLabel="Clear tasks" onConfirm={() => reset("completed-tasks")} />
      <ConfirmDialog open={confirm === "workspace"} onOpenChange={(v) => !v && setConfirm(null)} title="Reset workspace settings?" description="Appearance, timer and companion settings return to their defaults." confirmLabel="Reset" onConfirm={() => reset("workspace")} />
      <ConfirmDialog open={confirm === "everything"} onOpenChange={(v) => !v && setConfirm(null)} title="Erase all productivity data?" description="This can't be undone. Tasks, habits, sessions, events and your garden will be removed." confirmLabel="Erase everything" requireText="ERASE" onConfirm={() => reset("everything")} />
      <ConfirmDialog
        open={confirm === "account"}
        onOpenChange={(v) => !v && setConfirm(null)}
        title="Delete your account?"
        description="This permanently deletes your account and all of your data. It can't be undone."
        confirmLabel="Delete forever"
        requireText="DELETE"
        onConfirm={async () => {
          try {
            await api.post("/api/account/delete", { confirm: "DELETE" });
            await signOutClient();
          } catch (e) {
            toast.error(e instanceof Error ? e.message : "Couldn't delete the account.");
          }
        }}
      />
    </PageContainer>
  );
}
