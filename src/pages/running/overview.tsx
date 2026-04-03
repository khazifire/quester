import { useRef, useState } from "react";
import Link from "next/link";
import { AppShell } from "@/components/layout/AppShell";
import { RunningNav } from "@/components/layout/RunningNav";
import { MetricCard } from "@/components/shared/MetricCard";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import {
  BarChart,
  Bar,
  Cell,
  XAxis,
  YAxis,
  Tooltip,
  ResponsiveContainer,
} from "recharts";
import { useRunningStore } from "@/stores/runningStore";
import { formatDate, formatDuration, formatPace, getMonthKey, getWeekStart, parseDuration } from "@/lib/utils";
import { toPng } from "html-to-image";
import { toast } from "sonner";

type SummaryType = "week" | "month";
type CardTheme = "dark" | "light";

const TOOLTIP_STYLE = {
  backgroundColor: "#161616",
  border: "1px solid #222",
  borderRadius: 4,
  fontSize: 11,
  color: "#e0e0e0",
};

// Card theme tokens
const THEMES = {
  dark: {
    bg: "#0C0C0C",
    text: "#FFFFFF",
    muted: "rgba(255,255,255,0.45)",
    divider: "rgba(255,255,255,0.08)",
    barActive: "rgba(255,255,255,0.75)",
    barEmpty: "rgba(255,255,255,0.14)",
    label: "rgba(255,255,255,0.35)",
  },
  light: {
    bg: "#F5F2ED",
    text: "#0C0C0C",
    muted: "rgba(0,0,0,0.45)",
    divider: "rgba(0,0,0,0.08)",
    barActive: "rgba(0,0,0,0.7)",
    barEmpty: "rgba(0,0,0,0.13)",
    label: "rgba(0,0,0,0.35)",
  },
};

const EMPTY_LOG = { name: "", date: new Date().toISOString().split("T")[0], distanceKm: "", duration: "" };

