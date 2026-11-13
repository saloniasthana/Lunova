"use client";

import * as React from "react";
import { Switch as S, DropdownMenu as DM, Tooltip as T } from "radix-ui";
import { cn } from "@/lib/utils";

// ── Card ──
export function Card({ className, ...props }: React.HTMLAttributes<HTMLDivElement>) {
  return (
    <div
      className={cn("lun-card rounded-3xl border border-line bg-card p-5 shadow-[var(--shadow-soft)] sm:p-6", className)}
      {...props}
    />
  );
}

export function CardHeader({
  title,
  icon,
  action,
  subtitle,
  className,
}: {
  title: string;
  icon?: React.ReactNode;
  action?: React.ReactNode;
  subtitle?: string;
  className?: string;
}) {
  return (
    <div className={cn("mb-4 flex items-center justify-between gap-3", className)}>
      <div className="flex min-w-0 items-center gap-2.5">
        {icon && (
          <span className="grid size-8 shrink-0 place-items-center rounded-xl bg-accent-soft text-accent-strong [&_svg]:size-4">
            {icon}
          </span>
        )}
        <div className="min-w-0">
          <h2 className="truncate font-display text-[15px] font-bold text-ink">{title}</h2>
          {subtitle && <p className="truncate text-xs text-muted">{subtitle}</p>}
        </div>
      </div>
      {action}
    </div>
  );
}

// ── Switch ──
export function Switch({
  checked,
  onCheckedChange,
  id,
  label,
  disabled,
}: {
  checked: boolean;
  onCheckedChange: (v: boolean) => void;
  id?: string;
  label?: string;
  disabled?: boolean;
}) {
  return (
    <S.Root
      id={id}
      checked={checked}
      onCheckedChange={onCheckedChange}
      aria-label={label}
      disabled={disabled}
      className="relative h-6 w-11 shrink-0 cursor-pointer rounded-full bg-line transition-colors data-[state=checked]:bg-accent-strong disabled:opacity-50"
    >
      <S.Thumb className="block size-5 translate-x-0.5 rounded-full bg-white shadow transition-transform data-[state=checked]:translate-x-[22px]" />
    </S.Root>
  );
}

// ── Badge ──
export function Badge({
  className,
  style,
  children,
}: {
  className?: string;
  style?: React.CSSProperties;
  children: React.ReactNode;
}) {
  return (
    <span
      style={style}
      className={cn(
        "inline-flex items-center gap-1 whitespace-nowrap rounded-full px-2 py-0.5 text-[11px] font-semibold leading-4",
        className,
      )}
    >
      {children}
    </span>
  );
}

// ── Progress bar ──
export function ProgressBar({ value, className, color }: { value: number; className?: string; color?: string }) {
  const pct = Math.max(0, Math.min(100, value));
  return (
    <div
      role="progressbar"
      aria-valuenow={Math.round(pct)}
      aria-valuemin={0}
      aria-valuemax={100}
      className={cn("h-2 w-full overflow-hidden rounded-full bg-bg-2", className)}
    >
      <div
        className="h-full rounded-full transition-[width] duration-700 ease-out"
        style={{ width: `${pct}%`, background: color ?? "var(--accent-strong)" }}
      />
    </div>
  );
}

// ── Progress ring ──
export function ProgressRing({
  value,
  size = 64,
  stroke = 6,
  color,
  track,
  children,
}: {
  value: number;
  size?: number;
  stroke?: number;
  color?: string;
  track?: string;
  children?: React.ReactNode;
}) {
  const r = (size - stroke) / 2;
  const c = 2 * Math.PI * r;
  const pct = Math.max(0, Math.min(1, value));
  return (
    <div className="relative grid place-items-center" style={{ width: size, height: size }}>
      <svg width={size} height={size} className="-rotate-90" aria-hidden>
        <circle cx={size / 2} cy={size / 2} r={r} fill="none" stroke={track ?? "var(--bg-2)"} strokeWidth={stroke} />
        <circle
          cx={size / 2}
          cy={size / 2}
          r={r}
          fill="none"
          stroke={color ?? "var(--accent-strong)"}
          strokeWidth={stroke}
          strokeLinecap="round"
          strokeDasharray={c}
          strokeDashoffset={c * (1 - pct)}
          style={{ transition: "stroke-dashoffset 600ms ease" }}
        />
      </svg>
      <div className="absolute inset-0 grid place-items-center">{children}</div>
    </div>
  );
}

// ── Skeleton ──
export function Skeleton({ className }: { className?: string }) {
  return <div className={cn("animate-pulse rounded-xl bg-bg-2", className)} />;
}

// ── Segmented control ──
export function Segmented<T extends string>({
  value,
  onChange,
  options,
  className,
  size = "md",
  label,
}: {
  value: T;
  onChange: (v: T) => void;
  options: { value: T; label: React.ReactNode }[];
  className?: string;
  size?: "sm" | "md";
  label?: string;
}) {
  return (
    <div role="radiogroup" aria-label={label} className={cn("inline-flex gap-1 rounded-2xl bg-bg-2 p-1", className)}>
      {options.map((o) => (
        <button
          key={o.value}
          type="button"
          role="radio"
          aria-checked={value === o.value}
          onClick={() => onChange(o.value)}
          className={cn(
            "rounded-xl font-semibold transition-all",
            size === "sm" ? "px-2.5 py-1 text-xs" : "px-3.5 py-1.5 text-sm",
            value === o.value ? "bg-card text-ink shadow-[var(--shadow-soft)]" : "text-muted hover:text-ink",
          )}
        >
          {o.label}
        </button>
      ))}
    </div>
  );
}

// ── Dropdown menu ──
export const Menu = DM.Root;
export const MenuTrigger = DM.Trigger;

export function MenuContent({ children, align = "end" }: { children: React.ReactNode; align?: "start" | "end" | "center" }) {
  return (
    <DM.Portal>
      <DM.Content
        align={align}
        sideOffset={6}
        className="z-50 min-w-44 rounded-2xl border border-line bg-card p-1.5 shadow-[var(--shadow-lift)] data-[state=open]:animate-[fadeIn_120ms_ease]"
      >
        {children}
      </DM.Content>
    </DM.Portal>
  );
}

export function MenuItem({
  children,
  onSelect,
  danger,
  icon,
}: {
  children: React.ReactNode;
  onSelect: () => void;
  danger?: boolean;
  icon?: React.ReactNode;
}) {
  return (
    <DM.Item
      onSelect={onSelect}
      className={cn(
        "flex cursor-pointer select-none items-center gap-2.5 rounded-xl px-2.5 py-2 text-sm outline-none transition-colors data-[highlighted]:bg-bg-2 [&_svg]:size-4",
        danger ? "text-[#b45555] dark:text-danger" : "text-ink",
      )}
    >
      {icon}
      {children}
    </DM.Item>
  );
}

export function MenuSeparator() {
  return <DM.Separator className="my-1 h-px bg-line" />;
}

// ── Tooltip ──
export function Tip({ label, children }: { label: string; children: React.ReactNode }) {
  return (
    <T.Provider delayDuration={300}>
      <T.Root>
        <T.Trigger asChild>{children}</T.Trigger>
        <T.Portal>
          <T.Content
            sideOffset={6}
            className="z-50 rounded-lg bg-ink px-2 py-1 text-xs font-medium text-bg shadow-[var(--shadow-lift)]"
          >
            {label}
          </T.Content>
        </T.Portal>
      </T.Root>
    </T.Provider>
  );
}
