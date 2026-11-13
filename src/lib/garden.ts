/** Focus Garden catalog + points rules. Shared by client (display) and server (verification). */

export const POINTS = {
  perFocusMinute: 1, // a completed 25-minute session = 25 points
  perTask: 5,
  perHabit: 5,
} as const;

export type GardenItemType = "plant" | "flower" | "tree" | "decor" | "pot";

export interface GardenItem {
  key: string;
  name: string;
  type: GardenItemType;
  cost: number;
  emoji: string;
  description: string;
}

export const GARDEN_CATALOG: GardenItem[] = [
  { key: "sprout", name: "Little Sprout", type: "plant", cost: 0, emoji: "🌱", description: "Every garden starts here." },
  { key: "tulip", name: "Tulip", type: "flower", cost: 25, emoji: "🌷", description: "Your first focus bloom." },
  { key: "daisy", name: "Daisy", type: "flower", cost: 40, emoji: "🌼", description: "Simple and cheerful." },
  { key: "herb", name: "Herb Pot", type: "pot", cost: 50, emoji: "🪴", description: "A cosy windowsill friend." },
  { key: "sunflower", name: "Sunflower", type: "flower", cost: 75, emoji: "🌻", description: "Always facing the light." },
  { key: "mushroom", name: "Mushroom", type: "decor", cost: 90, emoji: "🍄", description: "A tiny forest guest." },
  { key: "rose", name: "Rose", type: "flower", cost: 120, emoji: "🌹", description: "For your deeper sessions." },
  { key: "cactus", name: "Cactus", type: "plant", cost: 150, emoji: "🌵", description: "Resilient, like you." },
  { key: "hibiscus", name: "Hibiscus", type: "flower", cost: 200, emoji: "🌺", description: "Warm summer colour." },
  { key: "pine", name: "Pine Tree", type: "tree", cost: 300, emoji: "🌲", description: "Steady and evergreen." },
  { key: "rock", name: "Moss Stone", type: "decor", cost: 350, emoji: "🪨", description: "A quiet resting place." },
  { key: "sakura", name: "Cherry Blossom", type: "tree", cost: 500, emoji: "🌸", description: "A reward for consistency." },
  { key: "oak", name: "Old Oak", type: "tree", cost: 750, emoji: "🌳", description: "Grown from many small steps." },
  { key: "butterfly", name: "Butterfly", type: "decor", cost: 900, emoji: "🦋", description: "Visits thriving gardens." },
  { key: "palm", name: "Palm Tree", type: "tree", cost: 1200, emoji: "🌴", description: "Your own little getaway." },
];

export const catalogByKey = new Map(GARDEN_CATALOG.map((i) => [i.key, i]));

export function earnedPoints(input: { focusSeconds: number; tasksDone: number; habitCompletions: number }) {
  return (
    Math.floor(input.focusSeconds / 60) * POINTS.perFocusMinute +
    input.tasksDone * POINTS.perTask +
    input.habitCompletions * POINTS.perHabit
  );
}

export function spentPoints(unlockedKeys: string[]) {
  return unlockedKeys.reduce((sum, k) => sum + (catalogByKey.get(k)?.cost ?? 0), 0);
}
