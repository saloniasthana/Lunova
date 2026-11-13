import type { Metadata } from "next";
import { TasksPage } from "@/components/tasks/tasks-page";

// Client-rendered workspace (data loads after hydration), so skip instant-navigation validation.
export const instant = false;

export const metadata: Metadata = { title: "My Tasks" };

export default function Page() {
  return <TasksPage />;
}
