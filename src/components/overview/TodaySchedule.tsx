import { useMemo } from "react";
import { useScheduleStore } from "@/stores/scheduleStore";
import { useProjectStore } from "@/stores/projectStore";
import { formatTime, getToday } from "@/lib/utils";

export function TodaySchedule() {
  const allEvents = useScheduleStore((s) => s.events);
  const clients = useProjectStore((s) => s.clients);

  const today = getToday();
  const events = useMemo(
    () =>
      allEvents
        .filter((e) => e.startTime.split("T")[0] === today)
        .sort((a, b) => a.startTime.localeCompare(b.startTime)),
    [allEvents, today]
  );
  const getClientById = (id: string) => clients.find((c) => c.id === id);

  const meetingMin = events
    .filter((e) => e.type === "meeting")
    .reduce((s, e) => s + e.duration, 0);
  const focusMin = events
    .filter((e) => e.type === "focus")
    .reduce((s, e) => s + e.duration, 0);

  const fmtH = (min: number) => `${(min / 60).toFixed(2)} h`;

  return (
    <div>
      <div className="text-[12px] uppercase tracking-[0.06em] text-muted-foreground mb-3">
        Today
      </div>

      <div className="flex gap-6 mb-4">
        <div>
          <div className="text-[22px] font-medium tabular-nums">{fmtH(meetingMin)}</div>
          <div className="text-[12px] text-muted-foreground">Meetings</div>
        </div>
        <div>
          <div className="text-[22px] font-medium tabular-nums">{fmtH(focusMin)}</div>
          <div className="text-[12px] text-muted-foreground">Focus</div>
        </div>
      </div>

      {events.slice(0, 6).map((ev) => {
        const clientName = ev.clientId
          ? getClientById(ev.clientId)?.name
          : undefined;
        return (
          <div
            key={ev.id}
            className="flex items-baseline gap-3 py-2 border-b border-border last:border-0"
          >
            <span className="text-[11px] text-muted-foreground font-mono tabular-nums w-12 shrink-0">
              {formatTime(ev.startTime)}
            </span>
            <span className="text-[13px] text-foreground flex-1 truncate">
              {ev.title}
            </span>
            <span className="text-[11px] text-muted-foreground tabular-nums shrink-0">
              {ev.duration}m
            </span>
            {clientName && (
              <span className="text-[11px] text-foreground/40 shrink-0">
                {clientName}
              </span>
            )}
          </div>
        );
      })}
      {events.length === 0 && (
        <p className="text-[12px] text-muted-foreground py-4">
          No events today
        </p>
      )}
    </div>
  );
}
