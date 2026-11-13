"use client";

import * as React from "react";
import { DndContext, KeyboardSensor, PointerSensor, closestCenter, useSensor, useSensors, type DragEndEvent } from "@dnd-kit/core";
import { SortableContext, arrayMove, sortableKeyboardCoordinates, useSortable, verticalListSortingStrategy } from "@dnd-kit/sortable";
import { CSS } from "@dnd-kit/utilities";
import { AlarmClock, CalendarClock, CheckCircle2, Flag, GripVertical, Inbox, ListFilter, Plus, Search, Sun, Tag, Trash2, X } from "lucide-react";
import { useData } from "@/stores/data-store";
import { useUi } from "@/stores/ui-store";
import { PageContainer, PageHeader } from "@/components/layout/page-header";
import { Button } from "@/components/ui/button";
import { Card, Switch } from "@/components/ui/misc";
import { Input, Select } from "@/components/ui/input";
import { Dialog, DialogContent } from "@/components/ui/dialog";
import { ConfirmDialog, EmptyState } from "@/components/ui/states";
import { TaskRow } from "./task-row";
import { QuickAdd } from "./quick-add";
import type { Priority, Task } from "@/types";
import { filterByView, sortTasks, type TaskSort, type TaskView } from "@/lib/selectors";
import { PRIORITY_META, SWATCHES, cn, swatch } from "@/lib/utils";
import { addDays, todayKey } from "@/lib/dates";

const EMPTY: never[] = [];

const VIEWS: { id: TaskView; label: string; icon: React.ElementType; empty: [string, string] }[] = [
  { id: "all", label: "All tasks", icon: Inbox, empty: ["Your day is a blank canvas.", "Add your first task and start creating your day."] },
  { id: "today", label: "Today", icon: Sun, empty: ["Nothing planned for today.", "Enjoy the calm, or add something small."] },
  { id: "upcoming", label: "Upcoming", icon: CalendarClock, empty: ["No upcoming tasks.", "Future you is free — for now."] },
  { id: "overdue", label: "Overdue", icon: AlarmClock, empty: ["Nothing overdue.", "You're all caught up. Lovely."] },
  { id: "priority", label: "Priority", icon: Flag, empty: ["No high-priority tasks.", "Nothing urgent is waiting on you."] },
  { id: "completed", label: "Completed", icon: CheckCircle2, empty: ["No completed tasks yet.", "Finished tasks will gather here."] },
];

type DueFilter = "any" | "today" | "week" | "none" | "overdue";

function SortableRow({ task }: { task: Task }) {
  const { attributes, listeners, setNodeRef, transform, transition, isDragging } = useSortable({ id: task.id });
  return (
    <div ref={setNodeRef} style={{ transform: CSS.Transform.toString(transform), transition }} className={cn(isDragging && "relative z-10 opacity-80")}>
      <TaskRow
        task={task}
        dragHandle={
          <button
            className="mt-0.5 -ml-1 cursor-grab touch-none rounded-lg p-0.5 text-muted/50 opacity-100 hover:text-muted active:cursor-grabbing sm:opacity-0 sm:group-hover:opacity-100 sm:focus:opacity-100"
            aria-label={`Reorder “${task.title}”`}
            {...attributes}
            {...listeners}
          >
            <GripVertical className="size-4" />
          </button>
        }
      />
    </div>
  );
}

