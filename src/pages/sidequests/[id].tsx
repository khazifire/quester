import { useState, useMemo } from "react";
import { useRouter } from "next/router";
import { AppShell } from "@/components/layout/AppShell";
import { IssueTable } from "@/components/sidequests/IssueTable";
import { IssueKanban } from "@/components/sidequests/IssueKanban";
import { MaskedAmount } from "@/components/shared/MaskedAmount";
import { Button } from "@/components/ui/button";
import { AppDialog } from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { DatePicker } from "@/components/ui/date-picker";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { useProjectStore } from "@/stores/projectStore";
import { useFinanceStore } from "@/stores/financeStore";
import { useCurrencyStore } from "@/stores/currencyStore";
import type { Issue } from "@/lib/types";
import { toast } from "sonner";
import Link from "next/link";

type ViewMode = "table" | "kanban";

export default function ProjectDetailPage() {
  const router = useRouter();
  const { id } = router.query;

  const allProjects = useProjectStore((s) => s.projects);
  const allClients = useProjectStore((s) => s.clients);
  const allIssues = useProjectStore((s) => s.issues);
  const addIssue = useProjectStore((s) => s.addIssue);
  const updateIssue = useProjectStore((s) => s.updateIssue);
  const deleteIssue = useProjectStore((s) => s.deleteIssue);
  const invoices = useFinanceStore((s) => s.invoices);
  const convert = useCurrencyStore((s) => s.convert);

  const project = useMemo(
    () => allProjects.find((p) => p.id === id),
    [allProjects, id]
  );
  const client = useMemo(
    () => (project ? allClients.find((c) => c.id === project.clientId) : undefined),
    [allClients, project]
  );
  const issues = useMemo(
    () => allIssues.filter((i) => i.projectId === id),
    [allIssues, id]
  );

  const [viewMode, setViewMode] = useState<ViewMode>("table");

  // Add issue
  const [openDialog, setOpenDialog] = useState(false);
  const [issueForm, setIssueForm] = useState({
    title: "",
    description: "",
    priority: "medium" as Issue["priority"],
    deadline: "",
    reportedBy: "self" as Issue["reportedBy"],
  });

  // Edit issue
  const [editOpen, setEditOpen] = useState(false);
  const [editId, setEditId] = useState<string | null>(null);
  const [editForm, setEditForm] = useState({
    title: "",
    description: "",
    priority: "medium" as Issue["priority"],
    status: "todo" as Issue["status"],
    deadline: "",
    reportedBy: "self" as Issue["reportedBy"],
  });

  // Delete issue
  const [deleteOpen, setDeleteOpen] = useState(false);
  const [deleteId, setDeleteId] = useState<string | null>(null);

  if (!project) {
    return (
      <AppShell title="Projects">
        <p className="text-muted-foreground text-[11px]">Project not found</p>
      </AppShell>
    );
  }

  const openIssues = issues.filter((i) => i.status !== "done").length;
  const doneIssues = issues.filter((i) => i.status === "done").length;

  const totalInvoiced = useMemo(() => {
    if (!project) return 0;
    return invoices
      .filter((inv) => {
        const pids = inv.projectIds?.length ? inv.projectIds : inv.projectId ? [inv.projectId] : [];
        return inv.status === "paid" && pids.includes(project.id);
      })
      .reduce((sum, inv) => sum + convert(inv.amount, inv.currency), 0);
  }, [invoices, project, convert]);

  function handleAddIssue() {
    if (!issueForm.title.trim()) return;
    addIssue({
      projectId: project!.id,
      title: issueForm.title.trim(),
      description: issueForm.description,
      priority: issueForm.priority,
      status: "todo",
      deadline: issueForm.deadline || null,
      reportedBy: issueForm.reportedBy,
    });
    toast.success("Issue created");
    setIssueForm({ title: "", description: "", priority: "medium", deadline: "", reportedBy: "self" });
    setOpenDialog(false);
  }

  function openEditIssue(issue: Issue) {
    setEditId(issue.id);
    setEditForm({
      title: issue.title,
      description: issue.description,
      priority: issue.priority,
      status: issue.status,
      deadline: issue.deadline || "",
      reportedBy: issue.reportedBy,
    });
    setEditOpen(true);
  }

  function handleEditIssue() {
    if (!editId || !editForm.title.trim()) return;
    updateIssue(editId, {
      title: editForm.title.trim(),
      description: editForm.description,
      priority: editForm.priority,
      status: editForm.status,
      deadline: editForm.deadline || null,
      reportedBy: editForm.reportedBy,
    });
    toast.success("Issue updated");
    setEditOpen(false);
  }

  function confirmDeleteIssue(id: string) {
    setDeleteId(id);
    setDeleteOpen(true);
  }

  function handleDeleteIssue() {
    if (!deleteId) return;
    deleteIssue(deleteId);
    toast.success("Issue deleted");
    setDeleteOpen(false);
  }

  return (
    <AppShell title="Projects">
      <div className="mb-5">
        <Link
          href="/sidequests"
          className="text-[10px] text-muted-foreground hover:text-foreground transition-opacity"
        >
          &larr; Back
        </Link>
        <div className="flex items-baseline gap-3 mt-2">
          <h2 className="text-[15px] font-medium">{project.name}</h2>
          <span className="text-[10px] text-muted-foreground">{client?.name}</span>
          <span className="text-[10px] text-muted-foreground">&middot; {project.billingType}</span>
          <span className="text-[10px] text-muted-foreground capitalize">&middot; {project.status}</span>
        </div>
      </div>

      <div className="grid grid-cols-5 gap-6 pb-4 mb-4 border-b border-border">
        <div>
          <div className="text-[10px] text-muted-foreground uppercase tracking-[0.06em] mb-1">
            {project.billingType === "retainer" ? "Monthly" : "Value"}
          </div>
          <div className="text-[18px] font-medium tabular-nums"><MaskedAmount value={project.amount} currency={project.currency} /></div>
          <div className="text-[9px] text-muted-foreground mt-0.5 capitalize">{project.billingType}</div>
        </div>
        <div>
          <div className="text-[10px] text-muted-foreground uppercase tracking-[0.06em] mb-1">Invoiced</div>
          <div className="text-[18px] font-medium tabular-nums"><MaskedAmount value={Math.round(totalInvoiced)} /></div>
          <div className="text-[9px] text-muted-foreground mt-0.5">paid invoices</div>
        </div>
        <div>
          <div className="text-[10px] text-muted-foreground uppercase tracking-[0.06em] mb-1">Issues</div>
          <div className="text-[18px] font-medium tabular-nums">{issues.length}</div>
        </div>
        <div>
          <div className="text-[10px] text-muted-foreground uppercase tracking-[0.06em] mb-1">Open</div>
          <div className="text-[18px] font-medium tabular-nums">{openIssues}</div>
        </div>
        <div>
          <div className="text-[10px] text-muted-foreground uppercase tracking-[0.06em] mb-1">Done</div>
          <div className="text-[18px] font-medium tabular-nums">{doneIssues}</div>
        </div>
      </div>

      <div className="flex justify-between items-center mb-3">
        <div className="flex gap-4">
          {(["table", "kanban"] as ViewMode[]).map((v) => (
            <button
              key={v}
              onClick={() => setViewMode(v)}
              className={`text-[11px] cursor-pointer transition-opacity ${
                viewMode === v
                  ? "text-foreground"
                  : "text-muted-foreground hover:text-foreground"
              }`}
            >
              {v.charAt(0).toUpperCase() + v.slice(1)}
            </button>
          ))}
        </div>
        <Button size="sm" onClick={() => setOpenDialog(true)}>+ Add issue</Button>
      </div>

      {viewMode === "table" ? (
        <IssueTable issues={issues} onEdit={openEditIssue} onDelete={confirmDeleteIssue} />
      ) : (
        <IssueKanban issues={issues} onEdit={openEditIssue} onDelete={confirmDeleteIssue} />
      )}

      <AppDialog title="New issue" open={openDialog} onOpenChange={setOpenDialog}
        footer={<Button onClick={handleAddIssue}>Create</Button>}
      >
        <Input placeholder="Title" value={issueForm.title} onChange={(e) => setIssueForm((f) => ({ ...f, title: e.target.value }))} />
        <Input placeholder="Description (optional)" value={issueForm.description} onChange={(e) => setIssueForm((f) => ({ ...f, description: e.target.value }))} />
        <Select value={issueForm.priority} onValueChange={(v) => setIssueForm((f) => ({ ...f, priority: (v ?? "medium") as Issue["priority"] }))}>
          <SelectTrigger><SelectValue /></SelectTrigger>
          <SelectContent>
            <SelectItem value="low">Low</SelectItem>
            <SelectItem value="medium">Medium</SelectItem>
            <SelectItem value="high">High</SelectItem>
          </SelectContent>
        </Select>
        <DatePicker value={issueForm.deadline} onChange={(v) => setIssueForm((f) => ({ ...f, deadline: v }))} placeholder="Deadline (optional)" />
        <Select value={issueForm.reportedBy} onValueChange={(v) => setIssueForm((f) => ({ ...f, reportedBy: (v ?? "self") as Issue["reportedBy"] }))}>
          <SelectTrigger><SelectValue /></SelectTrigger>
          <SelectContent>
            <SelectItem value="self">Self</SelectItem>
            <SelectItem value="client">Client</SelectItem>
          </SelectContent>
        </Select>
      </AppDialog>

      <AppDialog title="Edit issue" open={editOpen} onOpenChange={setEditOpen}
        footer={<Button onClick={handleEditIssue}>Save</Button>}
      >
        <Input placeholder="Title" value={editForm.title} onChange={(e) => setEditForm((f) => ({ ...f, title: e.target.value }))} />
        <Input placeholder="Description (optional)" value={editForm.description} onChange={(e) => setEditForm((f) => ({ ...f, description: e.target.value }))} />
        <Select value={editForm.priority} onValueChange={(v) => setEditForm((f) => ({ ...f, priority: (v ?? "medium") as Issue["priority"] }))}>
          <SelectTrigger><SelectValue /></SelectTrigger>
          <SelectContent>
            <SelectItem value="low">Low</SelectItem>
            <SelectItem value="medium">Medium</SelectItem>
            <SelectItem value="high">High</SelectItem>
          </SelectContent>
        </Select>
        <Select value={editForm.status} onValueChange={(v) => setEditForm((f) => ({ ...f, status: (v ?? "todo") as Issue["status"] }))}>
          <SelectTrigger><SelectValue /></SelectTrigger>
          <SelectContent>
            <SelectItem value="todo">Todo</SelectItem>
            <SelectItem value="in-progress">In Progress</SelectItem>
            <SelectItem value="done">Done</SelectItem>
          </SelectContent>
        </Select>
        <DatePicker value={editForm.deadline} onChange={(v) => setEditForm((f) => ({ ...f, deadline: v }))} placeholder="Deadline (optional)" />
        <Select value={editForm.reportedBy} onValueChange={(v) => setEditForm((f) => ({ ...f, reportedBy: (v ?? "self") as Issue["reportedBy"] }))}>
          <SelectTrigger><SelectValue /></SelectTrigger>
          <SelectContent>
            <SelectItem value="self">Self</SelectItem>
            <SelectItem value="client">Client</SelectItem>
          </SelectContent>
        </Select>
      </AppDialog>

      <AppDialog title="Delete issue?" open={deleteOpen} onOpenChange={setDeleteOpen}
        footer={
          <>
            <Button variant="outline" onClick={() => setDeleteOpen(false)}>Cancel</Button>
            <Button onClick={handleDeleteIssue} className="bg-destructive! text-destructive-foreground! border-destructive!">Delete</Button>
          </>
        }
      >
        <p className="text-[13px] text-muted-foreground">This will permanently delete the issue and cannot be undone.</p>
      </AppDialog>
    </AppShell>
  );
}
