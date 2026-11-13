"use client";

import * as React from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { Dialog as D } from "radix-ui";
import { Menu as MenuIcon, X } from "lucide-react";
import { BOTTOM_NAV, MAIN_NAV, MOBILE_PRIMARY } from "./nav";
import { NavLink, UserChip } from "./sidebar";
import { Logo } from "./logo";
import { cn } from "@/lib/utils";

export function MobileTopBar() {
  return (
    <header className="sticky top-0 z-30 flex items-center justify-between border-b border-line/60 bg-bg/80 px-4 py-3 backdrop-blur-xl lg:hidden">
      <Link href="/dashboard" aria-label="Lunova home">
        <Logo />
      </Link>
    </header>
  );
}

export function MobileBottomNav() {
  const pathname = usePathname();
  const [open, setOpen] = React.useState(false);
  const primary = MAIN_NAV.filter((n) => MOBILE_PRIMARY.includes(n.href));
  const moreActive = !primary.some((n) => pathname.startsWith(n.href));

  return (
    <>
      <nav
        aria-label="Main"
        className="fixed inset-x-0 bottom-0 z-40 border-t border-line/70 bg-card/90 px-2 pb-[max(env(safe-area-inset-bottom),0.5rem)] pt-1.5 backdrop-blur-xl lg:hidden"
      >
        <ul className="mx-auto flex max-w-md items-stretch justify-between">
          {primary.map((item) => {
            const active = pathname.startsWith(item.href);
            const Icon = item.icon;
            return (
              <li key={item.href} className="flex-1">
                <Link
                  href={item.href}
                  aria-current={active ? "page" : undefined}
                  className={cn(
                    "flex flex-col items-center gap-0.5 rounded-xl py-1.5 text-[11px] font-semibold",
                    active ? "text-accent-strong" : "text-muted",
                  )}
                >
                  <span className={cn("grid h-7 w-12 place-items-center rounded-full transition-colors", active && "bg-accent-soft")}>
                    <Icon className="size-[18px]" />
                  </span>
                  {item.label.replace("My ", "").replace(" Studio", "")}
                </Link>
              </li>
            );
          })}
          <li className="flex-1">
            <button
              type="button"
              onClick={() => setOpen(true)}
              className={cn(
                "flex w-full flex-col items-center gap-0.5 rounded-xl py-1.5 text-[11px] font-semibold",
                moreActive ? "text-accent-strong" : "text-muted",
              )}
              aria-haspopup="dialog"
            >
              <span className={cn("grid h-7 w-12 place-items-center rounded-full", moreActive && "bg-accent-soft")}>
                <MenuIcon className="size-[18px]" />
              </span>
              More
            </button>
          </li>
        </ul>
      </nav>

      <D.Root open={open} onOpenChange={setOpen}>
        <D.Portal>
          <D.Overlay className="fixed inset-0 z-50 bg-[#2a2833]/25 backdrop-blur-[2px] lg:hidden" />
          <D.Content className="fixed inset-y-0 right-0 z-50 flex w-[85%] max-w-xs flex-col bg-card px-4 py-5 shadow-[var(--shadow-lift)] focus:outline-none lg:hidden data-[state=open]:animate-[fadeIn_160ms_ease]">
            <div className="mb-6 flex items-center justify-between px-2">
              <Logo />
              <D.Close className="rounded-xl p-2 text-muted hover:bg-bg-2" aria-label="Close menu">
                <X className="size-5" />
              </D.Close>
            </div>
            <D.Title className="sr-only">Navigation</D.Title>
            <D.Description className="sr-only">All Lunova sections</D.Description>
            <nav className="flex flex-1 flex-col gap-1 overflow-y-auto">
              {MAIN_NAV.map((item) => (
                <NavLink key={item.href} item={item} onNavigate={() => setOpen(false)} />
              ))}
              <div className="my-2 h-px bg-line" />
              {BOTTOM_NAV.map((item) => (
                <NavLink key={item.href} item={item} onNavigate={() => setOpen(false)} />
              ))}
            </nav>
            <div className="border-t border-line pt-3">
              <UserChip />
            </div>
          </D.Content>
        </D.Portal>
      </D.Root>
    </>
  );
}
