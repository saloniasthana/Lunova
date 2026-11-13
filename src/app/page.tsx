import { redirect } from "next/navigation";

// This page only redirects, so there's nothing to validate for instant navigation.
export const instant = false;

// The proxy sends signed-out visitors to /login, so the root can always point at the dashboard.
export default function Home() {
  redirect("/dashboard");
}
