"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { motion } from "framer-motion";
import { LogOut, MoreHorizontal, User } from "lucide-react";
import { Logo } from "./logo";
import { BOTTOM_NAV, MAIN_NAV, type NavItem } from "./nav";
import { useData } from "@/stores/data-store";
import { Menu, MenuContent, MenuItem, MenuSeparator, MenuTrigger } from "@/components/ui/misc";
import { signOutAction } from "@/app/actions";
import { useTimer } from "@/stores/timer-store";
import { cn } from "@/lib/utils";
import { useRouter } from "next/navigation";

export function NavLink({ item, onNavigate }: { item: NavItem; onNavigate?: () => void }) {
  const pathname = usePathname();
  const active = pathname === item.href || pathname.startsWith(item.href + "/");
  const Icon = item.icon;
  return (
    <Link
      href={item.href}
      onClick={onNavigate}
      aria-current={active ? "page" : undefined}
      className={cn(
        "group relative flex items-center gap-3 rounded-2xl px-3 py-2.5 text-sm font-semibold transition-colors",
        active ? "text-ink" : "text-muted hover:bg-bg-2/70 hover:text-ink",
      )}
    >
      {active && (
        <motion.span
          layoutId="nav-active"
          className="absolute inset-0 rounded-2xl bg-accent-soft"
          transition={{ type: "spring", stiffness: 500, damping: 40 }}
        />
      )}
      <Icon className={cn("relative size-[18px] transition-colors", active ? "text-accent-strong" : "group-hover:text-ink")} />
      <span className="relative">{item.label}</span>
    </Link>
  );
}

export async function signOutClient() {
  useTimer.getState().clear();
  try {
    localStorage.removeItem("lunova-timer");
  } catch {
    /* noop */
  }
  await signOutAction();
}

export function UserChip() {
  const me = useData((s) => s.me);
  const router = useRouter();
  const initials = (me?.name ?? me?.email ?? "?").trim().slice(0, 1).toUpperCase();
  return (
    <Menu>
      <MenuTrigger asChild>
        <button className="flex w-full items-center gap-3 rounded-2xl p-2 text-left transition-colors hover:bg-bg-2/70">
          {me?.image ? (
            // eslint-disable-next-line @next/next/no-img-element
            <img src={me.image} alt="" className="size-9 rounded-xl object-cover" />
          ) : (
            <span className="grid size-9 place-items-center rounded-xl bg-lavender font-display text-sm font-bold text-ink">
              {initials}
            </span>
          )}
          <span className="min-w-0 flex-1">
            <span className="block truncate text-sm font-semibold text-ink">{me?.name ?? "Friend"}</span>
            <span className="block truncate text-xs text-muted">{me?.email}</span>
          </span>
          <MoreHorizontal className="size-4 text-muted" />
        </button>
      </MenuTrigger>
      <MenuContent align="start">
        <MenuItem icon={<User />} onSelect={() => router.push("/settings")}>
          Account settings
        </MenuItem>
        <MenuSeparator />
        <MenuItem icon={<LogOut />} onSelect={() => void signOutClient()}>
          Sign out
        </MenuItem>
      </MenuContent>
    </Menu>
  );
}

export function Sidebar() {
  return (
    <aside className="lun-sidebar sticky top-0 hidden h-dvh w-64 shrink-0 flex-col border-r border-line/70 bg-card/70 px-4 py-6 backdrop-blur-xl lg:flex">
      <Link href="/dashboard" className="mb-8 px-2" aria-label="Lunova home">
        <Logo />
      </Link>
      <nav aria-label="Main" className="flex flex-1 flex-col gap-1 overflow-y-auto">
        {MAIN_NAV.map((item) => (
          <NavLink key={item.href} item={item} />
        ))}
      </nav>
      <div className="mt-4 flex flex-col gap-1 border-t border-line/70 pt-4">
        {BOTTOM_NAV.map((item) => (
          <NavLink key={item.href} item={item} />
        ))}
        <div className="mt-2">
          <UserChip />
        </div>
      </div>
    </aside>
  );
}
