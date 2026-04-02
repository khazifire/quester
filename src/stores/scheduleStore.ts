import { create } from "zustand";
import { persist } from "zustand/middleware";
import { nanoid } from "nanoid";
import type { CalendarEvent } from "@/lib/types";
import { useProjectStore } from "./projectStore";

interface ScheduleState {
  events: CalendarEvent[];

  addEvent: (event: Omit<CalendarEvent, "id" | "createdAt">) => string;
  updateEvent: (id: string, partial: Partial<CalendarEvent>) => void;
  deleteEvent: (id: string) => void;

  getEventsByDate: (dateStr: string) => CalendarEvent[];
  getWeekEvents: (weekStartDate: string) => CalendarEvent[];
  getMonthEvents: (monthKey: string) => CalendarEvent[];
  getMeetingMinutes: (startDate: string, endDate: string) => number;
  getFocusMinutes: (startDate: string, endDate: string) => number;
  getClientTimeAllocation: (
    startDate: string,
    endDate: string
  ) => { clientName: string; minutes: number }[];
  getMeetingFreeDays: (startDate: string, endDate: string) => number;
}

function getDateFromISO(iso: string): string {
  return iso.split("T")[0];
}

function isDateInRange(dateStr: string, start: string, end: string): boolean {
  return dateStr >= start && dateStr <= end;
}

export const useScheduleStore = create<ScheduleState>()(
  persist(
    (set, get) => ({
      events: [],

      addEvent: (event) => {
        const id = nanoid();
        set((s) => ({
          events: [...s.events, { ...event, id, createdAt: Date.now() }],
        }));
        return id;
      },
      updateEvent: (id, partial) =>
        set((s) => ({
          events: s.events.map((e) => (e.id === id ? { ...e, ...partial } : e)),
        })),
      deleteEvent: (id) =>
        set((s) => ({ events: s.events.filter((e) => e.id !== id) })),

      getEventsByDate: (dateStr) =>
        get()
          .events.filter((e) => getDateFromISO(e.startTime) === dateStr)
          .sort((a, b) => a.startTime.localeCompare(b.startTime)),
      getWeekEvents: (weekStartDate) => {
        const start = new Date(weekStartDate);
        const end = new Date(start);
        end.setDate(end.getDate() + 6);
        const endStr = end.toISOString().split("T")[0];
        return get().events.filter((e) =>
          isDateInRange(getDateFromISO(e.startTime), weekStartDate, endStr)
        );
      },
      getMonthEvents: (monthKey) =>
        get().events.filter((e) => getDateFromISO(e.startTime).startsWith(monthKey)),
      getMeetingMinutes: (startDate, endDate) =>
        get()
          .events.filter(
            (e) =>
              e.type === "meeting" &&
              isDateInRange(getDateFromISO(e.startTime), startDate, endDate)
          )
          .reduce((sum, e) => sum + e.duration, 0),
      getFocusMinutes: (startDate, endDate) =>
        get()
          .events.filter(
            (e) =>
              e.type === "focus" &&
              isDateInRange(getDateFromISO(e.startTime), startDate, endDate)
          )
          .reduce((sum, e) => sum + e.duration, 0),
      getClientTimeAllocation: (startDate, endDate) => {
        const events = get().events.filter(
          (e) =>
            e.clientId &&
            isDateInRange(getDateFromISO(e.startTime), startDate, endDate)
        );
        const map = new Map<string, number>();
        const clientNames = new Map<string, string>();
        events.forEach((e) => {
          if (!e.clientId) return;
          map.set(e.clientId, (map.get(e.clientId) || 0) + e.duration);
          if (!clientNames.has(e.clientId)) {
            const client = useProjectStore.getState().getClientById(e.clientId);
            clientNames.set(e.clientId, client?.name || "Unknown");
          }
        });
        return Array.from(map.entries())
          .map(([clientId, minutes]) => ({
            clientName: clientNames.get(clientId) || "Unknown",
            minutes,
          }))
          .sort((a, b) => b.minutes - a.minutes);
      },
      getMeetingFreeDays: (startDate, endDate) => {
        const start = new Date(startDate);
        const end = new Date(endDate);
        let freeDays = 0;
        const d = new Date(start);
        while (d <= end) {
          const dateStr = d.toISOString().split("T")[0];
          const hasMeeting = get().events.some(
            (e) =>
              e.type === "meeting" && getDateFromISO(e.startTime) === dateStr
          );
          if (!hasMeeting) freeDays++;
          d.setDate(d.getDate() + 1);
        }
        return freeDays;
      },
    }),
    {
      name: "questline-schedule",
      version: 1,
    }
  )
);
