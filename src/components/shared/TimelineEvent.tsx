import { formatTime } from "@/lib/utils";
import type { CalendarEvent } from "@/lib/types";

interface TimelineEventProps {
  event: CalendarEvent;
  clientName?: string;
  isLast?: boolean;
}

export function TimelineEvent({ event, clientName, isLast }: TimelineEventProps) {
  return (
    <div className="flex gap-2.5">
      <div className="flex flex-col items-center w-3">
        <div className="w-1.5 h-1.5 rounded-full shrink-0 mt-1.5 bg-foreground/30" />
        {!isLast && (
          <div className="w-px flex-1 bg-border my-1" />
        )}
      </div>
      <div className="flex-1 pb-3">
        <div className="text-[12px] text-foreground">
          {event.title}
        </div>
        <div className="text-[10px] text-muted-foreground mt-0.5">
          {formatTime(event.startTime)} &middot; {event.duration}m
          {clientName && (
            <span className="text-foreground/50 ml-1">{clientName}</span>
          )}
        </div>
      </div>
    </div>
  );
}