export default function RunningOverviewPage() {
  const getAllActivities = useRunningStore((s) => s.getAllActivities);
  const getRunningStreak = useRunningStore((s) => s.getRunningStreak);
  const getTotalDistance = useRunningStore((s) => s.getTotalDistance);
  const getTotalRuns = useRunningStore((s) => s.getTotalRuns);
  const getTotalSeconds = useRunningStore((s) => s.getTotalSeconds);
  const getYearlyKm = useRunningStore((s) => s.getYearlyKm);
  const getWeeklyData = useRunningStore((s) => s.getWeeklyData);
  const getMonthlyData = useRunningStore((s) => s.getMonthlyData);
  const events = useRunningStore((s) => s.events);
  const addRun = useRunningStore((s) => s.addRun);

  const now = new Date();
  const monthKey = getMonthKey();
  const yearKey = String(now.getFullYear());

  const weekStart = getWeekStart(now);
  const weekEnd = new Date(weekStart);
  weekEnd.setDate(weekEnd.getDate() + 6);
  const weekStartStr = weekStart.toISOString().split("T")[0];
  const weekEndStr = weekEnd.toISOString().split("T")[0];
  const weekLabel = `${weekStart.toLocaleDateString("en-US", { month: "short", day: "numeric" })} – ${weekEnd.toLocaleDateString("en-US", { month: "short", day: "numeric" })}`;

  const activities = getAllActivities();
  const weekActivities = activities.filter((a) => a.date >= weekStartStr && a.date <= weekEndStr);
  const weekKm = Math.round(weekActivities.reduce((s, a) => s + a.distanceKm, 0) * 10) / 10;

  const monthKm = Math.round(getTotalDistance(monthKey) * 10) / 10;
  const monthRuns = getTotalRuns(monthKey);
  const monthSeconds = getTotalSeconds(monthKey);
  const yearKm = Math.round(getYearlyKm() * 10) / 10;
  const yearRuns = getTotalRuns(yearKey);
  const streak = getRunningStreak();

  const weeklyData = getWeeklyData(12);
  const monthlyData = getMonthlyData(12);

  // This month — daily km (all days, including future as placeholder)
  const daysInCurrentMonth = new Date(now.getFullYear(), now.getMonth() + 1, 0).getDate();
  const monthDailyData = Array.from({ length: daysInCurrentMonth }, (_, i) => {
    const d = i + 1;
    const dateStr = `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, "0")}-${String(d).padStart(2, "0")}`;
    const km = activities.filter((a) => a.date === dateStr).reduce((s, a) => s + a.distanceKm, 0);
    return { day: d, km: Math.round(km * 10) / 10, future: d > now.getDate() };
  });

  const upcoming = events
    .filter((e) => e.status === "upcoming")
    .sort((a, b) => a.date.localeCompare(b.date))
    .slice(0, 5);

  const recentActivities = [...activities]
    .sort((a, b) => b.date.localeCompare(a.date))
    .slice(0, 5);

  // Previous week
  const prevWeekStart = new Date(weekStart);
  prevWeekStart.setDate(prevWeekStart.getDate() - 7);
  const prevWeekEnd = new Date(weekEnd);
  prevWeekEnd.setDate(prevWeekEnd.getDate() - 7);
  const prevWeekStartStr = prevWeekStart.toISOString().split("T")[0];
  const prevWeekEndStr = prevWeekEnd.toISOString().split("T")[0];
  const prevWeekActivities = activities.filter((a) => a.date >= prevWeekStartStr && a.date <= prevWeekEndStr);
  const prevWeekKm = Math.round(prevWeekActivities.reduce((s, a) => s + a.distanceKm, 0) * 10) / 10;

  // Previous month
  const prevMonthDate = new Date(now.getFullYear(), now.getMonth() - 1, 1);
  const prevMonthKey = `${prevMonthDate.getFullYear()}-${String(prevMonthDate.getMonth() + 1).padStart(2, "0")}`;
  const prevMonthActivities = activities.filter((a) => a.date.startsWith(prevMonthKey));
  const prevMonthKm = Math.round(prevMonthActivities.reduce((s, a) => s + a.distanceKm, 0) * 10) / 10;

  // Log run modal state
  const [logOpen, setLogOpen] = useState(false);
  const [logForm, setLogForm] = useState(EMPTY_LOG);

  function handleLogRun(e: React.FormEvent) {
    e.preventDefault();
    const dist = parseFloat(logForm.distanceKm);
    if (!logForm.name.trim() || isNaN(dist) || dist <= 0) {
      toast.error("Name and distance are required");
      return;
    }
    const secs = logForm.duration ? (parseDuration(logForm.duration) ?? 0) : 0;
    addRun({ name: logForm.name.trim(), date: logForm.date, distanceKm: dist, durationSeconds: secs });
    toast.success("Run logged");
    setLogOpen(false);
    setLogForm(EMPTY_LOG);
  }

  // Summary modal state
  const [summaryOpen, setSummaryOpen] = useState(false);
  const [summaryType, setSummaryType] = useState<SummaryType>("month");
  const [cardTheme, setCardTheme] = useState<CardTheme>("dark");
  const summaryRef = useRef<HTMLDivElement>(null);

  const summaryActivities = summaryType === "month"
    ? activities.filter((a) => a.date.startsWith(monthKey))
    : weekActivities;

  const summaryKm = Math.round(summaryActivities.reduce((s, a) => s + a.distanceKm, 0) * 10) / 10;
  const summarySeconds = summaryActivities.reduce((s, a) => s + a.durationSeconds, 0);
  const summaryCount = summaryActivities.length;
  const summaryLongest = summaryActivities.length > 0
    ? summaryActivities.reduce((b, a) => a.distanceKm > b.distanceKm ? a : b)
    : null;

  const prevKm = summaryType === "week" ? prevWeekKm : prevMonthKm;
  const prevLabel = summaryType === "week" ? "PREV WEEK" : "PREV MONTH";
  const pctChange = prevKm > 0 ? Math.round(((summaryKm - prevKm) / prevKm) * 100) : null;

  const summaryTitle = summaryType === "month"
    ? now.toLocaleDateString("en-US", { month: "long", year: "numeric" })
    : weekLabel;

  const summaryPeriodShort = summaryType === "month"
    ? now.toLocaleDateString("en-US", { month: "short", year: "numeric" }).toUpperCase()
    : weekLabel.toUpperCase();

  // Build daily bars for the card
  const summaryBars = summaryType === "month"
    ? (() => {
        const daysInMonth = new Date(now.getFullYear(), now.getMonth() + 1, 0).getDate();
        return Array.from({ length: daysInMonth }, (_, i) => {
          const d = i + 1;
          const dateStr = `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, "0")}-${String(d).padStart(2, "0")}`;
          const km = summaryActivities.filter((a) => a.date === dateStr).reduce((s, a) => s + a.distanceKm, 0);
          return { label: d % 5 === 1 ? String(d) : "", km: Math.round(km * 10) / 10 };
        });
      })()
    : Array.from({ length: 7 }, (_, i) => {
        const d = new Date(weekStart);
        d.setDate(d.getDate() + i);
        const dateStr = d.toISOString().split("T")[0];
        const label = d.toLocaleDateString("en-US", { weekday: "short" });
        const km = summaryActivities.filter((a) => a.date === dateStr).reduce((s, a) => s + a.distanceKm, 0);
        return { label, km: Math.round(km * 10) / 10 };
      });

  const maxBarKm = Math.max(...summaryBars.map((b) => b.km), 0.1);

  const t = THEMES[cardTheme];

  async function handleExportPng() {
    if (!summaryRef.current) return;
    try {
      const dataUrl = await toPng(summaryRef.current, {
        backgroundColor: t.bg,
        pixelRatio: 2.7, // ~1080px output for IG
      });
      const a = document.createElement("a");
      a.download = `running-${summaryType}-${new Date().toISOString().split("T")[0]}.png`;
      a.href = dataUrl;
      a.click();
    } catch {
      toast.error("Export failed");
    }
  }

  return (
    <AppShell
      title="Running"
      actions={
        <div className="flex gap-2">
          <Button
            variant="outline"
            className="text-[12px] h-7 px-3 cursor-pointer"
            onClick={() => { setLogForm(EMPTY_LOG); setLogOpen(true); }}
          >
            Log run
          </Button>
          <Button
            variant="outline"
            className="text-[12px] h-7 px-3 cursor-pointer"
            onClick={() => { setSummaryType("week"); setSummaryOpen(true); }}
          >
            Week summary
          </Button>
          <Button
            variant="outline"
            className="text-[12px] h-7 px-3 cursor-pointer"
            onClick={() => { setSummaryType("month"); setSummaryOpen(true); }}
          >
            Month summary
          </Button>
        </div>
      }
    >
      <RunningNav />

      {activities.length === 0 ? (
        <p className="text-[12px] text-muted-foreground text-center py-12">
          Log runs or complete events to see your overview
        </p>
      ) : (
        <div className="space-y-8">
          {/* Quick Stats */}
          <div className="grid grid-cols-5 gap-6 pb-5 border-b border-border">
            <MetricCard
              label="This week"
              value={`${weekKm} km`}
              subtitle={`${weekActivities.length} activit${weekActivities.length !== 1 ? "ies" : "y"}`}
            />
            <MetricCard
              label="This month"
              value={`${monthKm} km`}
              subtitle={`${monthRuns} activit${monthRuns !== 1 ? "ies" : "y"}`}
            />
            <MetricCard
              label="This year"
              value={`${yearKm} km`}
              subtitle={`${yearRuns} activit${yearRuns !== 1 ? "ies" : "y"}`}
            />
            <MetricCard
              label="Time this month"
              value={monthSeconds > 0 ? formatDuration(monthSeconds) : "—"}
              subtitle="moving time"
            />
            <MetricCard
              label="Streak"
              value={`${streak} day${streak !== 1 ? "s" : ""}`}
              subtitle="consecutive"
            />
          </div>

          {/* Charts */}
          <div className="grid grid-cols-2 gap-8">
            <div>
              <span className="text-[12px] text-muted-foreground uppercase tracking-[0.06em] mb-3 block">
                {now.toLocaleDateString("en-US", { month: "long", year: "numeric" })} — daily km
              </span>
              <ResponsiveContainer width="100%" height={120}>
                <BarChart data={monthDailyData} barGap={1} barSize={6}>
                  <XAxis
                    dataKey="day"
                    tick={{ fontSize: 9, fill: "#5a5a5a" }}
                    axisLine={false}
                    tickLine={false}
                    interval={4}
                  />
                  <YAxis hide />
                  <Tooltip
                    contentStyle={TOOLTIP_STYLE}
                    formatter={(v, _, p) => [p.payload.future ? "upcoming" : `${v} km`, "Distance"]}
                    labelFormatter={(label) => `Day ${label}`}
                  />
                  <Bar dataKey="km" radius={[1, 1, 0, 0]} minPointSize={2}>
                    {monthDailyData.map((entry, i) => (
                      <Cell
                        key={i}
                        fill={
                          entry.future
                            ? "rgba(255,255,255,0.06)"
                            : entry.km > 0
                              ? "rgba(255,255,255,0.5)"
                              : "rgba(255,255,255,0.10)"
                        }
                      />
                    ))}
                  </Bar>
                </BarChart>
              </ResponsiveContainer>
            </div>
            <div>
              <span className="text-[12px] text-muted-foreground uppercase tracking-[0.06em] mb-3 block">
                Monthly km — last 12 months
              </span>
              <ResponsiveContainer width="100%" height={120}>
                <BarChart data={monthlyData} barGap={1}>
                  <XAxis dataKey="month" tick={{ fontSize: 9, fill: "#5a5a5a" }} axisLine={false} tickLine={false} />
                  <YAxis hide />
                  <Tooltip contentStyle={TOOLTIP_STYLE} formatter={(v, _, p) => [`${v} km (${p.payload.count} runs)`, "Distance"]} />
                  <Bar dataKey="km" fill="rgba(255,255,255,0.45)" radius={[1, 1, 0, 0]} />
                </BarChart>
              </ResponsiveContainer>
            </div>
          </div>

          {/* Upcoming events + Recent activity — side by side */}
          <div className="grid grid-cols-2 gap-8">
            {/* Upcoming events */}
            <div>
              <span className="text-[12px] text-muted-foreground uppercase tracking-[0.06em] mb-3 block">
                Upcoming events
              </span>
              {upcoming.length === 0 ? (
                <p className="text-[12px] text-muted-foreground py-4">No upcoming events</p>
              ) : (
                <>
                  <div className="grid grid-cols-[60px_1fr_55px_55px] gap-2 px-0 py-2 text-[11px] uppercase tracking-[0.06em] text-muted-foreground border-b border-border">
                    <span>Date</span><span>Event</span><span>Dist</span><span className="text-right">Days</span>
                  </div>
                  {upcoming.map((ev) => {
                    const today = new Date().toISOString().split("T")[0];
                    const daysLeft = Math.ceil((new Date(ev.date).getTime() - new Date(today).getTime()) / 86400000);
                    const dLabel = daysLeft === 0 ? "D-Day" : daysLeft > 0 ? `D-${daysLeft}` : `+${Math.abs(daysLeft)}`;
                    return (
                      <div key={ev.id} className="grid grid-cols-[60px_1fr_55px_55px] gap-2 py-2.5 text-[13px] border-b border-border last:border-0">
                        <span className="text-[11px] text-muted-foreground font-mono tabular-nums">{formatDate(ev.date)}</span>
                        <span className="truncate">{ev.name}</span>
                        <span className="font-mono tabular-nums text-[12px] text-muted-foreground">{ev.distanceKm > 0 ? `${ev.distanceKm} km` : "—"}</span>
                        <span className={`font-mono tabular-nums text-[11px] text-right ${daysLeft === 0 ? "text-foreground font-semibold" : daysLeft <= 14 ? "text-amber-400/80" : "text-muted-foreground"}`}>
                          {dLabel}
                        </span>
                      </div>
                    );
                  })}
                  <Link href="/running/events" className="text-[11px] text-muted-foreground hover:text-foreground mt-3 block">
                    View all &rarr;
                  </Link>
                </>
              )}
            </div>

            {/* Recent activity */}
            <div>
              <span className="text-[12px] text-muted-foreground uppercase tracking-[0.06em] mb-3 block">
                Recent activity
              </span>
              {recentActivities.length === 0 ? (
                <p className="text-[12px] text-muted-foreground py-4">No activities yet</p>
              ) : (
                <>
                  <div className="grid grid-cols-[1fr_55px_65px_70px] gap-2 px-0 py-2 text-[11px] uppercase tracking-[0.06em] text-muted-foreground border-b border-border">
                    <span>Name</span><span>Dist</span><span>Time</span><span>Date</span>
                  </div>
                  {recentActivities.map((a) => (
                    <div key={a.id} className="grid grid-cols-[1fr_55px_65px_70px] gap-2 py-2.5 text-[13px] border-b border-border last:border-0">
                      <div className="flex items-baseline gap-1.5 min-w-0">
                        <span className="truncate">{a.name}</span>
                        {a.source === "event" && <span className="text-[10px] text-muted-foreground/60 uppercase shrink-0">race</span>}
                      </div>
                      <span className="font-mono tabular-nums text-[12px]">{a.distanceKm} km</span>
                      <span className="font-mono tabular-nums text-[12px] text-muted-foreground">{a.durationSeconds > 0 ? formatDuration(a.durationSeconds) : "—"}</span>
                      <span className="text-[11px] text-muted-foreground font-mono tabular-nums">{formatDate(a.date)}</span>
                    </div>
                  ))}
                  <Link href="/running" className="text-[11px] text-muted-foreground hover:text-foreground mt-3 block">
                    View all &rarr;
                  </Link>
                </>
              )}
            </div>
          </div>
        </div>
      )}

      {/* Log Run Dialog */}
      <Dialog open={logOpen} onOpenChange={setLogOpen}>
        <DialogContent className="max-w-sm">
          <DialogHeader>
            <DialogTitle className="text-[14px] font-medium">Log run</DialogTitle>
          </DialogHeader>
          <form onSubmit={handleLogRun} className="space-y-4 pt-1">
            <div className="space-y-1.5">
              <label className="text-[12px] text-muted-foreground block">Name</label>
              <Input
                className="h-8 text-[13px]"
                placeholder="Morning run"
                value={logForm.name}
                onChange={(e) => setLogForm((f) => ({ ...f, name: e.target.value }))}
              />
            </div>
            <div className="grid grid-cols-2 gap-3">
              <div className="space-y-1.5">
                <label className="text-[12px] text-muted-foreground block">Distance (km)</label>
                <Input
                  className="h-8 text-[13px]"
                  type="number"
                  step="0.01"
                  min="0"
                  placeholder="10"
                  value={logForm.distanceKm}
                  onChange={(e) => setLogForm((f) => ({ ...f, distanceKm: e.target.value }))}
                />
              </div>
              <div className="space-y-1.5">
                <label className="text-[12px] text-muted-foreground block">Duration</label>
                <Input
                  className="h-8 text-[13px]"
                  placeholder="55:30 or 1:05:00"
                  value={logForm.duration}
                  onChange={(e) => setLogForm((f) => ({ ...f, duration: e.target.value }))}
                />
              </div>
            </div>
            <div className="space-y-1.5">
              <label className="text-[12px] text-muted-foreground block">Date</label>
              <Input
                className="h-8 text-[13px]"
                type="date"
                value={logForm.date}
                onChange={(e) => setLogForm((f) => ({ ...f, date: e.target.value }))}
              />
            </div>
            <div className="flex justify-end gap-2 pt-1">
              <Button type="button" variant="outline" className="h-8 px-4 text-[12px] cursor-pointer" onClick={() => setLogOpen(false)}>
                Cancel
              </Button>
              <Button type="submit" className="h-8 px-4 text-[12px] cursor-pointer">
                Log run
              </Button>
            </div>
          </form>
        </DialogContent>
      </Dialog>

      {/* Summary Dialog */}
      <Dialog open={summaryOpen} onOpenChange={setSummaryOpen}>
        <DialogContent className="max-w-[480px] p-0 overflow-hidden">
          {/* Modal header */}
          <div className="flex items-center justify-between px-6 pt-5 pb-4">
            <DialogTitle className="text-[14px] font-medium">
              {summaryType === "week" ? "Weekly" : "Monthly"} summary
            </DialogTitle>
            {/* Dark / Light toggle */}
            <div className="flex items-center gap-1 bg-white/5 rounded-full p-0.5">
              <button
                onClick={() => setCardTheme("dark")}
                className={`text-[11px] px-3 py-1 rounded-full transition-all cursor-pointer ${
                  cardTheme === "dark"
                    ? "bg-white/10 text-foreground"
                    : "text-muted-foreground hover:text-foreground"
                }`}
              >
                Dark
              </button>
              <button
                onClick={() => setCardTheme("light")}
                className={`text-[11px] px-3 py-1 rounded-full transition-all cursor-pointer ${
                  cardTheme === "light"
                    ? "bg-white/10 text-foreground"
                    : "text-muted-foreground hover:text-foreground"
                }`}
              >
                Light
              </button>
            </div>
          </div>

          {/* The exportable card */}
          <div className="px-6">
            <div
              ref={summaryRef}
              style={{
                width: 432,
                height: 500,
                backgroundColor: t.bg,
                color: t.text,
                borderRadius: 16,
                padding: "32px 32px 28px",
                display: "flex",
                flexDirection: "column",
                fontFamily: "-apple-system, BlinkMacSystemFont, 'Segoe UI', sans-serif",
                boxSizing: "border-box",
                overflow: "hidden",
              }}
            >
              {/* Top bar */}
              <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 28 }}>
                <span style={{ fontSize: 10, letterSpacing: "0.18em", color: t.label, fontWeight: 600 }}>
                  QUESTLINE
                </span>
                <span style={{ fontSize: 11, color: t.muted, letterSpacing: "0.06em" }}>
                  {summaryPeriodShort}
                </span>
              </div>

              {/* Hero: distance — current (left) + previous (right) */}
              <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-end", marginBottom: 28 }}>
                {/* Current */}
                <div>
                  <div style={{ display: "flex", alignItems: "baseline", gap: 10 }}>
                    <span style={{ fontSize: 76, fontWeight: 700, letterSpacing: "-0.04em", lineHeight: 1, color: t.text }}>
                      {summaryKm}
                    </span>
                    <span style={{ fontSize: 20, fontWeight: 400, color: t.muted, letterSpacing: "0.02em", paddingBottom: 8 }}>
                      km
                    </span>
                  </div>
                  <span style={{ fontSize: 12, color: t.label, letterSpacing: "0.10em" }}>
                    {summaryType === "week" ? "THIS WEEK" : "THIS MONTH"}
                  </span>
                </div>

                {/* Previous + delta */}
                <div style={{ textAlign: "right", paddingBottom: 4 }}>
                  <div style={{ display: "flex", alignItems: "baseline", gap: 6, justifyContent: "flex-end" }}>
                    <span style={{ fontSize: 34, fontWeight: 600, letterSpacing: "-0.03em", lineHeight: 1, color: t.muted }}>
                      {prevKm > 0 ? prevKm : "—"}
                    </span>
                    {prevKm > 0 && (
                      <span style={{ fontSize: 14, fontWeight: 400, color: t.label, paddingBottom: 4 }}>km</span>
                    )}
                  </div>
                  <div style={{ display: "flex", alignItems: "center", gap: 6, justifyContent: "flex-end", marginTop: 4 }}>
                    <span style={{ fontSize: 10, color: t.label, letterSpacing: "0.10em" }}>{prevLabel}</span>
                    {pctChange !== null && (
                      <span style={{
                        fontSize: 11,
                        fontWeight: 700,
                        letterSpacing: "0.03em",
                        color: pctChange >= 0 ? "#5dbb6b" : "#e06060",
                      }}>
                        {pctChange >= 0 ? "↑" : "↓"} {Math.abs(pctChange)}%
                      </span>
                    )}
                  </div>
                </div>
              </div>

              {/* Divider */}
              <div style={{ height: 1, backgroundColor: t.divider, marginBottom: 24 }} />

              {/* Stats row */}
              <div style={{ display: "flex", gap: 0, marginBottom: 24 }}>
                {[
                  { value: String(summaryCount), label: summaryCount === 1 ? "ACTIVITY" : "ACTIVITIES" },
                  { value: summarySeconds > 0 ? formatDuration(summarySeconds) : "—", label: "TIME" },
                  { value: summaryKm > 0 && summarySeconds > 0 ? formatPace(summarySeconds, summaryKm) : "—", label: "AVG PACE" },
                ].map((stat, i) => (
                  <div key={i} style={{ flex: 1 }}>
                    <div style={{ fontSize: 22, fontWeight: 600, letterSpacing: "-0.02em", color: t.text, marginBottom: 3 }}>
                      {stat.value}
                    </div>
                    <div style={{ fontSize: 9, color: t.label, letterSpacing: "0.12em" }}>
                      {stat.label}
                    </div>
                  </div>
                ))}
              </div>

              {/* Divider */}
              <div style={{ height: 1, backgroundColor: t.divider, marginBottom: 20 }} />

              {/* Longest */}
              {summaryLongest && (
                <div style={{ marginBottom: 20 }}>
                  <div style={{ fontSize: 9, color: t.label, letterSpacing: "0.12em", marginBottom: 5 }}>LONGEST</div>
                  <div style={{ display: "flex", alignItems: "baseline", gap: 10 }}>
                    <span style={{ fontSize: 13, color: t.text, fontWeight: 500 }}>
                      {summaryLongest.name}
                    </span>
                    <span style={{ fontSize: 12, color: t.muted, fontFamily: "monospace" }}>
                      {summaryLongest.distanceKm} km
                    </span>
                  </div>
                </div>
              )}

              {/* Bar chart */}
              <div style={{ flex: 1, display: "flex", flexDirection: "column", justifyContent: "flex-end" }}>
                <div style={{ display: "flex", alignItems: "flex-end", gap: 2, height: 60 }}>
                  {summaryBars.map((bar, i) => (
                    <div key={i} style={{ flex: 1, display: "flex", flexDirection: "column", alignItems: "center", height: "100%" }}>
                      <div style={{ width: "100%", flex: 1, display: "flex", alignItems: "flex-end" }}>
                        <div
                          style={{
                            width: "100%",
                            height: bar.km > 0 ? `${Math.max((bar.km / maxBarKm) * 100, 8)}%` : "5px",
                            backgroundColor: bar.km > 0 ? t.barActive : t.barEmpty,
                            borderRadius: "1px 1px 0 0",
                          }}
                        />
                      </div>
                    </div>
                  ))}
                </div>
                {/* X-axis labels */}
                <div style={{ display: "flex", gap: 2, marginTop: 4 }}>
                  {summaryBars.map((bar, i) => (
                    <div key={i} style={{ flex: 1, textAlign: "center", fontSize: 8, color: t.label, fontFamily: "monospace" }}>
                      {bar.label}
                    </div>
                  ))}
                </div>
              </div>
            </div>
          </div>

          {/* Export button row */}
          <div className="flex justify-end px-6 pt-4 pb-5">
            <Button
              variant="outline"
              className="text-[12px] h-8 px-5 cursor-pointer"
              onClick={handleExportPng}
            >
              Export PNG
            </Button>
          </div>
        </DialogContent>
      </Dialog>
    </AppShell>
  );
}
