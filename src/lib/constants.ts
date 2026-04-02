import type { ExpenseCategory } from "./types";

export const PROJECT_STATUSES = [
  "proposal",
  "active",
  "delivered",
  "invoiced",
  "completed",
  "paused",
] as const;

export const ISSUE_STATUSES = ["todo", "in-progress", "done"] as const;

export const ISSUE_PRIORITIES = ["low", "medium", "high"] as const;

export const INVOICE_STATUSES = ["draft", "sent", "paid", "overdue"] as const;

export const EVENT_TYPES = ["meeting", "focus", "personal"] as const;

export const RUN_COST_TYPES = [
  "travel",
  "accommodation",
  "food",
  "gear",
  "entry",
  "other",
] as const;

export const RUN_COST_LABELS: Record<string, string> = {
  travel: "Travel",
  accommodation: "Accommodation",
  food: "Food",
  gear: "Gear",
  entry: "Entry Fee",
  other: "Other",
};

export const STANDARD_DISTANCES = [
  { label: "5K", km: 5, tolerance: 0.3 },
  { label: "10K", km: 10, tolerance: 0.5 },
  { label: "Half Marathon", km: 21.1, tolerance: 0.5 },
  { label: "Marathon", km: 42.195, tolerance: 1 },
] as const;

export const HABIT_CATEGORIES = [
  "system",
  "finance",
  "health",
  "growth",
  "work",
] as const;

export const DEFAULT_CATEGORIES: ExpenseCategory[] = [
  { id: "cat-food", name: "Food", color: "#7ab87a" },
  { id: "cat-entertainment", name: "Entertainment", color: "#a38cc4" },
  { id: "cat-transport", name: "Transport", color: "#c4a86a" },
  { id: "cat-business", name: "Business", color: "#6a9ec4" },
  { id: "cat-health", name: "Health", color: "#c47a7a" },
  { id: "cat-bills", name: "Bills", color: "#8a9ec4" },
  { id: "cat-subscriptions", name: "Subscriptions", color: "#c47a8a" },
  { id: "cat-personal", name: "Personal", color: "#8ac4a8" },
  { id: "cat-running", name: "Running", color: "#c49a6a" },
];

export const CATEGORY_COLOR_MAP: Record<string, string> = {
  Food: "#7ab87a",
  Entertainment: "#a38cc4",
  Transport: "#c4a86a",
  Business: "#6a9ec4",
  Health: "#c47a7a",
  Bills: "#8a9ec4",
  Subscriptions: "#c47a8a",
  Personal: "#8ac4a8",
};

export const PRIORITY_COLORS: Record<string, string> = {
  high: "hsl(5 48% 62%)",
  medium: "hsl(42 52% 62%)",
  low: "hsl(120 24% 60%)",
};

export const STATUS_COLORS: Record<string, string> = {
  todo: "hsl(90 10% 33%)",
  "in-progress": "hsl(42 52% 62%)",
  done: "hsl(120 24% 60%)",
  open: "hsl(5 48% 62%)",
  active: "hsl(120 24% 60%)",
  completed: "#666",
  proposal: "hsl(207 38% 59%)",
  delivered: "hsl(100 26% 65%)",
  invoiced: "hsl(42 52% 62%)",
  paused: "hsl(90 10% 33%)",
};

export const EVENT_COLORS: Record<string, string> = {
  meeting: "hsl(100 18% 56%)",
  focus: "hsl(207 38% 59%)",
  personal: "#a38cc4",
};
