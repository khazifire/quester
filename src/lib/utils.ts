import { clsx, type ClassValue } from "clsx";
import { twMerge } from "tailwind-merge";

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}

export function formatCurrency(value: number, symbol = "$"): string {
  return `${symbol}${value.toLocaleString("en-US", { minimumFractionDigits: 0, maximumFractionDigits: 0 })}`;
}

export function maskCurrency(value: number, show: boolean, symbol = "$"): string {
  if (show) return formatCurrency(value, symbol);
  const masked = value.toLocaleString("en-US").replace(/\d/g, "\u2022");
  return `${symbol}${masked}`;
}

export function formatDate(dateStr: string): string {
  const d = new Date(dateStr);
  return d.toLocaleDateString("en-US", { month: "short", day: "numeric" });
}

export function getToday(): string {
  return new Date().toISOString().split("T")[0];
}

export function getMonthKey(date?: Date): string {
  const d = date || new Date();
  return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, "0")}`;
}

export function daysInMonth(year: number, month: number): number {
  return new Date(year, month, 0).getDate();
}

export function getWeekStart(date: Date): Date {
  const d = new Date(date);
  const day = d.getDay();
  const diff = d.getDate() - day + (day === 0 ? -6 : 1);
  d.setDate(diff);
  d.setHours(0, 0, 0, 0);
  return d;
}

export function isSameDay(a: string, b: string): boolean {
  return a === b;
}

export function addDays(dateStr: string, days: number): string {
  const d = new Date(dateStr);
  d.setDate(d.getDate() + days);
  return d.toISOString().split("T")[0];
}

export function parseTime(isoStr: string): { hour: number; minute: number } {
  const d = new Date(isoStr);
  return { hour: d.getHours(), minute: d.getMinutes() };
}

export function formatTime(isoStr: string): string {
  const d = new Date(isoStr);
  return d.toLocaleTimeString("en-US", { hour: "numeric", minute: "2-digit" });
}
