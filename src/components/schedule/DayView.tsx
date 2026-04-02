import { useMemo } from "react";
import { useScheduleStore } from "@/stores/scheduleStore";
import { useProjectStore } from "@/stores/projectStore";
import { TimelineEvent } from "@/components/shared/TimelineEvent";
import { formatTime } from "@/lib/utils";

interface DayViewProps {
  dateStr: string;
}

export function DayView({ dateStr }: DayViewProps) {
  const allEvents = useScheduleStore((s) => s.events);
  const clients = useProjectStore((s) => s.clients);

  const events = useMemo(
    () =>
      allEvents
        .filter((e) => e.startTime.split("T")[0] === dateStr)
        .sort((a, b) => a.startTime.localeCompare(b.startTime)),
    [allEvents, dateStr]
  );
  const getClientById = (id: string) => clients.find((c) => c.id === id);

  const mm = events
    .filter((e) => e.type === "meeting")
    .reduce((s, e) => s + e.duration, 0);
  const fm = events
    .filter((e) => e.type === "focus")
    .reduce((s, e) => s + e.duration, 0);
  const total = mm + fm;

  const clientMap = new Map<string, { name: string; minutes: number }>();
  events.forEach((e) => {
    if (e.clientId) {
      const existing = clientMap.get(e.clientId);
      if (existing) {
        existing.minutes += e.duration;
      } else {
        const client = getClientById(e.clientId);
        clientMap.set(e.clientId, {
          name: client?.name || "Unknown",
          minutes: e.duration,
        });
      }
    }
  });
  const clientAlloc = Array.from(clientMap.values()).sort(
    (a, b) => b.minutes - a.minutes
  );
  const maxClientMin = Math.max(...clientAlloc.map((c) => c.minutes), 1);

  const fmtH = (min: number) => `${(min / 60).toFixed(2)} h`;

  return (
    <div className="grid grid-cols-[1fr_300px] gap-6">
      <div className="space-y-5">
        <div className="grid grid-cols-3 gap-6 pb-4 border-b border-border">
          <div>
            <div className="text-[10px] text-muted-foreground uppercase tracking-[0.06em] mb-1">Meetings</div>
            <div className="text-[18px] font-medium tabular-nums">{fmtH(mm)}</div>
          </div>
          <div>
            <div className="text-[10px] text-muted-foreground uppercase tracking-[0.06em] mb-1">Focus</div>
            <div className="text-[18px] font-medium tabular-nums">{fmtH(fm)}</div>
          </div>
          <div>
            <div className="text-[10px] text-muted-foreground uppercase tracking-[0.06em] mb-1">Total</div>
            <div className="text-[18px] font-medium tabular-nums">{fmtH(total)}</div>
          </div>
        </div>

        {total > 0 && (
          <div className="flex h-1 bg-white/[0.06]">
            <div className="bg-foreground/50" style={{ width: `${(mm / total) * 100}%` }} />
            <div className="bg-foreground/20" style={{ width: `${(fm / total) * 100}%` }} />
          </div>
        )}

        <div>
          <div className="text-[10px] text-muted-foreground uppercase tracking-[0.06em] mb-2">Clients</div>
          {clientAlloc.map((c) => (
            <div key={c.name} className="flex items-center gap-3 py-1.5">
              <span className="text-[11px] text-foreground flex-1">{c.name}</span>
              <div className="w-24 h-1 bg-white/[0.06] shrink-0">
                <div
                  className="h-full bg-foreground/40"
                  style={{ width: `${(c.minutes / maxClientMin) * 100}%` }}
                />
              </div>
              <span className="text-[10px] text-muted-foreground font-mono tabular-nums w-10 text-right">{c.minutes}m</span>
            </div>
          ))}
          {clientAlloc.length === 0 && (
            <p className="text-[10px] text-muted-foreground">No client events</p>
          )}
        </div>
      </div>

      <div className="border-l border-border pl-5">
        <div className="text-[10px] text-muted-foreground uppercase tracking-[0.06em] mb-3">Timeline</div>
        {events.map((ev, i) => {
          const client = ev.clientId ? getClientById(ev.clientId) : undefined;
          return (
            <TimelineEvent
              key={ev.id}
              event={ev}
              clientName={client?.name}
              isLast={i === events.length - 1}
            />
          );
        })}
        {events.length === 0 && (
          <p className="text-[10px] text-muted-foreground py-4">No events</p>
        )}
      </div>
    </div>
  );
}
