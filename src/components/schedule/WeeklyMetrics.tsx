import { useMemo } from "react";
import { useScheduleStore } from "@/stores/scheduleStore";
import { getWeekStart } from "@/lib/utils";

export function WeeklyMetrics() {
  const now = new Date();
  const weekStart = getWeekStart(now);
  const weekStartStr = weekStart.toISOString().split("T")[0];
  const weekEnd = new Date(weekStart);
  weekEnd.setDate(weekEnd.getDate() + 6);
  const weekEndStr = weekEnd.toISOString().split("T")[0];

  const allEvents = useScheduleStore((s) => s.events);

  const { meetingMin, focusMin, freeDays, meetingCount, focusBlocks } =
    useMemo(() => {
      const weekEvents = allEvents.filter((e) => {
        const d = e.startTime.split("T")[0];
        return d >= weekStartStr && d <= weekEndStr;
      });

      const mm = weekEvents
        .filter((e) => e.type === "meeting")
        .reduce((s, e) => s + e.duration, 0);
      const fm = weekEvents
        .filter((e) => e.type === "focus")
        .reduce((s, e) => s + e.duration, 0);

      let free = 0;
      const d = new Date(weekStartStr);
      const end = new Date(weekEndStr);
      while (d <= end) {
        const ds = d.toISOString().split("T")[0];
        const hasMeeting = weekEvents.some(
          (e) => e.type === "meeting" && e.startTime.split("T")[0] === ds
        );
        if (!hasMeeting) free++;
        d.setDate(d.getDate() + 1);
      }

      return {
        meetingMin: mm,
        focusMin: fm,
        freeDays: free,
        meetingCount: weekEvents.filter((e) => e.type === "meeting").length,
        focusBlocks: weekEvents.filter((e) => e.type === "focus").length,
      };
    }, [allEvents, weekStartStr, weekEndStr]);

  const avgFocusLen =
    focusBlocks > 0
      ? Math.round((focusMin / focusBlocks / 60) * 10) / 10
      : 0;

  const metrics = [
    { label: "Meetings", value: String(meetingCount), sub: "this week" },
    { label: "Meeting hours", value: `${(meetingMin / 60).toFixed(1)}h`, sub: `${meetingCount} meetings` },
    { label: "Focus blocks", value: String(focusBlocks), sub: `avg ${avgFocusLen}h` },
    { label: "Free days", value: String(freeDays), sub: "target: 2" },
  ];

  return (
    <div className="mt-5 pt-5 border-t border-border">
      <div className="grid grid-cols-4 gap-6">
        {metrics.map((m) => (
          <div key={m.label}>
            <div className="text-[10px] text-muted-foreground uppercase tracking-[0.06em] mb-1">
              {m.label}
            </div>
            <div className="text-[18px] font-medium tabular-nums">{m.value}</div>
            <div className="text-[9px] text-muted-foreground mt-0.5">{m.sub}</div>
          </div>
        ))}
      </div>
    </div>
  );
}
