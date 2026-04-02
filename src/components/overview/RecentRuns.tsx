import { useMemo } from "react";
import Link from "next/link";
import { useRunningStore } from "@/stores/runningStore";
import { formatDate, getMonthKey, getWeekStart } from "@/lib/utils";

export function RecentRuns() {
  const runs = useRunningStore((s) => s.runs);
  const events = useRunningStore((s) => s.events);

  const now = new Date();
  const currentDay = now.getDate();
  const daysInMonth = new Date(now.getFullYear(), now.getMonth() + 1, 0).getDate();
  const monthKey = getMonthKey();
  const monthName = now.toLocaleDateString("en-US", { month: "short" });

  // Week range
  const weekStart = getWeekStart(now);
  const weekEnd = new Date(weekStart);
  weekEnd.setDate(weekEnd.getDate() + 6);
  const weekStartStr = weekStart.toISOString().split("T")[0];
  const weekEndStr = weekEnd.toISOString().split("T")[0];
  const weekLabel = `${weekStart.toLocaleDateString("en-US", { month: "short", day: "numeric" })} – ${weekEnd.toLocaleDateString("en-US", { month: "short", day: "numeric" })}`;

  // Daily km for the month chart
  const dailyKm = useMemo(() => {
    const result: { day: number; km: number; future: boolean }[] = [];
    for (let d = 1; d <= daysInMonth; d++) {
      const dateStr = `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, "0")}-${String(d).padStart(2, "0")}`;
      const km = runs
        .filter((r) => r.date === dateStr)
        .reduce((sum, r) => sum + r.distanceKm, 0);
      result.push({ day: d, km, future: d > currentDay });
    }
    return result;
  }, [runs, daysInMonth, currentDay]);

  const maxKm = Math.max(...dailyKm.map((d) => d.km), 1);

  // Metrics
  const weekKm = useMemo(
    () =>
      runs
        .filter((r) => r.date >= weekStartStr && r.date <= weekEndStr)
        .reduce((s, r) => s + r.distanceKm, 0),
    [runs, weekStartStr, weekEndStr]
  );
  const monthKm = useMemo(
    () =>
      runs
        .filter((r) => r.date.startsWith(monthKey))
        .reduce((s, r) => s + r.distanceKm, 0),
    [runs, monthKey]
  );
  const totalKm = runs.reduce((s, r) => s + r.distanceKm, 0);

  const upcoming = useMemo(
    () =>
      events
        .filter((e) => e.status === "upcoming")
        .sort((a, b) => a.date.localeCompare(b.date))
        .slice(0, 3),
    [events]
  );

  return (
    <div>
      <div className="text-[12px] uppercase tracking-[0.06em] text-muted-foreground mb-3">
        Running
      </div>

      <div className="flex gap-6 mb-4">
        <div>
          <div className="text-[22px] font-medium tabular-nums">
            {Math.round(weekKm * 10) / 10} km
          </div>
          <div className="text-[12px] text-muted-foreground">This week</div>
          <div className="text-[10px] text-muted-foreground/60 font-mono">{weekLabel}</div>
        </div>
        <div>
          <div className="text-[22px] font-medium tabular-nums">
            {Math.round(monthKm * 10) / 10} km
          </div>
          <div className="text-[12px] text-muted-foreground">This month</div>
        </div>
        <div>
          <div className="text-[22px] font-medium tabular-nums">
            {Math.round(totalKm * 10) / 10} km
          </div>
          <div className="text-[12px] text-muted-foreground">Total</div>
        </div>
      </div>

      {/* Daily bar chart */}
      <div className="flex items-end gap-[2px] h-16 mb-1">
        {dailyKm.map((d) => {
          const heightPct = d.km > 0 ? Math.max((d.km / maxKm) * 100, 6) : 0;
          return (
            <div key={d.day} className="flex-1 flex flex-col justify-end h-full">
              <div
                className="w-full transition-all duration-300"
                style={{
                  height: d.km > 0 ? `${heightPct}%` : "2px",
                  backgroundColor: d.future
                    ? "rgba(255,255,255,0.04)"
                    : d.km > 0
                      ? "rgba(255,255,255,0.55)"
                      : "rgba(255,255,255,0.08)",
                  minHeight: 2,
                }}
              />
            </div>
          );
        })}
      </div>
      <div className="flex justify-between mb-4">
        <span className="text-[11px] text-muted-foreground font-mono">{monthName} 1</span>
        <span className="text-[11px] text-muted-foreground font-mono">{monthName} {daysInMonth}</span>
      </div>

      {upcoming.length > 0 && (
        <div>
          <div className="text-[11px] uppercase tracking-[0.06em] text-muted-foreground mb-2">
            Upcoming events
          </div>
          {upcoming.map((ev) => (
            <div
              key={ev.id}
              className="flex items-baseline gap-3 py-1.5"
            >
              <span className="text-[11px] text-muted-foreground font-mono tabular-nums w-16 shrink-0">
                {formatDate(ev.date)}
              </span>
              <span className="text-[13px] text-foreground flex-1 truncate">{ev.name}</span>
              {ev.distanceKm > 0 && (
                <span className="text-[11px] text-muted-foreground font-mono tabular-nums shrink-0">
                  {ev.distanceKm} km
                </span>
              )}
            </div>
          ))}
        </div>
      )}

      <Link
        href="/running"
        className="text-[11px] text-muted-foreground hover:text-foreground mt-3 block"
      >
        View all &rarr;
      </Link>
    </div>
  );
}
