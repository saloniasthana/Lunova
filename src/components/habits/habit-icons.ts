import { BookOpen, Brain, Coffee, Droplet, Dumbbell, Heart, Leaf, Moon, Music, PenLine, Sparkles, Sun, type LucideIcon } from "lucide-react";

export const HABIT_ICONS: Record<string, LucideIcon> = {
  sparkles: Sparkles,
  "book-open": BookOpen,
  dumbbell: Dumbbell,
  droplet: Droplet,
  "pen-line": PenLine,
  moon: Moon,
  heart: Heart,
  leaf: Leaf,
  music: Music,
  coffee: Coffee,
  brain: Brain,
  sun: Sun,
};

export const HABIT_COLORS = ["#A8C7E8", "#DCCBF3", "#F4D5DE", "#B9DBB6", "#F8D1B5", "#F4D6A0"];

export const STARTER_HABITS = [
  { name: "Study", icon: "brain", color: "#A8C7E8", target: 5, frequency: "weekdays" as const },
  { name: "Read", icon: "book-open", color: "#DCCBF3", target: 7, frequency: "daily" as const },
  { name: "Exercise", icon: "dumbbell", color: "#F8D1B5", target: 3, frequency: "daily" as const },
  { name: "Drink water", icon: "droplet", color: "#A8C7E8", target: 7, frequency: "daily" as const },
  { name: "Journal", icon: "pen-line", color: "#F4D5DE", target: 7, frequency: "daily" as const },
  { name: "Sleep on time", icon: "moon", color: "#B9DBB6", target: 7, frequency: "daily" as const },
];