function CategoryManager({ open, onOpenChange }: { open: boolean; onOpenChange: (v: boolean) => void }) {
  const categories = useData((s) => s.categories) ?? EMPTY;
  const tasks = useData((s) => s.tasks) ?? EMPTY;
  const addCategory = useData((s) => s.addCategory);
  const deleteCategory = useData((s) => s.deleteCategory);
  const [name, setName] = React.useState("");
  const [color, setColor] = React.useState("blue");
  const [toDelete, setToDelete] = React.useState<string | null>(null);

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent title="Categories" description="Organise tasks your way." className="sm:max-w-md">
        <form
          className="mb-4 flex gap-2"
          onSubmit={async (e) => {
            e.preventDefault();
            if (!name.trim()) return;
            if (await addCategory({ name: name.trim(), color })) setName("");
          }}
        >
          <Input value={name} onChange={(e) => setName(e.target.value)} placeholder="New category name" aria-label="New category name" maxLength={40} />
          <Button type="submit" size="icon" aria-label="Add category">
            <Plus />
          </Button>
        </form>
        <div className="mb-5 flex flex-wrap gap-2" role="radiogroup" aria-label="Category colour">
          {Object.entries(SWATCHES).map(([k, v]) => (
            <button
              key={k}
              type="button"
              role="radio"
              aria-checked={color === k}
              aria-label={v.label}
              onClick={() => setColor(k)}
              className={cn("size-7 rounded-full border-2 transition-transform", color === k ? "scale-110 border-ink/40" : "border-transparent")}
              style={{ background: v.dot }}
            />
          ))}
        </div>
        <ul className="space-y-1">
          {categories.map((c) => (
            <li key={c.id} className="flex items-center gap-3 rounded-xl px-2 py-2 hover:bg-bg-2/60">
              <span className="size-3 rounded-full" style={{ background: swatch(c.color).dot }} />
              <span className="flex-1 text-sm font-semibold">{c.name}</span>
              <span className="text-xs text-muted">{tasks.filter((t) => t.categoryId === c.id).length} tasks</span>
              <button onClick={() => setToDelete(c.id)} className="rounded-lg p-1.5 text-muted hover:bg-danger/20 hover:text-[#a14a4a]" aria-label={`Delete ${c.name}`}>
                <Trash2 className="size-3.5" />
              </button>
            </li>
          ))}
        </ul>
        <ConfirmDialog
          open={!!toDelete}
          onOpenChange={(v) => !v && setToDelete(null)}
          title="Delete this category?"
          description="Tasks in it will stay, just without a category."
          onConfirm={() => deleteCategory(toDelete!)}
        />
      </DialogContent>
    </Dialog>
  );
}

