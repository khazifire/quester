import { useMemo } from "react";
import { useScheduleStore } from "@/stores/scheduleStore";
import { getWeekStart } from "@/lib/utils";

export function WeekView() {
  const now = new Date();
  const weekStart = getWeekStart(now);
  const allEvents = useScheduleStore((s) => s.events);
  const weekStartStr = weekStart.toISOString().split("T")[0];
  const weekEnd = new Date(weekStart);
  weekEnd.setDate(weekEnd.getDate() + 6);
  const weekEndStr = weekEnd.toISOString().split("T")[0];
  const events = useMemo(
    () =>
      allEvents.filter((e) => {
        const d = e.startTime.split("T")[0];
        return d >= weekStartStr && d <= weekEndStr;
      }),
    [allEvents, weekStartStr, weekEndStr]
  );

  const days = ["Mon", "Tue", "Wed", "Thu", "Fri", "Sat", "Sun"];
  const todayIdx = (now.getDay() + 6) % 7;

  return (
    <div>
      <div className="text-[10px] text-muted-foreground uppercase tracking-[0.06em] mb-3">
        This week
      </div>
      <div className="grid grid-cols-7 gap-px bg-border">
        {days.map((day, i) => {
          const date = new Date(weekStart);
          date.setDate(date.getDate() + i);
          const dateStr = date.toISOString().split("T")[0];
          const dayEvents = events.filter(
            (e) => e.startTime.split("T")[0] === dateStr
          );
          const isToday = i === todayIdx;

          return (
            <div
              key={day}
              className={`p-2.5 min-h-[100px] ${
                isToday ? "bg-white/[0.04]" : "bg-card"
              }`}
            >
              <div
                className={`text-[10px] font-medium text-center mb-2 ${
                  isToday ? "text-foreground" : "text-muted-foreground"
                }`}
              >
                {day}
              </div>
              {dayEvents.map((ev) => (
                <div
                  key={ev.id}
                  className="mb-1 px-1 py-0.5 text-[9px] leading-tight text-foreground/70 border-l border-foreground/20 pl-1.5"
                >
                  {ev.title.split("\u2014")[0].trim()}
                </div>
              ))}
            </div>
          );
        })}
      </div>
    </div>
  );
}
