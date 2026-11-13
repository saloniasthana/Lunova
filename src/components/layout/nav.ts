import {
  BarChart3,
  CalendarDays,
  CalendarRange,
  CheckSquare,
  Flower2,
  Headphones,
  Home,
  Palette,
  Repeat,
  Settings,
  Timer,
  type LucideIcon,
} from "lucide-react";

export interface NavItem {
  href: string;
  label: string;
  icon: LucideIcon;
}

export const MAIN_NAV: NavItem[] = [
  { href: "/dashboard", label: "Home", icon: Home },
  { href: "/tasks", label: "My Tasks", icon: CheckSquare },
  { href: "/planner", label: "Planner", icon: CalendarRange },
  { href: "/focus", label: "Focus Studio", icon: Timer },
  { href: "/music", label: "Music & Sounds", icon: Headphones },
  { href: "/habits", label: "Habits", icon: Repeat },
  { href: "/calendar", label: "Calendar", icon: CalendarDays },
  { href: "/progress", label: "My Progress", icon: BarChart3 },
  { href: "/garden", label: "Focus Garden", icon: Flower2 },
];

export const BOTTOM_NAV: NavItem[] = [
  { href: "/workspace", label: "Customize", icon: Palette },
  { href: "/settings", label: "Settings", icon: Settings },
];

export const MOBILE_PRIMARY = ["/dashboard", "/tasks", "/focus", "/habits"];
