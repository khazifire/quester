import { useMemo } from "react";
import { useScheduleStore } from "@/stores/scheduleStore";
import { getMonthKey, daysInMonth } from "@/lib/utils";

export function MonthView() {
  const now = new Date();
  const monthKey = getMonthKey(now);
  const allEvents = useScheduleStore((s) => s.events);
  const events = useMemo(
    () => allEvents.filter((e) => e.startTime.split("T")[0].startsWith(monthKey)),
    [allEvents, monthKey]
  );
  const today = now.getDate();

  const year = now.getFullYear();
  const month = now.getMonth();
  const totalDays = daysInMonth(year, month + 1);
  const firstDayOfWeek = (new Date(year, month, 1).getDay() + 6) % 7;

  const monthName = now.toLocaleDateString("en-US", {
    month: "long",
    year: "numeric",
  });
  const days = ["Mon", "Tue", "Wed", "Thu", "Fri", "Sat", "Sun"];

  return (
    <div>
      <div className="text-[10px] text-muted-foreground uppercase tracking-[0.06em] mb-3">
        {monthName}
      </div>
      <div className="grid grid-cols-7 gap-px bg-border">
        {days.map((d) => (
          <div
            key={d}
            className="text-[9px] text-muted-foreground text-center py-1.5 bg-card font-medium"
          >
            {d}
          </div>
        ))}
        {Array.from({ length: firstDayOfWeek }).map((_, i) => (
          <div key={`pad-${i}`} className="bg-card" />
        ))}
        {Array.from({ length: totalDays }, (_, i) => i + 1).map((d) => {
          const dateStr = `${year}-${String(month + 1).padStart(2, "0")}-${String(d).padStart(2, "0")}`;
          const dayEvents = events.filter(
            (e) => e.startTime.split("T")[0] === dateStr
          );
          const isToday = d === today;

          return (
            <div
              key={d}
              className={`py-2 px-1 text-center ${
                isToday
                  ? "bg-white/[0.06]"
                  : "bg-card hover:bg-white/[0.02]"
              } transition-colors cursor-pointer`}
            >
              <div
                className={`text-[12px] ${
                  isToday ? "font-medium text-foreground" : "text-foreground/70"
                }`}
              >
                {d}
              </div>
              {dayEvents.length > 0 && (
                <div className="flex justify-center gap-0.5 mt-0.5">
                  {dayEvents.slice(0, 3).map((ev) => (
                    <div key={ev.id} className="w-1 h-1 bg-foreground/30 rounded-full" />
                  ))}
                </div>
              )}
            </div>
          );
        })}
      </div>
    </div>
  );
}