export function TasksPage() {
  const tasks = useData((s) => s.tasks) ?? EMPTY;
  const categories = useData((s) => s.categories) ?? EMPTY;
  const projects = useData((s) => s.projects) ?? EMPTY;
  const reorderTasks = useData((s) => s.reorderTasks);
  const openNewTask = useUi((s) => s.openNewTask);

  const [view, setView] = React.useState<TaskView>("all");
  const [query, setQuery] = React.useState("");
  const [sort, setSort] = React.useState<TaskSort>("smart");
  const [priority, setPriority] = React.useState<Priority | "">("");
  const [category, setCategory] = React.useState("");
  const [project, setProject] = React.useState("");
  const [status, setStatus] = React.useState<"" | "TODO" | "DONE">("");
  const [due, setDue] = React.useState<DueFilter>("any");
  const [hideCompleted, setHideCompleted] = React.useState(false);
  const [showFilters, setShowFilters] = React.useState(false);
  const [catOpen, setCatOpen] = React.useState(false);

  const sensors = useSensors(useSensor(PointerSensor, { activationConstraint: { distance: 6 } }), useSensor(KeyboardSensor, { coordinateGetter: sortableKeyboardCoordinates }));

  const today = todayKey();
  const counts = React.useMemo(() => Object.fromEntries(VIEWS.map((v) => [v.id, filterByView(tasks, v.id, today).filter((t) => v.id === "completed" || t.status !== "DONE").length])), [tasks, today]);

  const activeFilters = [priority, category, project, status, due !== "any" ? due : ""].filter(Boolean).length;

  const list = React.useMemo(() => {
    let l = filterByView(tasks, view, today);
    const q = query.trim().toLowerCase();
    if (q) l = l.filter((t) => [t.title, t.description, t.notes, ...t.tags].some((f) => f?.toLowerCase().includes(q)));
    if (priority) l = l.filter((t) => t.priority === priority);
    if (category) l = l.filter((t) => (category === "none" ? !t.categoryId : t.categoryId === category));
    if (project) l = l.filter((t) => (project === "none" ? !t.projectId : t.projectId === project));
    if (status) l = l.filter((t) => t.status === status);
    if (due === "today") l = l.filter((t) => t.dueDate === today);
    if (due === "week") l = l.filter((t) => t.dueDate && t.dueDate >= today && t.dueDate <= addDays(today, 7));
    if (due === "none") l = l.filter((t) => !t.dueDate);
    if (due === "overdue") l = l.filter((t) => t.dueDate && t.dueDate < today && t.status !== "DONE");
    if (hideCompleted && view !== "completed") l = l.filter((t) => t.status !== "DONE");
    return sortTasks(l, sort);
  }, [tasks, view, query, priority, category, project, status, due, hideCompleted, sort, today]);

  const draggable = sort === "smart" && !query && !activeFilters && view !== "completed";
  const current = VIEWS.find((v) => v.id === view)!;

  const onDragEnd = (e: DragEndEvent) => {
    const { active, over } = e;
    if (!over || active.id === over.id) return;
    const open = list.filter((t) => t.status !== "DONE");
    const from = open.findIndex((t) => t.id === active.id);
    const to = open.findIndex((t) => t.id === over.id);
    if (from < 0 || to < 0) return;
    void reorderTasks(arrayMove(open, from, to).map((t) => t.id));
  };

  const clearFilters = () => {
    setPriority("");
    setCategory("");
    setProject("");
    setStatus("");
    setDue("any");
  };

  return (
    <PageContainer>
      <PageHeader
        title="My Tasks"
        subtitle="Everything you want to get done, in one calm place."
        actions={
          <>
            <Button variant="outline" onClick={() => setCatOpen(true)}>
              <Tag /> Categories
            </Button>
            <Button onClick={() => openNewTask(view === "today" ? { dueDate: today } : {})}>
              <Plus /> Add task
            </Button>
          </>
        }
      />

      <div className="grid gap-6 lg:grid-cols-[220px_1fr]">
        {/* Views */}
        <nav aria-label="Task views" className="-mx-4 flex gap-1.5 overflow-x-auto px-4 pb-1 lg:mx-0 lg:flex-col lg:overflow-visible lg:px-0">
          {VIEWS.map((v) => {
            const Icon = v.icon;
            return (
              <button
                key={v.id}
                onClick={() => setView(v.id)}
                aria-current={view === v.id ? "true" : undefined}
                className={cn(
                  "flex shrink-0 items-center gap-2.5 rounded-2xl px-3.5 py-2.5 text-sm font-semibold transition-colors",
                  view === v.id ? "bg-card text-ink shadow-[var(--shadow-soft)]" : "text-muted hover:bg-card/60 hover:text-ink",
                )}
              >
                <Icon className={cn("size-4", view === v.id && "text-accent-strong", v.id === "overdue" && counts.overdue > 0 && "text-[#c06060]")} />
                <span className="flex-1 text-left">{v.label}</span>
                {counts[v.id] > 0 && <span className="rounded-full bg-bg-2 px-2 py-0.5 text-[11px] font-bold tabular-nums text-muted">{counts[v.id]}</span>}
              </button>
            );
          })}
        </nav>

        <div className="min-w-0">
          {/* Toolbar */}
          <div className="mb-4 flex flex-wrap items-center gap-2">
            <div className="relative min-w-48 flex-1">
              <Search className="pointer-events-none absolute left-3.5 top-1/2 size-4 -translate-y-1/2 text-muted" aria-hidden />
              <Input value={query} onChange={(e) => setQuery(e.target.value)} placeholder="Search tasks, notes, tags…" className="pl-10" aria-label="Search tasks" />
              {query && (
                <button onClick={() => setQuery("")} className="absolute right-2 top-1/2 -translate-y-1/2 rounded-lg p-1 text-muted hover:text-ink" aria-label="Clear search">
                  <X className="size-4" />
                </button>
              )}
            </div>
            <Select value={sort} onChange={(e) => setSort(e.target.value as TaskSort)} aria-label="Sort tasks" className="w-auto">
              <option value="smart">My order</option>
              <option value="due">Due date</option>
              <option value="priority">Priority</option>
              <option value="created">Recently added</option>
              <option value="alpha">A → Z</option>
            </Select>
            <Button variant={showFilters || activeFilters ? "soft" : "outline"} onClick={() => setShowFilters((s) => !s)} aria-expanded={showFilters}>
              <ListFilter /> Filters{activeFilters ? ` · ${activeFilters}` : ""}
            </Button>
          </div>

          {showFilters && (
            <Card className="mb-4 grid gap-3 p-4 sm:grid-cols-2 sm:p-4 xl:grid-cols-5">
              <Select value={status} onChange={(e) => setStatus(e.target.value as typeof status)} aria-label="Filter by status">
                <option value="">Any status</option>
                <option value="TODO">To do</option>
                <option value="DONE">Done</option>
              </Select>
              <Select value={priority} onChange={(e) => setPriority(e.target.value as Priority | "")} aria-label="Filter by priority">
                <option value="">Any priority</option>
                {(Object.keys(PRIORITY_META) as Priority[]).map((p) => (
                  <option key={p} value={p}>
                    {PRIORITY_META[p].label}
                  </option>
                ))}
              </Select>
              <Select value={category} onChange={(e) => setCategory(e.target.value)} aria-label="Filter by category">
                <option value="">Any category</option>
                <option value="none">No category</option>
                {categories.map((c) => (
                  <option key={c.id} value={c.id}>
                    {c.name}
                  </option>
                ))}
              </Select>
              <Select value={project} onChange={(e) => setProject(e.target.value)} aria-label="Filter by project">
                <option value="">Any project</option>
                <option value="none">No project</option>
                {projects.map((p) => (
                  <option key={p.id} value={p.id}>
                    {p.name}
                  </option>
                ))}
              </Select>
              <Select value={due} onChange={(e) => setDue(e.target.value as DueFilter)} aria-label="Filter by due date">
                <option value="any">Any due date</option>
                <option value="today">Due today</option>
                <option value="week">Next 7 days</option>
                <option value="overdue">Overdue</option>
                <option value="none">No due date</option>
              </Select>
              {activeFilters > 0 && (
                <Button variant="link" size="sm" onClick={clearFilters} className="justify-start sm:col-span-2 xl:col-span-5">
                  Clear all filters
                </Button>
              )}
            </Card>
          )}

          <Card className="p-3 sm:p-4">
            <div className="mb-2 flex items-center justify-between gap-3 px-2">
              <h2 className="font-display text-base font-bold">
                {current.label} <span className="ml-1 text-sm font-semibold text-muted">{list.length}</span>
              </h2>
              {view !== "completed" && (
                <label className="flex items-center gap-2 text-xs font-semibold text-muted">
                  Hide completed
                  <Switch checked={hideCompleted} onCheckedChange={setHideCompleted} label="Hide completed tasks" />
                </label>
              )}
            </div>
            {view !== "completed" && (
              <QuickAdd
                className="mb-2 px-1"
                defaultDate={view === "today" ? today : view === "upcoming" ? addDays(today, 1) : view === "all" ? null : undefined}
                placeholder={view === "today" ? "Add a task for today…" : undefined}
              />
            )}

            {list.length === 0 ? (
              <EmptyState
                title={query || activeFilters ? "No tasks match." : current.empty[0]}
                description={query || activeFilters ? "Try a different search or clear your filters." : current.empty[1]}
                action={
                  query || activeFilters ? (
                    <Button variant="soft" onClick={() => (setQuery(""), clearFilters())}>
                      Clear search & filters
                    </Button>
                  ) : view !== "completed" ? (
                    <Button onClick={() => openNewTask()}>
                      <Plus /> Add a task
                    </Button>
                  ) : undefined
                }
              />
            ) : draggable ? (
              <DndContext sensors={sensors} collisionDetection={closestCenter} onDragEnd={onDragEnd}>
                <SortableContext items={list.filter((t) => t.status !== "DONE").map((t) => t.id)} strategy={verticalListSortingStrategy}>
                  {list.map((t) => (t.status !== "DONE" ? <SortableRow key={t.id} task={t} /> : <TaskRow key={t.id} task={t} />))}
                </SortableContext>
              </DndContext>
            ) : (
              list.map((t) => <TaskRow key={t.id} task={t} />)
            )}
          </Card>
          <p className="mt-3 text-center text-xs text-muted">
            Tip: press <kbd className="rounded border border-line bg-card px-1.5 font-sans">N</kbd> anywhere to add a task.
          </p>
        </div>
      </div>
      <CategoryManager open={catOpen} onOpenChange={setCatOpen} />
    </PageContainer>
  );
}
