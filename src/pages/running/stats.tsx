import { AppShell } from "@/components/layout/AppShell";
import { RunningNav } from "@/components/layout/RunningNav";
import { MetricCard } from "@/components/shared/MetricCard";
import { MaskedAmount } from "@/components/shared/MaskedAmount";
import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  Tooltip,
  ResponsiveContainer,
} from "recharts";
import { useRunningStore } from "@/stores/runningStore";
import { formatDuration, formatPace, formatDate, getMonthKey } from "@/lib/utils";
import { RUNNING_EVENT_TYPE_LABELS } from "@/lib/constants";

const TOOLTIP_STYLE = {
  backgroundColor: "#161616",
  border: "1px solid #222",
  borderRadius: 4,
  fontSize: 11,
  color: "#e0e0e0",
};

export default function StatsPage() {
  const getAllActivities = useRunningStore((s) => s.getAllActivities);
  const getTotalDistance = useRunningStore((s) => s.getTotalDistance);
  const getTotalRuns = useRunningStore((s) => s.getTotalRuns);
  const getRunningStreak = useRunningStore((s) => s.getRunningStreak);
  const getAveragePace = useRunningStore((s) => s.getAveragePace);
  const getPersonalBests = useRunningStore((s) => s.getPersonalBests);
  const getTotalSpent = useRunningStore((s) => s.getTotalSpent);
  const getWeekdayData = useRunningStore((s) => s.getWeekdayData);
  const getMonthlyData = useRunningStore((s) => s.getMonthlyData);

  const monthKey = getMonthKey();
  const activities = getAllActivities();

  const totalDistanceAll = getTotalDistance();
  const totalDistanceMonth = getTotalDistance(monthKey);
  const totalRunsAll = getTotalRuns();
  const totalRunsMonth = getTotalRuns(monthKey);
  const streak = getRunningStreak();
  const avgPace = getAveragePace();
  const pbs = getPersonalBests();
  const totalSpent = getTotalSpent();
  const weekdayData = getWeekdayData();
  const monthlyData = getMonthlyData(12);

  // Longest activity
  const longestActivity = activities.length > 0
    ? activities.reduce((best, a) => (a.distanceKm > best.distanceKm ? a : best))
    : null;

  return (
    <AppShell title="Running">
      <RunningNav />

      {activities.length === 0 ? (
        <p className="text-[12px] text-muted-foreground text-center py-12">
          Log some runs to see your stats
        </p>
      ) : (
        <div className="space-y-8">
          {/* Top Metrics */}
          <div className="grid grid-cols-5 gap-6 pb-5 border-b border-border">
            <MetricCard
              label="This month"
              value={`${Math.round(totalDistanceMonth * 10) / 10} km`}
              subtitle={`${totalRunsMonth} activit${totalRunsMonth !== 1 ? "ies" : "y"}`}
            />
            <MetricCard
              label="All time"
              value={`${Math.round(totalDistanceAll * 10) / 10} km`}
              subtitle={`${totalRunsAll} activit${totalRunsAll !== 1 ? "ies" : "y"}`}
            />
            <MetricCard
              label="Streak"
              value={`${streak} day${streak !== 1 ? "s" : ""}`}
              subtitle="consecutive"
            />
            <MetricCard
              label="Avg pace"
              value={avgPace > 0 ? formatPace(avgPace, 1) : "—"}
              subtitle="all activities"
            />
            <MetricCard
              label="Total spent"
              value={<MaskedAmount value={Math.round(totalSpent)} />}
              subtitle="on running"
            />
          </div>

          {/* Charts */}
          <div className="grid grid-cols-2 gap-8">
            {/* Monthly km */}
            <div>
              <span className="text-[12px] text-muted-foreground uppercase tracking-[0.06em] mb-3 block">
                Monthly km — last 12 months
              </span>
              <ResponsiveContainer width="100%" height={110}>
                <BarChart data={monthlyData} barGap={1}>
                  <XAxis
                    dataKey="month"
                    tick={{ fontSize: 9, fill: "#5a5a5a" }}
                    axisLine={false}
                    tickLine={false}
                  />
                  <YAxis hide />
                  <Tooltip
                    contentStyle={TOOLTIP_STYLE}
                    formatter={(v, _, p) => [`${v} km (${p.payload.count})`, "Distance"]}
                  />
                  <Bar dataKey="km" fill="rgba(255,255,255,0.45)" radius={[1, 1, 0, 0]} />
                </BarChart>
              </ResponsiveContainer>
            </div>

            {/* Weekday distribution */}
            <div>
              <span className="text-[12px] text-muted-foreground uppercase tracking-[0.06em] mb-3 block">
                Avg km by weekday
              </span>
              <ResponsiveContainer width="100%" height={110}>
                <BarChart data={weekdayData} barGap={1}>
                  <XAxis
                    dataKey="day"
                    tick={{ fontSize: 9, fill: "#5a5a5a" }}
                    axisLine={false}
                    tickLine={false}
                  />
                  <YAxis hide />
                  <Tooltip
                    contentStyle={TOOLTIP_STYLE}
                    formatter={(v, _, p) => [`${v} km avg (${p.payload.count} runs)`, "Avg distance"]}
                  />
                  <Bar dataKey="km" fill="rgba(255,255,255,0.35)" radius={[1, 1, 0, 0]} />
                </BarChart>
              </ResponsiveContainer>
            </div>
          </div>

          {/* Personal Bests */}
          <div>
            <span className="text-[12px] text-muted-foreground uppercase tracking-[0.06em] mb-3 block">
              Personal bests
            </span>

            {pbs.length > 0 ? (
              <>
                <div className="grid grid-cols-[90px_70px_100px_80px_80px_1fr] gap-3 px-0 py-2.5 text-[11px] uppercase tracking-[0.06em] text-muted-foreground border-b border-border">
                  <span>Distance</span>
                  <span>Type</span>
                  <span>Time</span>
                  <span>Pace</span>
                  <span>Date</span>
                  <span>Activity</span>
                </div>

                {pbs.map((pb) => (
                  <div
                    key={`${pb.label}-${pb.type}`}
                    className="grid grid-cols-[90px_70px_100px_80px_80px_1fr] gap-3 py-2.5 text-[13px] border-b border-border last:border-0"
                  >
                    <span className="font-medium">{pb.label}</span>
                    <span className="text-[11px] text-muted-foreground capitalize">
                      {RUNNING_EVENT_TYPE_LABELS[pb.type]}
                    </span>
                    <span className="font-mono tabular-nums">
                      {formatDuration(pb.activity.durationSeconds)}
                    </span>
                    <span className="font-mono tabular-nums text-muted-foreground">
                      {formatPace(pb.activity.durationSeconds, pb.activity.distanceKm)}
                    </span>
                    <span className="text-[11px] text-muted-foreground font-mono tabular-nums">
                      {formatDate(pb.activity.date)}
                    </span>
                    <div className="flex items-baseline gap-1.5 min-w-0">
                      <span className="text-muted-foreground truncate">{pb.activity.name}</span>
                      {pb.activity.source === "event" && (
                        <span className="text-[10px] text-muted-foreground/50 uppercase shrink-0">race</span>
                      )}
                    </div>
                  </div>
                ))}
              </>
            ) : (
              <p className="text-[12px] text-muted-foreground py-4">
                Log runs or complete events at standard distances (5K, 10K, half, marathon) to see personal bests
              </p>
            )}
          </div>

          {/* Longest activity */}
          {longestActivity && (
            <div>
              <span className="text-[12px] text-muted-foreground uppercase tracking-[0.06em] mb-3 block">
                Longest activity
              </span>
              <div className="flex items-baseline gap-4 text-[13px]">
                <span className="font-medium">{longestActivity.name}</span>
                <span className="font-mono tabular-nums">{longestActivity.distanceKm} km</span>
                <span className="font-mono tabular-nums text-muted-foreground">
                  {formatDuration(longestActivity.durationSeconds)}
                </span>
                <span className="text-[11px] text-muted-foreground font-mono">
                  {formatDate(longestActivity.date)}
                </span>
              </div>
            </div>
          )}

          {/* Monthly Breakdown table */}
          <div>
            <span className="text-[12px] text-muted-foreground uppercase tracking-[0.06em] mb-3 block">
              Monthly breakdown
            </span>

            <div className="grid grid-cols-[80px_60px_80px_1fr] gap-3 px-0 py-2.5 text-[11px] uppercase tracking-[0.06em] text-muted-foreground border-b border-border">
              <span>Month</span>
              <span>Activities</span>
              <span>Distance</span>
              <span></span>
            </div>

            {[...monthlyData].reverse().map((m) => {
              const maxDist = Math.max(...monthlyData.map((x) => x.km), 1);
              const pct = (m.km / maxDist) * 100;
              return (
                <div
                  key={m.month}
                  className="grid grid-cols-[80px_60px_80px_1fr] gap-3 py-2 text-[13px] border-b border-border last:border-0"
                >
                  <span className="text-muted-foreground text-[12px]">{m.month}</span>
                  <span className="font-mono tabular-nums">{m.count}</span>
                  <span className="font-mono tabular-nums">{m.km} km</span>
                  <div className="flex items-center">
                    <div
                      className="h-2 bg-foreground/20 rounded-full transition-all"
                      style={{ width: `${pct}%` }}
                    />
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      )}
    </AppShell>
  );
}
