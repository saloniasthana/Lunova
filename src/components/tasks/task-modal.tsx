"use client";

import * as React from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { Plus, Trash2, X } from "lucide-react";
import { Dialog, DialogContent } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Field, Input, Select, Textarea } from "@/components/ui/input";
import { Segmented } from "@/components/ui/misc";
import { useUi } from "@/stores/ui-store";
import { useData } from "@/stores/data-store";
import type { Priority } from "@/types";
import { PRIORITY_META, SWATCHES, cn, swatch, uid } from "@/lib/utils";
import { todayKey } from "@/lib/dates";

const formSchema = z.object({
  title: z.string().trim().min(1, "Give your task a name").max(200),
  description: z.string().max(5000),
  notes: z.string().max(5000),
  priority: z.enum(["LOW", "MEDIUM", "HIGH", "URGENT"]),
  categoryId: z.string(),
  projectId: z.string(),
  dueDate: z.string(),
  dueTime: z.string(),
  estimatedDuration: z.string().refine((v) => v === "" || (/^\d+$/.test(v) && +v >= 1 && +v <= 1440), "1–1440 minutes"),
});
type FormValues = z.infer<typeof formSchema>;

type SubtaskDraft = { key: string; id?: string; title: string; completed: boolean };

export function TaskModal() {
  const { open, task, defaults } = useUi((s) => s.taskModal);
  const close = useUi((s) => s.closeTaskModal);
  const categories = useData((s) => s.categories) ?? [];
  const projects = useData((s) => s.projects) ?? [];
  const addTask = useData((s) => s.addTask);
  const updateTask = useData((s) => s.updateTask);
  const addCategory = useData((s) => s.addCategory);
  const addProject = useData((s) => s.addProject);

  const [subtasks, setSubtasks] = React.useState<SubtaskDraft[]>([]);
  const [subDraft, setSubDraft] = React.useState("");
  const [tags, setTags] = React.useState<string[]>([]);
  const [tagDraft, setTagDraft] = React.useState("");
  const [newCat, setNewCat] = React.useState<string | null>(null);
  const [newProj, setNewProj] = React.useState<string | null>(null);

  const form = useForm<FormValues>({ resolver: zodResolver(formSchema) });
  const { register, handleSubmit, reset, setValue, watch, formState } = form;

  React.useEffect(() => {
    if (!open) return;
    const src = task ?? defaults;
    reset({
      title: src.title ?? "",
      description: src.description ?? "",
      notes: src.notes ?? "",
      priority: (src.priority as Priority) ?? "MEDIUM",
      categoryId: src.categoryId ?? "",
      projectId: src.projectId ?? "",
      dueDate: src.dueDate ?? (task ? "" : todayKey()),
      dueTime: src.dueTime ?? "",
      estimatedDuration: src.estimatedDuration ? String(src.estimatedDuration) : "",
    });
    setSubtasks((task?.subtasks ?? []).map((s) => ({ key: s.id, id: s.id, title: s.title, completed: s.completed })));
    setTags(src.tags ?? []);
    setSubDraft("");
    setTagDraft("");
    setNewCat(null);
    setNewProj(null);
  }, [open, task, defaults, reset]);

  const priority = watch("priority");

  const addSub = () => {
    const t = subDraft.trim();
    if (!t) return;
    setSubtasks((s) => [...s, { key: uid(), title: t, completed: false }]);
    setSubDraft("");
  };

  const addTag = () => {
    const t = tagDraft.trim().replace(/^#/, "").slice(0, 30);
    if (t && !tags.includes(t) && tags.length < 12) setTags([...tags, t]);
    setTagDraft("");
  };

  const onSubmit = handleSubmit(async (v) => {
    const payload = {
      title: v.title.trim(),
      description: v.description.trim() || null,
      notes: v.notes.trim() || null,
      priority: v.priority,
      categoryId: v.categoryId || null,
      projectId: v.projectId || null,
      dueDate: v.dueDate || null,
      dueTime: v.dueTime || null,
      estimatedDuration: v.estimatedDuration ? Number(v.estimatedDuration) : null,
      tags,
      subtasks: subtasks.map((s) => ({ id: s.id, title: s.title, completed: s.completed })),
    };
    const saved = task ? await updateTask(task.id, payload) : await addTask(payload);
    if (saved) close();
  });

  const createCategory = async () => {
    if (!newCat?.trim()) return setNewCat(null);
    const colors = Object.keys(SWATCHES);
    const c = await addCategory({ name: newCat.trim(), color: colors[categories.length % colors.length] });
    if (c) setValue("categoryId", c.id);
    setNewCat(null);
  };

  const createProject = async () => {
    if (!newProj?.trim()) return setNewProj(null);
    const colors = Object.keys(SWATCHES);
    const p = await addProject({ name: newProj.trim(), color: colors[(projects.length + 2) % colors.length] });
    if (p) setValue("projectId", p.id);
    setNewProj(null);
  };

  return (
    <Dialog open={open} onOpenChange={(v) => !v && close()}>
      <DialogContent title={task ? "Edit task" : "New task"} description={task ? undefined : "What would you like to get done?"} className="sm:max-w-xl">
        <form onSubmit={onSubmit} className="space-y-4" noValidate>
          <Field label="Task" htmlFor="t-title" error={formState.errors.title?.message}>
            <Input id="t-title" placeholder="e.g. Learn React hooks" autoFocus aria-invalid={!!formState.errors.title} {...register("title")} />
          </Field>

          <Field label="Description" htmlFor="t-desc">
            <Textarea id="t-desc" rows={2} placeholder="Add a few details…" {...register("description")} />
          </Field>

          <div>
            <span className="mb-1.5 block text-xs font-semibold text-muted">Priority</span>
            <Segmented
              label="Priority"
              value={priority ?? "MEDIUM"}
              onChange={(p) => setValue("priority", p)}
              options={(Object.keys(PRIORITY_META) as Priority[]).map((p) => ({
                value: p,
                label: (
                  <span className="flex items-center gap-1.5">
                    <span className="size-2 rounded-full" style={{ background: swatch(PRIORITY_META[p].color).fg }} />
                    {PRIORITY_META[p].label}
                  </span>
                ),
              }))}
              className="flex w-full flex-wrap [&>button]:flex-1"
            />
          </div>

          <div className="grid grid-cols-2 gap-3 sm:grid-cols-3">
            <Field label="Due date" htmlFor="t-date">
              <Input id="t-date" type="date" {...register("dueDate")} />
            </Field>
            <Field label="Due time" htmlFor="t-time">
              <Input id="t-time" type="time" {...register("dueTime")} />
            </Field>
            <Field label="Estimate (min)" htmlFor="t-est" error={formState.errors.estimatedDuration?.message} className="col-span-2 sm:col-span-1">
              <Input id="t-est" inputMode="numeric" placeholder="25" {...register("estimatedDuration")} />
            </Field>
          </div>

          <div className="grid gap-3 sm:grid-cols-2">
            <Field label="Category" htmlFor="t-cat">
              {newCat !== null ? (
                <div className="flex gap-2">
                  <Input
                    value={newCat}
                    onChange={(e) => setNewCat(e.target.value)}
                    placeholder="New category"
                    autoFocus
                    onKeyDown={(e) => {
                      if (e.key === "Enter") {
                        e.preventDefault();
                        void createCategory();
                      }
                      if (e.key === "Escape") {
                        e.stopPropagation();
                        setNewCat(null);
                      }
                    }}
                  />
                  <Button size="icon" variant="soft" onClick={createCategory} aria-label="Create category">
                    <Plus />
                  </Button>
                </div>
              ) : (
                <Select
                  id="t-cat"
                  {...register("categoryId")}
                  onChange={(e) => (e.target.value === "__new" ? setNewCat("") : setValue("categoryId", e.target.value))}
                >
                  <option value="">No category</option>
                  {categories.map((c) => (
                    <option key={c.id} value={c.id}>
                      {c.name}
                    </option>
                  ))}
                  <option value="__new">+ New category…</option>
                </Select>
              )}
            </Field>
            <Field label="Project" htmlFor="t-proj">
              {newProj !== null ? (
                <div className="flex gap-2">
                  <Input
                    value={newProj}
                    onChange={(e) => setNewProj(e.target.value)}
                    placeholder="New project"
                    autoFocus
                    onKeyDown={(e) => {
                      if (e.key === "Enter") {
                        e.preventDefault();
                        void createProject();
                      }
                      if (e.key === "Escape") {
                        e.stopPropagation();
                        setNewProj(null);
                      }
                    }}
                  />
                  <Button size="icon" variant="soft" onClick={createProject} aria-label="Create project">
                    <Plus />
                  </Button>
                </div>
              ) : (
                <Select
                  id="t-proj"
                  {...register("projectId")}
                  onChange={(e) => (e.target.value === "__new" ? setNewProj("") : setValue("projectId", e.target.value))}
                >
                  <option value="">No project</option>
                  {projects.map((p) => (
                    <option key={p.id} value={p.id}>
                      {p.name}
                    </option>
                  ))}
                  <option value="__new">+ New project…</option>
                </Select>
              )}
            </Field>
          </div>

          {/* Subtasks */}
          <div>
            <span className="mb-1.5 block text-xs font-semibold text-muted">Subtasks</span>
            <ul className="space-y-1.5">
              {subtasks.map((s) => (
                <li key={s.key} className="flex items-center gap-2 rounded-xl bg-bg-2/60 px-3 py-1.5">
                  <input
                    type="checkbox"
                    checked={s.completed}
                    onChange={(e) => setSubtasks((all) => all.map((x) => (x.key === s.key ? { ...x, completed: e.target.checked } : x)))}
                    className="size-4 accent-[var(--accent-strong)]"
                    aria-label={`Mark "${s.title}" complete`}
                  />
                  <input
                    value={s.title}
                    onChange={(e) => setSubtasks((all) => all.map((x) => (x.key === s.key ? { ...x, title: e.target.value } : x)))}
                    className={cn("flex-1 bg-transparent text-sm outline-none", s.completed && "text-muted line-through")}
                    aria-label="Subtask title"
                  />
                  <button
                    type="button"
                    onClick={() => setSubtasks((all) => all.filter((x) => x.key !== s.key))}
                    className="rounded-lg p-1 text-muted hover:text-ink"
                    aria-label={`Remove "${s.title}"`}
                  >
                    <Trash2 className="size-3.5" />
                  </button>
                </li>
              ))}
            </ul>
            <div className="mt-2 flex gap-2">
              <Input
                value={subDraft}
                onChange={(e) => setSubDraft(e.target.value)}
                placeholder="Add a step…"
                onKeyDown={(e) => {
                  if (e.key === "Enter") {
                    e.preventDefault();
                    addSub();
                  }
                }}
                aria-label="New subtask"
              />
              <Button variant="soft" size="icon" onClick={addSub} aria-label="Add subtask">
                <Plus />
              </Button>
            </div>
          </div>

          {/* Tags */}
          <div>
            <span className="mb-1.5 block text-xs font-semibold text-muted">Tags</span>
            <div className="flex flex-wrap items-center gap-1.5 rounded-xl border border-line bg-card px-2 py-1.5 focus-within:ring-4 focus-within:ring-accent/25">
              {tags.map((t) => (
                <span key={t} className="inline-flex items-center gap-1 rounded-full bg-accent-soft px-2 py-0.5 text-xs font-semibold text-accent-strong">
                  #{t}
                  <button type="button" onClick={() => setTags(tags.filter((x) => x !== t))} aria-label={`Remove tag ${t}`}>
                    <X className="size-3" />
                  </button>
                </span>
              ))}
              <input
                value={tagDraft}
                onChange={(e) => setTagDraft(e.target.value)}
                onKeyDown={(e) => {
                  if (e.key === "Enter" || e.key === ",") {
                    e.preventDefault();
                    addTag();
                  }
                  if (e.key === "Backspace" && !tagDraft && tags.length) setTags(tags.slice(0, -1));
                }}
                onBlur={addTag}
                placeholder={tags.length ? "" : "Type and press Enter"}
                className="min-w-24 flex-1 bg-transparent py-1 text-sm outline-none"
                aria-label="Add tag"
              />
            </div>
          </div>

          <Field label="Notes" htmlFor="t-notes">
            <Textarea id="t-notes" rows={2} placeholder="Links, thoughts, reminders…" {...register("notes")} />
          </Field>

          <div className="flex justify-end gap-2 pt-1">
            <Button variant="ghost" onClick={close}>
              Cancel
            </Button>
            <Button type="submit" disabled={formState.isSubmitting}>
              {formState.isSubmitting ? "Saving…" : task ? "Save changes" : "Add task"}
            </Button>
          </div>
        </form>
      </DialogContent>
    </Dialog>
  );
}
