import { useState } from "react";
import { AppShell } from "@/components/layout/AppShell";
import { DayView } from "@/components/schedule/DayView";
import { WeekView } from "@/components/schedule/WeekView";
import { MonthView } from "@/components/schedule/MonthView";
import { WeeklyMetrics } from "@/components/schedule/WeeklyMetrics";
import { Button } from "@/components/ui/button";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger, DialogFooter } from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { DatePicker } from "@/components/ui/date-picker";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { useScheduleStore } from "@/stores/scheduleStore";
import { useProjectStore } from "@/stores/projectStore";
import { addDays, getToday } from "@/lib/utils";
import { toast } from "sonner";

type ViewType = "day" | "week" | "month";

export default function SchedulePage() {
  const [view, setView] = useState<ViewType>("day");
  const [dayOffset, setDayOffset] = useState(0);
  const [open, setOpen] = useState(false);
  const clients = useProjectStore((s) => s.clients);
  const addEvent = useScheduleStore((s) => s.addEvent);

  const [form, setForm] = useState({
    title: "",
    date: getToday(),
    time: "09:00",
    duration: "60",
    type: "meeting" as "meeting" | "focus" | "personal",
    clientId: "",
  });

  const dateStr = addDays(getToday(), dayOffset);

  function handleCreate() {
    if (!form.title.trim()) return;
    const startTime = new Date(`${form.date}T${form.time}:00`).toISOString();
    addEvent({
      title: form.title.trim(),
      startTime,
      duration: Number(form.duration) || 60,
      type: form.type,
      clientId: form.clientId || null,
      projectId: null,
      googleEventId: null,
    });
    toast.success("Event created");
    setForm({ title: "", date: getToday(), time: "09:00", duration: "60", type: "meeting", clientId: "" });
    setOpen(false);
  }

  return (
    <AppShell
      title="Schedule"
      actions={
        <>
          <Button variant="outline" size="sm" disabled className="text-[11px]">
            Sync
          </Button>
          <Dialog open={open} onOpenChange={setOpen}>
            <DialogTrigger render={<Button size="sm" />}>
              + New
            </DialogTrigger>
            <DialogContent>
              <DialogHeader>
                <DialogTitle>New event</DialogTitle>
              </DialogHeader>
              <div className="grid gap-3 py-4">
                <Input placeholder="Title" value={form.title} onChange={(e) => setForm((f) => ({ ...f, title: e.target.value }))} />
                <DatePicker value={form.date} onChange={(v) => setForm((f) => ({ ...f, date: v }))} placeholder="Date" />
                <Input type="time" value={form.time} onChange={(e) => setForm((f) => ({ ...f, time: e.target.value }))} />
                <Input placeholder="Duration (min)" type="number" value={form.duration} onChange={(e) => setForm((f) => ({ ...f, duration: e.target.value }))} />
                <Select value={form.type} onValueChange={(v) => setForm((f) => ({ ...f, type: (v ?? "meeting") as "meeting" | "focus" | "personal" }))}>
                  <SelectTrigger><SelectValue /></SelectTrigger>
                  <SelectContent>
                    <SelectItem value="meeting">Meeting</SelectItem>
                    <SelectItem value="focus">Focus</SelectItem>
                    <SelectItem value="personal">Personal</SelectItem>
                  </SelectContent>
                </Select>
                <Select value={form.clientId} onValueChange={(v) => setForm((f) => ({ ...f, clientId: v ?? "" }))}>
                  <SelectTrigger><SelectValue placeholder="Client (optional)" /></SelectTrigger>
                  <SelectContent>
                    <SelectItem value="none">None</SelectItem>
                    {clients.map((c) => (
                      <SelectItem key={c.id} value={c.id}>{c.name}</SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
              <DialogFooter>
                <Button onClick={handleCreate}>Create</Button>
              </DialogFooter>
            </DialogContent>
          </Dialog>
        </>
      }
    >
      <div className="flex gap-4 mb-4 border-b border-border pb-2">
        {(["day", "week", "month"] as ViewType[]).map((v) => (
          <button
            key={v}
            onClick={() => setView(v)}
            className={`text-[11px] cursor-pointer transition-opacity ${
              view === v
                ? "text-foreground"
                : "text-muted-foreground hover:text-foreground"
            }`}
          >
            {v.charAt(0).toUpperCase() + v.slice(1)}
          </button>
        ))}
      </div>

      {view === "day" && (
        <>
          <div className="flex gap-4 mb-4">
            {["Today", "Tomorrow"].map((label, i) => (
              <button
                key={label}
                onClick={() => setDayOffset(i)}
                className={`text-[11px] cursor-pointer transition-opacity ${
                  dayOffset === i
                    ? "text-foreground"
                    : "text-muted-foreground hover:text-foreground"
                }`}
              >
                {label}
              </button>
            ))}
          </div>
          <DayView dateStr={dateStr} />
        </>
      )}
      {view === "week" && <WeekView />}
      {view === "month" && <MonthView />}

      <WeeklyMetrics />
    </AppShell>
  );
}
