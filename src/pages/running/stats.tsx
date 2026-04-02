import { AppShell } from "@/components/layout/AppShell";
import { RunningNav } from "@/components/layout/RunningNav";
import { MetricCard } from "@/components/shared/MetricCard";
import { MaskedAmount } from "@/components/shared/MaskedAmount";
import { useRunningStore } from "@/stores/runningStore";
import { formatDuration, formatPace, formatDate, getMonthKey } from "@/lib/utils";

export default function StatsPage() {
  const runs = useRunningStore((s) => s.runs);
  const getTotalDistance = useRunningStore((s) => s.getTotalDistance);
  const getTotalRuns = useRunningStore((s) => s.getTotalRuns);
  const getRunningStreak = useRunningStore((s) => s.getRunningStreak);
  const getAveragePace = useRunningStore((s) => s.getAveragePace);
  const getPersonalBests = useRunningStore((s) => s.getPersonalBests);
  const getTotalSpent = useRunningStore((s) => s.getTotalSpent);

  const monthKey = getMonthKey();
  const totalDistanceAll = getTotalDistance();
  const totalDistanceMonth = getTotalDistance(monthKey);
  const totalRunsAll = getTotalRuns();
  const totalRunsMonth = getTotalRuns(monthKey);
  const streak = getRunningStreak();
  const avgPace = getAveragePace();
  const pbs = getPersonalBests();
  const totalSpent = getTotalSpent();

  // Longest run
  const longestRun = runs.length > 0
    ? runs.reduce((best, r) => (r.distanceKm > best.distanceKm ? r : best))
    : null;

  // Recent months breakdown (last 6)
  const monthBreakdown: { label: string; runs: number; distance: number }[] = [];
  for (let i = 0; i < 6; i++) {
    const d = new Date();
    d.setMonth(d.getMonth() - i);
    const key = getMonthKey(d);
    const label = d.toLocaleDateString("en-US", { month: "short", year: "2-digit" });
    monthBreakdown.push({
      label,
      runs: getTotalRuns(key),
      distance: Math.round(getTotalDistance(key) * 10) / 10,
    });
  }

  return (
    <AppShell title="Running">
      <RunningNav />

      {runs.length === 0 ? (
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
              subtitle={`${totalRunsMonth} run${totalRunsMonth !== 1 ? "s" : ""}`}
            />
            <MetricCard
              label="All time"
              value={`${Math.round(totalDistanceAll * 10) / 10} km`}
              subtitle={`${totalRunsAll} run${totalRunsAll !== 1 ? "s" : ""}`}
            />
            <MetricCard
              label="Streak"
              value={`${streak} day${streak !== 1 ? "s" : ""}`}
              subtitle="consecutive"
            />
            <MetricCard
              label="Avg pace"
              value={avgPace > 0 ? formatPace(avgPace, 1) : "—"}
              subtitle="all runs"
            />
            <MetricCard
              label="Total spent"
              value={<MaskedAmount value={Math.round(totalSpent)} />}
              subtitle="on running"
            />
          </div>

          {/* Personal Bests */}
          <div>
            <span className="text-[12px] text-muted-foreground uppercase tracking-[0.06em] mb-3 block">
              Personal bests
            </span>

            {pbs.length > 0 ? (
              <>
                <div className="grid grid-cols-[100px_100px_80px_80px_1fr] gap-3 px-0 py-2.5 text-[11px] uppercase tracking-[0.06em] text-muted-foreground border-b border-border">
                  <span>Distance</span>
                  <span>Time</span>
                  <span>Pace</span>
                  <span>Date</span>
                  <span>Run</span>
                </div>

                {pbs.map((pb) => (
                  <div
                    key={pb.label}
                    className="grid grid-cols-[100px_100px_80px_80px_1fr] gap-3 py-2.5 text-[13px] border-b border-border last:border-0"
                  >
                    <span className="font-medium">{pb.label}</span>
                    <span className="font-mono tabular-nums">
                      {formatDuration(pb.run.durationSeconds)}
                    </span>
                    <span className="font-mono tabular-nums text-muted-foreground">
                      {formatPace(pb.run.durationSeconds, pb.run.distanceKm)}
                    </span>
                    <span className="text-[11px] text-muted-foreground font-mono tabular-nums">
                      {formatDate(pb.run.date)}
                    </span>
                    <span className="text-muted-foreground truncate">{pb.run.name}</span>
                  </div>
                ))}
              </>
            ) : (
              <p className="text-[12px] text-muted-foreground py-4">
                Log runs at standard distances (5K, 10K, half marathon, marathon) to see personal bests
              </p>
            )}
          </div>

          {/* Longest Run */}
          {longestRun && (
            <div>
              <span className="text-[12px] text-muted-foreground uppercase tracking-[0.06em] mb-3 block">
                Longest run
              </span>
              <div className="flex items-baseline gap-4 text-[13px]">
                <span className="font-medium">{longestRun.name}</span>
                <span className="font-mono tabular-nums">{longestRun.distanceKm} km</span>
                <span className="font-mono tabular-nums text-muted-foreground">
                  {formatDuration(longestRun.durationSeconds)}
                </span>
                <span className="text-[11px] text-muted-foreground font-mono">
                  {formatDate(longestRun.date)}
                </span>
              </div>
            </div>
          )}

          {/* Monthly Breakdown */}
          <div>
            <span className="text-[12px] text-muted-foreground uppercase tracking-[0.06em] mb-3 block">
              Monthly breakdown
            </span>

            <div className="grid grid-cols-[80px_60px_80px_1fr] gap-3 px-0 py-2.5 text-[11px] uppercase tracking-[0.06em] text-muted-foreground border-b border-border">
              <span>Month</span>
              <span>Runs</span>
              <span>Distance</span>
              <span></span>
            </div>

            {monthBreakdown.map((m) => {
              const maxDist = Math.max(...monthBreakdown.map((x) => x.distance), 1);
              const pct = (m.distance / maxDist) * 100;
              return (
                <div
                  key={m.label}
                  className="grid grid-cols-[80px_60px_80px_1fr] gap-3 py-2 text-[13px] border-b border-border last:border-0"
                >
                  <span className="text-muted-foreground text-[12px]">{m.label}</span>
                  <span className="font-mono tabular-nums">{m.runs}</span>
                  <span className="font-mono tabular-nums">{m.distance} km</span>
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
