"use client";

import * as React from "react";
import { CornerDownLeft, Plus } from "lucide-react";
import { useData } from "@/stores/data-store";
import type { Priority } from "@/types";
import { addDays, todayKey } from "@/lib/dates";
import { cn } from "@/lib/utils";

/**
 * Quick add with a tiny natural syntax:
 *   "Read chapter 3 !high #study tomorrow"
 *   !low !medium !high !urgent · #category-or-tag · today / tomorrow
 */
export function parseQuickAdd(raw: string, categories: { id: string; name: string }[]) {
  let title = raw;
  let priority: Priority | undefined;
  let dueDate: string | null | undefined;
  let categoryId: string | undefined;
  const tags: string[] = [];

  title = title.replace(/(^|\s)!(low|medium|high|urgent)\b/i, (_, s, p: string) => {
    priority = p.toUpperCase() as Priority;
    return s;
  });
  title = title.replace(/(^|\s)(today|tomorrow)\b/i, (_, s, d: string) => {
    dueDate = d.toLowerCase() === "today" ? todayKey() : addDays(todayKey(), 1);
    return s;
  });
  title = title.replace(/(^|\s)#([\w-]+)/g, (_, s, tag: string) => {
    const cat = categories.find((c) => c.name.toLowerCase() === tag.toLowerCase());
    if (cat && !categoryId) categoryId = cat.id;
    else tags.push(tag);
    return s;
  });
  return { title: title.replace(/\s+/g, " ").trim(), priority, dueDate, categoryId, tags };
}

export function QuickAdd({ defaultDate, placeholder, className }: { defaultDate?: string | null; placeholder?: string; className?: string }) {
  const categories = useData((s) => s.categories) ?? [];
  const addTask = useData((s) => s.addTask);
  const [value, setValue] = React.useState("");
  const [busy, setBusy] = React.useState(false);

  const submit = async (e: React.FormEvent) => {
    e.preventDefault();
    const parsed = parseQuickAdd(value, categories);
    if (!parsed.title || busy) return;
    setBusy(true);
    const created = await addTask({
      title: parsed.title,
      priority: parsed.priority ?? "MEDIUM",
      dueDate: parsed.dueDate !== undefined ? parsed.dueDate : defaultDate === undefined ? todayKey() : defaultDate,
      categoryId: parsed.categoryId ?? null,
      tags: parsed.tags,
    });
    setBusy(false);
    if (created) setValue("");
  };

  return (
    <form onSubmit={submit} className={cn("group relative", className)}>
      <Plus className="pointer-events-none absolute left-3.5 top-1/2 size-4 -translate-y-1/2 text-muted" aria-hidden />
      <input
        value={value}
        onChange={(e) => setValue(e.target.value)}
        placeholder={placeholder ?? "Add a task… try “Read 20 pages !high tomorrow”"}
        aria-label="Quick add task"
        maxLength={200}
        className="h-11 w-full rounded-2xl border border-dashed border-line bg-card/60 pl-10 pr-12 text-sm text-ink placeholder:text-muted/80 transition-all focus:border-solid focus:border-accent-strong/50 focus:bg-card focus:outline-none focus:ring-4 focus:ring-accent/20"
      />
      <button
        type="submit"
        disabled={!value.trim() || busy}
        className="absolute right-2 top-1/2 grid size-7 -translate-y-1/2 place-items-center rounded-lg bg-accent-soft text-accent-strong opacity-0 transition-opacity group-focus-within:opacity-100 disabled:opacity-0"
        aria-label="Add task"
      >
        <CornerDownLeft className="size-3.5" />
      </button>
    </form>
  );
}
