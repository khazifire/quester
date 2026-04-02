import { useState } from "react";
import { AppShell } from "@/components/layout/AppShell";
import { RunningNav } from "@/components/layout/RunningNav";
import { MaskedAmount } from "@/components/shared/MaskedAmount";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { useRunningStore } from "@/stores/runningStore";
import { useCurrencyStore } from "@/stores/currencyStore";
import { formatDate, getToday } from "@/lib/utils";
import { RUN_COST_TYPES, RUN_COST_LABELS } from "@/lib/constants";
import type { RunningEvent, RunCost } from "@/lib/types";
import { toast } from "sonner";

export default function EventsPage() {
  const events = useRunningStore((s) => s.events);
  const addEvent = useRunningStore((s) => s.addEvent);
  const updateEvent = useRunningStore((s) => s.updateEvent);
  const deleteEvent = useRunningStore((s) => s.deleteEvent);
  const getEventCosts = useRunningStore((s) => s.getEventCosts);
  const addCost = useRunningStore((s) => s.addCost);
  const deleteCost = useRunningStore((s) => s.deleteCost);
  const mainCurrency = useCurrencyStore((s) => s.mainCurrency);
  const wallets = useCurrencyStore((s) => s.wallets);
  const convert = useCurrencyStore((s) => s.convert);

  const upcoming = [...events]
    .filter((e) => e.status === "upcoming")
    .sort((a, b) => a.date.localeCompare(b.date));
  const past = [...events]
    .filter((e) => e.status !== "upcoming")
    .sort((a, b) => b.date.localeCompare(a.date));

  // Add dialog
  const [addOpen, setAddOpen] = useState(false);
  const [addForm, setAddForm] = useState({
    name: "",
    location: "",
    date: getToday(),
    distanceKm: "",
    entryFee: "",
    currency: mainCurrency,
  });

  function handleAdd() {
    if (!addForm.name.trim() || !addForm.date) {
      toast.error("Name and date are required");
      return;
    }
    addEvent({
      name: addForm.name.trim(),
      location: addForm.location.trim(),
      date: addForm.date,
      distanceKm: Number(addForm.distanceKm) || 0,
      entryFee: Number(addForm.entryFee) || 0,
      currency: addForm.currency,
      status: "upcoming",
    });
    toast.success("Event added");
    setAddForm({ name: "", location: "", date: getToday(), distanceKm: "", entryFee: "", currency: mainCurrency });
    setAddOpen(false);
  }

  // Edit dialog
  const [editOpen, setEditOpen] = useState(false);
  const [editId, setEditId] = useState<string | null>(null);
  const [editForm, setEditForm] = useState({
    name: "",
    location: "",
    date: "",
    distanceKm: "",
    status: "upcoming" as RunningEvent["status"],
  });

  function openEdit(ev: RunningEvent) {
    setEditId(ev.id);
    setEditForm({
      name: ev.name,
      location: ev.location,
      date: ev.date,
      distanceKm: String(ev.distanceKm),
      status: ev.status,
    });
    setEditOpen(true);
  }

  function handleEdit() {
    if (!editId || !editForm.name.trim()) return;
    updateEvent(editId, {
      name: editForm.name.trim(),
      location: editForm.location.trim(),
      date: editForm.date,
      distanceKm: Number(editForm.distanceKm) || 0,
      status: editForm.status,
    });
    toast.success("Event updated");
    setEditOpen(false);
  }

  // Delete dialog
  const [deleteOpen, setDeleteOpen] = useState(false);
  const [deleteId, setDeleteId] = useState<string | null>(null);

  function confirmDelete(id: string) {
    setDeleteId(id);
    setDeleteOpen(true);
  }

  function handleDelete() {
    if (!deleteId) return;
    deleteEvent(deleteId);
    toast.success("Event deleted");
    setDeleteOpen(false);
  }

  // Detail / costs dialog
  const [detailEvent, setDetailEvent] = useState<RunningEvent | null>(null);
  const [costForm, setCostForm] = useState({
    type: "travel" as RunCost["type"],
    name: "",
    amount: "",
    currency: mainCurrency,
  });

  function openDetail(ev: RunningEvent) {
    setDetailEvent(ev);
    setCostForm({ type: "travel", name: "", amount: "", currency: mainCurrency });
  }

  function handleAddCost() {
    if (!detailEvent || !costForm.name.trim() || !Number(costForm.amount)) return;
    addCost({
      runId: null,
      eventId: detailEvent.id,
      type: costForm.type,
      name: costForm.name.trim(),
      amount: Number(costForm.amount),
      currency: costForm.currency,
    });
    setCostForm({ type: "travel", name: "", amount: "", currency: mainCurrency });
    toast.success("Cost added");
  }

  const detailCosts = detailEvent ? getEventCosts(detailEvent.id) : [];
  const detailTotal = detailCosts.reduce((s, c) => s + convert(c.amount, c.currency), 0);

  function renderEventRow(ev: RunningEvent) {
    return (
      <div
        key={ev.id}
        className="grid grid-cols-[1fr_100px_70px_80px_80px_70px] gap-3 py-2.5 text-[13px] border-b border-border last:border-0 hover:bg-white/[0.02] transition-colors"
      >
        <button
          className="text-foreground truncate text-left hover:underline cursor-pointer"
          onClick={() => openDetail(ev)}
        >
          {ev.name}
        </button>
        <span className="text-[12px] text-muted-foreground truncate">{ev.location || "—"}</span>
        <span className="font-mono tabular-nums text-[12px]">
          {ev.distanceKm > 0 ? `${ev.distanceKm} km` : "—"}
        </span>
        <span className="text-[11px] text-muted-foreground font-mono tabular-nums">
          {formatDate(ev.date)}
        </span>
        <span className="font-mono tabular-nums text-[12px] text-right">
          {ev.entryFee > 0 ? <MaskedAmount value={ev.entryFee} currency={ev.currency} /> : "—"}
        </span>
        <span className="flex items-center justify-end gap-2">
          <button
            className="text-[11px] text-muted-foreground hover:text-foreground cursor-pointer"
            onClick={() => openEdit(ev)}
          >
            [edit]
          </button>
          <button
            className="text-[11px] text-muted-foreground hover:text-destructive cursor-pointer"
            onClick={() => confirmDelete(ev.id)}
          >
            [del]
          </button>
        </span>
      </div>
    );
  }

  return (
    <AppShell
      title="Running"
      actions={
        <Button
          variant="outline"
          className="text-[12px] h-7 px-3 cursor-pointer"
          onClick={() => {
            setAddForm({ name: "", location: "", date: getToday(), distanceKm: "", entryFee: "", currency: mainCurrency });
            setAddOpen(true);
          }}
        >
          + Add event
        </Button>
      }
    >
      <RunningNav />

      {/* Upcoming */}
      <div className="mb-6">
        <span className="text-[12px] text-muted-foreground uppercase tracking-[0.06em] mb-3 block">
          Upcoming
        </span>

        <div className="grid grid-cols-[1fr_100px_70px_80px_80px_70px] gap-3 px-0 py-2.5 text-[11px] uppercase tracking-[0.06em] text-muted-foreground border-b border-border">
          <span>Name</span>
          <span>Location</span>
          <span>Distance</span>
          <span>Date</span>
          <span className="text-right">Entry fee</span>
          <span className="text-right">Actions</span>
        </div>

        {upcoming.map(renderEventRow)}
        {upcoming.length === 0 && (
          <p className="text-[12px] text-muted-foreground text-center py-6">
            No upcoming events
          </p>
        )}
      </div>

      {/* Past */}
      {past.length > 0 && (
        <div>
          <span className="text-[12px] text-muted-foreground uppercase tracking-[0.06em] mb-3 block">
            Past events
          </span>

          <div className="grid grid-cols-[1fr_100px_70px_80px_80px_70px] gap-3 px-0 py-2.5 text-[11px] uppercase tracking-[0.06em] text-muted-foreground border-b border-border">
            <span>Name</span>
            <span>Location</span>
            <span>Distance</span>
            <span>Date</span>
            <span className="text-right">Entry fee</span>
            <span className="text-right">Actions</span>
          </div>

          {past.map(renderEventRow)}
        </div>
      )}

      {/* Add Event Dialog */}
      <Dialog open={addOpen} onOpenChange={setAddOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Add running event</DialogTitle>
          </DialogHeader>
          <div className="grid gap-3 py-4">
            <Input
              placeholder="Event name"
              value={addForm.name}
              onChange={(e) => setAddForm((f) => ({ ...f, name: e.target.value }))}
            />
            <Input
              placeholder="Location"
              value={addForm.location}
              onChange={(e) => setAddForm((f) => ({ ...f, location: e.target.value }))}
            />
            <div className="flex gap-2">
              <Input
                type="date"
                value={addForm.date}
                onChange={(e) => setAddForm((f) => ({ ...f, date: e.target.value }))}
                className="flex-1"
              />
              <Input
                placeholder="Distance (km)"
                type="number"
                step="0.01"
                value={addForm.distanceKm}
                onChange={(e) => setAddForm((f) => ({ ...f, distanceKm: e.target.value }))}
                className="flex-1"
              />
            </div>
            <div className="flex gap-2">
              <Input
                placeholder="Entry fee"
                type="number"
                value={addForm.entryFee}
                onChange={(e) => setAddForm((f) => ({ ...f, entryFee: e.target.value }))}
                className="flex-1"
              />
              <Select
                value={addForm.currency}
                onValueChange={(v) => setAddForm((f) => ({ ...f, currency: v ?? mainCurrency }))}
              >
                <SelectTrigger className="w-24">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  {wallets.map((w) => (
                    <SelectItem key={w.currency} value={w.currency}>
                      {w.currency}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          </div>
          <DialogFooter>
            <Button onClick={handleAdd}>Add event</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Edit Event Dialog */}
      <Dialog open={editOpen} onOpenChange={setEditOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Edit event</DialogTitle>
          </DialogHeader>
          <div className="grid gap-3 py-4">
            <Input
              placeholder="Event name"
              value={editForm.name}
              onChange={(e) => setEditForm((f) => ({ ...f, name: e.target.value }))}
            />
            <Input
              placeholder="Location"
              value={editForm.location}
              onChange={(e) => setEditForm((f) => ({ ...f, location: e.target.value }))}
            />
            <div className="flex gap-2">
              <Input
                type="date"
                value={editForm.date}
                onChange={(e) => setEditForm((f) => ({ ...f, date: e.target.value }))}
                className="flex-1"
              />
              <Input
                placeholder="Distance (km)"
                type="number"
                step="0.01"
                value={editForm.distanceKm}
                onChange={(e) => setEditForm((f) => ({ ...f, distanceKm: e.target.value }))}
                className="flex-1"
              />
            </div>
            <Select
              value={editForm.status}
              onValueChange={(v) => setEditForm((f) => ({ ...f, status: v as RunningEvent["status"] }))}
            >
              <SelectTrigger>
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="upcoming">Upcoming</SelectItem>
                <SelectItem value="completed">Completed</SelectItem>
                <SelectItem value="cancelled">Cancelled</SelectItem>
              </SelectContent>
            </Select>
          </div>
          <DialogFooter>
            <Button onClick={handleEdit}>Save</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Delete Dialog */}
      <Dialog open={deleteOpen} onOpenChange={setDeleteOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Delete event?</DialogTitle>
          </DialogHeader>
          <p className="text-[13px] text-muted-foreground py-4 px-6">
            This will also delete associated costs and expenses. This action cannot be undone.
          </p>
          <DialogFooter>
            <Button variant="outline" onClick={() => setDeleteOpen(false)}>
              Cancel
            </Button>
            <Button
              onClick={handleDelete}
              className="!bg-destructive !text-destructive-foreground !border-destructive"
            >
              Delete
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Detail / Costs Dialog */}
      <Dialog open={!!detailEvent} onOpenChange={(open) => !open && setDetailEvent(null)}>
        <DialogContent className="max-w-lg">
          <DialogHeader>
            <DialogTitle>{detailEvent?.name}</DialogTitle>
          </DialogHeader>
          {detailEvent && (
            <div className="space-y-4 py-2">
              <div className="grid grid-cols-4 gap-3 text-[13px]">
                <div>
                  <div className="text-[11px] text-muted-foreground uppercase mb-0.5">Location</div>
                  <div>{detailEvent.location || "—"}</div>
                </div>
                <div>
                  <div className="text-[11px] text-muted-foreground uppercase mb-0.5">Distance</div>
                  <div className="font-mono tabular-nums">
                    {detailEvent.distanceKm > 0 ? `${detailEvent.distanceKm} km` : "—"}
                  </div>
                </div>
                <div>
                  <div className="text-[11px] text-muted-foreground uppercase mb-0.5">Date</div>
                  <div className="font-mono tabular-nums">{formatDate(detailEvent.date)}</div>
                </div>
                <div>
                  <div className="text-[11px] text-muted-foreground uppercase mb-0.5">Status</div>
                  <div className="capitalize">{detailEvent.status}</div>
                </div>
              </div>

              <div className="border-t border-border pt-3">
                <div className="flex justify-between items-baseline mb-3">
                  <span className="text-[12px] text-muted-foreground uppercase tracking-[0.06em]">
                    Costs
                  </span>
                  {detailTotal > 0 && (
                    <span className="text-[12px] font-mono tabular-nums">
                      Total: <MaskedAmount value={Math.round(detailTotal)} />
                    </span>
                  )}
                </div>

                {detailCosts.map((c) => (
                  <div
                    key={c.id}
                    className="flex justify-between items-center py-1.5 text-[13px] border-b border-border last:border-0"
                  >
                    <div className="flex items-center gap-2">
                      <span className="text-[10px] uppercase text-muted-foreground bg-white/5 px-1.5 py-0.5 rounded">
                        {RUN_COST_LABELS[c.type]}
                      </span>
                      <span>{c.name}</span>
                    </div>
                    <div className="flex items-center gap-2">
                      <span className="font-mono tabular-nums text-[12px]">
                        <MaskedAmount value={c.amount} currency={c.currency} />
                      </span>
                      <button
                        className="text-[11px] text-muted-foreground hover:text-destructive cursor-pointer"
                        onClick={() => deleteCost(c.id)}
                      >
                        [del]
                      </button>
                    </div>
                  </div>
                ))}

                {detailCosts.length === 0 && (
                  <p className="text-[11px] text-muted-foreground mb-3">No costs added</p>
                )}

                <div className="flex gap-2 mt-3">
                  <Select
                    value={costForm.type}
                    onValueChange={(v) => setCostForm((f) => ({ ...f, type: v as RunCost["type"] }))}
                  >
                    <SelectTrigger className="w-32">
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      {RUN_COST_TYPES.filter((t) => t !== "entry").map((t) => (
                        <SelectItem key={t} value={t}>
                          {RUN_COST_LABELS[t]}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                  <Input
                    placeholder="Name"
                    value={costForm.name}
                    onChange={(e) => setCostForm((f) => ({ ...f, name: e.target.value }))}
                    className="flex-1"
                  />
                  <Input
                    placeholder="Amount"
                    type="number"
                    value={costForm.amount}
                    onChange={(e) => setCostForm((f) => ({ ...f, amount: e.target.value }))}
                    className="w-24"
                  />
                  <Select
                    value={costForm.currency}
                    onValueChange={(v) => setCostForm((f) => ({ ...f, currency: v ?? mainCurrency }))}
                  >
                    <SelectTrigger className="w-20">
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      {wallets.map((w) => (
                        <SelectItem key={w.currency} value={w.currency}>
                          {w.currency}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                  <Button variant="outline" className="text-[12px] h-9 px-3" onClick={handleAddCost}>
                    Add
                  </Button>
                </div>
              </div>
            </div>
          )}
        </DialogContent>
      </Dialog>
    </AppShell>
  );
}
