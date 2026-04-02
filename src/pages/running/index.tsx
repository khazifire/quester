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
import { formatDate, formatDuration, formatPace, parseDuration, getToday } from "@/lib/utils";
import { RUN_COST_TYPES, RUN_COST_LABELS } from "@/lib/constants";
import type { Run, RunCost } from "@/lib/types";
import { toast } from "sonner";

export default function RunLogPage() {
  const runs = useRunningStore((s) => s.runs);
  const events = useRunningStore((s) => s.events);
  const addRun = useRunningStore((s) => s.addRun);
  const updateRun = useRunningStore((s) => s.updateRun);
  const deleteRun = useRunningStore((s) => s.deleteRun);
  const getRunCosts = useRunningStore((s) => s.getRunCosts);
  const addCost = useRunningStore((s) => s.addCost);
  const deleteCost = useRunningStore((s) => s.deleteCost);
  const mainCurrency = useCurrencyStore((s) => s.mainCurrency);
  const wallets = useCurrencyStore((s) => s.wallets);
  const convert = useCurrencyStore((s) => s.convert);

  const sorted = [...runs].sort(
    (a, b) => b.date.localeCompare(a.date) || b.createdAt - a.createdAt
  );

  // Add dialog
  const [addOpen, setAddOpen] = useState(false);
  const [addForm, setAddForm] = useState({
    name: "",
    date: getToday(),
    distanceKm: "",
    duration: "",
    eventId: "",
  });

  function handleAdd() {
    const dist = Number(addForm.distanceKm);
    const dur = parseDuration(addForm.duration);
    if (!addForm.name.trim() || !dist || dur === null) {
      toast.error("Fill in name, distance, and time (MM:SS or H:MM:SS)");
      return;
    }
    addRun({
      name: addForm.name.trim(),
      date: addForm.date,
      distanceKm: dist,
      durationSeconds: dur,
      eventId: addForm.eventId || null,
    });
    toast.success("Run logged");
    setAddForm({ name: "", date: getToday(), distanceKm: "", duration: "", eventId: "" });
    setAddOpen(false);
  }

  // Edit dialog
  const [editOpen, setEditOpen] = useState(false);
  const [editId, setEditId] = useState<string | null>(null);
  const [editForm, setEditForm] = useState({
    name: "",
    date: "",
    distanceKm: "",
    duration: "",
    eventId: "",
  });

  function openEdit(run: Run) {
    setEditId(run.id);
    setEditForm({
      name: run.name,
      date: run.date,
      distanceKm: String(run.distanceKm),
      duration: formatDuration(run.durationSeconds),
      eventId: run.eventId || "",
    });
    setEditOpen(true);
  }

  function handleEdit() {
    if (!editId) return;
    const dist = Number(editForm.distanceKm);
    const dur = parseDuration(editForm.duration);
    if (!editForm.name.trim() || !dist || dur === null) return;
    updateRun(editId, {
      name: editForm.name.trim(),
      date: editForm.date,
      distanceKm: dist,
      durationSeconds: dur,
      eventId: editForm.eventId || null,
    });
    toast.success("Run updated");
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
    deleteRun(deleteId);
    toast.success("Run deleted");
    setDeleteOpen(false);
  }

  // Detail / costs dialog
  const [detailRun, setDetailRun] = useState<Run | null>(null);
  const [costForm, setCostForm] = useState({
    type: "travel" as RunCost["type"],
    name: "",
    amount: "",
    currency: mainCurrency,
  });

  function openDetail(run: Run) {
    setDetailRun(run);
    setCostForm({ type: "travel", name: "", amount: "", currency: mainCurrency });
  }

  function handleAddCost() {
    if (!detailRun || !costForm.name.trim() || !Number(costForm.amount)) return;
    addCost({
      runId: detailRun.id,
      eventId: null,
      type: costForm.type,
      name: costForm.name.trim(),
      amount: Number(costForm.amount),
      currency: costForm.currency,
    });
    setCostForm({ type: "travel", name: "", amount: "", currency: mainCurrency });
    toast.success("Cost added");
  }

  const detailCosts = detailRun ? getRunCosts(detailRun.id) : [];
  const detailTotal = detailCosts.reduce((s, c) => s + convert(c.amount, c.currency), 0);

  return (
    <AppShell
      title="Running"
      actions={
        <Button
          variant="outline"
          className="text-[12px] h-7 px-3 cursor-pointer"
          onClick={() => {
            setAddForm({ name: "", date: getToday(), distanceKm: "", duration: "", eventId: "" });
            setAddOpen(true);
          }}
        >
          + Log run
        </Button>
      }
    >
      <RunningNav />

      <div className="flex justify-between items-baseline mb-4">
        <span className="text-[12px] text-muted-foreground uppercase tracking-[0.06em]">
          Run log
        </span>
        <span className="text-[12px] text-muted-foreground">
          {runs.length} run{runs.length !== 1 ? "s" : ""}
        </span>
      </div>

      <div className="grid grid-cols-[1fr_70px_80px_80px_80px_70px] gap-3 px-0 py-2.5 text-[11px] uppercase tracking-[0.06em] text-muted-foreground border-b border-border">
        <span>Name</span>
        <span>Distance</span>
        <span>Time</span>
        <span>Pace</span>
        <span>Date</span>
        <span className="text-right">Actions</span>
      </div>

      {sorted.map((r) => (
        <div
          key={r.id}
          className="grid grid-cols-[1fr_70px_80px_80px_80px_70px] gap-3 py-2.5 text-[13px] border-b border-border last:border-0 hover:bg-white/[0.02] transition-colors"
        >
          <button
            className="text-foreground truncate text-left hover:underline cursor-pointer"
            onClick={() => openDetail(r)}
          >
            {r.name}
          </button>
          <span className="font-mono tabular-nums text-[12px]">
            {r.distanceKm} km
          </span>
          <span className="font-mono tabular-nums text-[12px] text-muted-foreground">
            {formatDuration(r.durationSeconds)}
          </span>
          <span className="font-mono tabular-nums text-[12px] text-muted-foreground">
            {formatPace(r.durationSeconds, r.distanceKm)}
          </span>
          <span className="text-[11px] text-muted-foreground font-mono tabular-nums">
            {formatDate(r.date)}
          </span>
          <span className="flex items-center justify-end gap-2">
            <button
              className="text-[11px] text-muted-foreground hover:text-foreground cursor-pointer"
              onClick={() => openEdit(r)}
            >
              [edit]
            </button>
            <button
              className="text-[11px] text-muted-foreground hover:text-destructive cursor-pointer"
              onClick={() => confirmDelete(r.id)}
            >
              [del]
            </button>
          </span>
        </div>
      ))}

      {sorted.length === 0 && (
        <p className="text-[12px] text-muted-foreground text-center py-8">
          No runs logged yet
        </p>
      )}

      {/* Add Run Dialog */}
      <Dialog open={addOpen} onOpenChange={setAddOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Log a run</DialogTitle>
          </DialogHeader>
          <div className="grid gap-3 py-4">
            <Input
              placeholder="Name (e.g. Morning 5K)"
              value={addForm.name}
              onChange={(e) => setAddForm((f) => ({ ...f, name: e.target.value }))}
            />
            <Input
              type="date"
              value={addForm.date}
              onChange={(e) => setAddForm((f) => ({ ...f, date: e.target.value }))}
            />
            <div className="flex gap-2">
              <Input
                placeholder="Distance (km)"
                type="number"
                step="0.01"
                value={addForm.distanceKm}
                onChange={(e) => setAddForm((f) => ({ ...f, distanceKm: e.target.value }))}
                className="flex-1"
              />
              <Input
                placeholder="Time (MM:SS)"
                value={addForm.duration}
                onChange={(e) => setAddForm((f) => ({ ...f, duration: e.target.value }))}
                className="flex-1"
              />
            </div>
            {events.length > 0 && (
              <Select
                value={addForm.eventId}
                onValueChange={(v) => setAddForm((f) => ({ ...f, eventId: v === "none" ? "" : (v ?? "") }))}
              >
                <SelectTrigger>
                  <SelectValue placeholder="Link to event (optional)" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="none">No event</SelectItem>
                  {events.map((ev) => (
                    <SelectItem key={ev.id} value={ev.id}>
                      {ev.name}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            )}
          </div>
          <DialogFooter>
            <Button onClick={handleAdd}>Log run</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Edit Run Dialog */}
      <Dialog open={editOpen} onOpenChange={setEditOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Edit run</DialogTitle>
          </DialogHeader>
          <div className="grid gap-3 py-4">
            <Input
              placeholder="Name"
              value={editForm.name}
              onChange={(e) => setEditForm((f) => ({ ...f, name: e.target.value }))}
            />
            <Input
              type="date"
              value={editForm.date}
              onChange={(e) => setEditForm((f) => ({ ...f, date: e.target.value }))}
            />
            <div className="flex gap-2">
              <Input
                placeholder="Distance (km)"
                type="number"
                step="0.01"
                value={editForm.distanceKm}
                onChange={(e) => setEditForm((f) => ({ ...f, distanceKm: e.target.value }))}
                className="flex-1"
              />
              <Input
                placeholder="Time (MM:SS)"
                value={editForm.duration}
                onChange={(e) => setEditForm((f) => ({ ...f, duration: e.target.value }))}
                className="flex-1"
              />
            </div>
            {events.length > 0 && (
              <Select
                value={editForm.eventId}
                onValueChange={(v) => setEditForm((f) => ({ ...f, eventId: v === "none" ? "" : (v ?? "") }))}
              >
                <SelectTrigger>
                  <SelectValue placeholder="Link to event (optional)" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="none">No event</SelectItem>
                  {events.map((ev) => (
                    <SelectItem key={ev.id} value={ev.id}>
                      {ev.name}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            )}
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
            <DialogTitle>Delete run?</DialogTitle>
          </DialogHeader>
          <p className="text-[13px] text-muted-foreground py-4 px-6">
            This will also delete any associated costs. This action cannot be undone.
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
      <Dialog open={!!detailRun} onOpenChange={(open) => !open && setDetailRun(null)}>
        <DialogContent className="max-w-lg">
          <DialogHeader>
            <DialogTitle>{detailRun?.name}</DialogTitle>
          </DialogHeader>
          {detailRun && (
            <div className="space-y-4 py-2">
              <div className="grid grid-cols-4 gap-3 text-[13px]">
                <div>
                  <div className="text-[11px] text-muted-foreground uppercase mb-0.5">Distance</div>
                  <div className="font-mono tabular-nums">{detailRun.distanceKm} km</div>
                </div>
                <div>
                  <div className="text-[11px] text-muted-foreground uppercase mb-0.5">Time</div>
                  <div className="font-mono tabular-nums">{formatDuration(detailRun.durationSeconds)}</div>
                </div>
                <div>
                  <div className="text-[11px] text-muted-foreground uppercase mb-0.5">Pace</div>
                  <div className="font-mono tabular-nums">
                    {formatPace(detailRun.durationSeconds, detailRun.distanceKm)}
                  </div>
                </div>
                <div>
                  <div className="text-[11px] text-muted-foreground uppercase mb-0.5">Date</div>
                  <div className="font-mono tabular-nums">{formatDate(detailRun.date)}</div>
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
