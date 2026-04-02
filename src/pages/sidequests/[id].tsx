import { useState, useMemo } from "react";
import { useRouter } from "next/router";
import { AppShell } from "@/components/layout/AppShell";
import { IssueTable } from "@/components/sidequests/IssueTable";
import { IssueKanban } from "@/components/sidequests/IssueKanban";
import { MaskedAmount } from "@/components/shared/MaskedAmount";
import { Button } from "@/components/ui/button";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger, DialogFooter } from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { DatePicker } from "@/components/ui/date-picker";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { useProjectStore } from "@/stores/projectStore";
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
  const [openDialog, setOpenDialog] = useState(false);
  const [issueForm, setIssueForm] = useState({
    title: "",
    description: "",
    priority: "medium" as "low" | "medium" | "high",
    deadline: "",
    reportedBy: "self" as "client" | "self",
  });

  if (!project) {
    return (
      <AppShell title="Projects">
        <p className="text-muted-foreground text-[11px]">Project not found</p>
      </AppShell>
    );
  }

  const openIssues = issues.filter((i) => i.status !== "done").length;
  const doneIssues = issues.filter((i) => i.status === "done").length;

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

      <div className="grid grid-cols-4 gap-6 pb-4 mb-4 border-b border-border">
        <div>
          <div className="text-[10px] text-muted-foreground uppercase tracking-[0.06em] mb-1">Value</div>
          <div className="text-[18px] font-medium tabular-nums"><MaskedAmount value={project.amount} /></div>
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
        <Dialog open={openDialog} onOpenChange={setOpenDialog}>
          <DialogTrigger render={<Button size="sm" />}>
            + Add issue
          </DialogTrigger>
          <DialogContent>
            <DialogHeader>
              <DialogTitle>New issue</DialogTitle>
            </DialogHeader>
            <div className="grid gap-3 py-4">
              <Input placeholder="Title" value={issueForm.title} onChange={(e) => setIssueForm((f) => ({ ...f, title: e.target.value }))} />
              <Input placeholder="Description (optional)" value={issueForm.description} onChange={(e) => setIssueForm((f) => ({ ...f, description: e.target.value }))} />
              <Select value={issueForm.priority} onValueChange={(v) => setIssueForm((f) => ({ ...f, priority: (v ?? "medium") as "low" | "medium" | "high" }))}>
                <SelectTrigger><SelectValue /></SelectTrigger>
                <SelectContent>
                  <SelectItem value="low">Low</SelectItem>
                  <SelectItem value="medium">Medium</SelectItem>
                  <SelectItem value="high">High</SelectItem>
                </SelectContent>
              </Select>
              <DatePicker value={issueForm.deadline} onChange={(v) => setIssueForm((f) => ({ ...f, deadline: v }))} placeholder="Deadline (optional)" />
              <Select value={issueForm.reportedBy} onValueChange={(v) => setIssueForm((f) => ({ ...f, reportedBy: (v ?? "self") as "client" | "self" }))}>
                <SelectTrigger><SelectValue /></SelectTrigger>
                <SelectContent>
                  <SelectItem value="self">Self</SelectItem>
                  <SelectItem value="client">Client</SelectItem>
                </SelectContent>
              </Select>
            </div>
            <DialogFooter>
              <Button onClick={handleAddIssue}>Create</Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>
      </div>

      {viewMode === "table" ? (
        <IssueTable issues={issues} />
      ) : (
        <IssueKanban issues={issues} />
      )}
    </AppShell>
  );
}
