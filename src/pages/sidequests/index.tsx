import { useState } from "react";
import { AppShell } from "@/components/layout/AppShell";
import { ProjectCard, STATUS_COLORS, BILLING_COLORS } from "@/components/sidequests/ProjectCard";
import { useProjectStore } from "@/stores/projectStore";
import { useCurrencyStore } from "@/stores/currencyStore";
import { MaskedAmount } from "@/components/shared/MaskedAmount";
import { Button } from "@/components/ui/button";
import { AppDialog } from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { toast } from "sonner";

type Filter = "All" | "Active" | "Completed";

export default function SideQuestsPage() {
  const projects = useProjectStore((s) => s.projects);
  const clients = useProjectStore((s) => s.clients);
  const issues = useProjectStore((s) => s.issues);
  const addProject = useProjectStore((s) => s.addProject);
  const updateProject = useProjectStore((s) => s.updateProject);
  const deleteProject = useProjectStore((s) => s.deleteProject);
  const addClient = useProjectStore((s) => s.addClient);
  const updateClient = useProjectStore((s) => s.updateClient);
  const deleteClient = useProjectStore((s) => s.deleteClient);
  const wallets = useCurrencyStore((s) => s.wallets);
  const mainCurrency = useCurrencyStore((s) => s.mainCurrency);
  const [filter, setFilter] = useState<Filter>("All");

  
  const [open, setOpen] = useState(false);
  const [form, setForm] = useState({
    name: "",
    clientId: "",
    billingType: "fixed" as "fixed" | "retainer",
    amount: "",
    currency: mainCurrency,
  });

  const filtered = projects.filter((p) => {
    if (filter === "Active") return p.status === "active";
    if (filter === "Completed") return p.status === "completed";
    return true;
  });

  function handleCreate() {
    if (!form.name.trim() || !form.clientId) return;
    addProject({
      clientId: form.clientId,
      name: form.name.trim(),
      billingType: form.billingType,
      status: "active",
      amount: Number(form.amount) || 0,
      currency: form.currency,
      dueDate: null,
    });
    toast.success("Project created");
    setForm({ name: "", clientId: "", billingType: "fixed", amount: "", currency: mainCurrency });
    setOpen(false);
  }

  
  const [editOpen, setEditOpen] = useState(false);
  const [editId, setEditId] = useState<string | null>(null);
  const [editForm, setEditForm] = useState({
    name: "",
    clientId: "",
    billingType: "fixed" as "fixed" | "retainer",
    amount: "",
    currency: mainCurrency,
    status: "active" as Project["status"],
  });

  type Project = typeof projects[0];

  function openEdit(id: string) {
    const p = projects.find((x) => x.id === id);
    if (!p) return;
    setEditId(id);
    setEditForm({
      name: p.name,
      clientId: p.clientId,
      billingType: p.billingType,
      amount: String(p.amount),
      currency: p.currency || mainCurrency,
      status: p.status,
    });
    setEditOpen(true);
  }

  function handleEdit() {
    if (!editId || !editForm.name.trim()) return;
    updateProject(editId, {
      name: editForm.name.trim(),
      clientId: editForm.clientId,
      billingType: editForm.billingType,
      amount: Number(editForm.amount) || 0,
      currency: editForm.currency,
      status: editForm.status,
    });
    toast.success("Project updated");
    setEditOpen(false);
  }

  
  const [deleteOpen, setDeleteOpen] = useState(false);
  const [deleteId, setDeleteId] = useState<string | null>(null);

  function confirmDelete(id: string) {
    setDeleteId(id);
    setDeleteOpen(true);
  }

  function handleDelete() {
    if (!deleteId) return;
    deleteProject(deleteId);
    toast.success("Project deleted");
    setDeleteOpen(false);
  }

  
  const [clientsOpen, setClientsOpen] = useState(false);
  const [newClientName, setNewClientName] = useState("");
  const [editClientId, setEditClientId] = useState<string | null>(null);
  const [editClientName, setEditClientName] = useState("");

  function handleAddClient() {
    if (!newClientName.trim()) return;
    addClient({
      name: newClientName.trim(),
      color: `#${Math.floor(Math.random() * 16777215).toString(16).padStart(6, "0")}`,
    });
    setNewClientName("");
    toast.success("Client added");
  }

  function startEditClient(id: string) {
    const c = clients.find((x) => x.id === id);
    if (!c) return;
    setEditClientId(id);
    setEditClientName(c.name);
  }

  function handleEditClient() {
    if (!editClientId || !editClientName.trim()) return;
    updateClient(editClientId, { name: editClientName.trim() });
    setEditClientId(null);
    setEditClientName("");
    toast.success("Client updated");
  }

  function handleDeleteClient(id: string) {
    const hasProjects = projects.some((p) => p.clientId === id);
    if (hasProjects) {
      toast.error("Cannot delete client with projects");
      return;
    }
    deleteClient(id);
    toast.success("Client deleted");
  }

  const getClientName = (id: string) => clients.find((c) => c.id === id)?.name || "—";

  const editOrigProject = editId ? projects.find((p) => p.id === editId) : undefined;
  const isRetainerLosing =
    editOrigProject?.billingType === "retainer" &&
    editOrigProject?.status === "active" &&
    editForm.status !== "active";

  return (
    <AppShell
      title="Projects"
      actions={
        <div className="flex gap-2">
          <Button size="sm" variant="outline" onClick={() => setClientsOpen(true)}>Clients</Button>
          <Button size="sm" onClick={() => setOpen(true)}>+ New</Button>
        </div>
      }
    >
      <div className="flex gap-4 mb-4 border-b border-border pb-2">
        {(["All", "Active", "Completed"] as Filter[]).map((f) => (
          <button
            key={f}
            onClick={() => setFilter(f)}
            className={`text-[11px] cursor-pointer transition-opacity ${
              filter === f
                ? "text-foreground"
                : "text-muted-foreground hover:text-foreground"
            }`}
          >
            {f}
          </button>
        ))}
      </div>

      <div className="grid grid-cols-3 gap-px bg-border">
        {filtered.map((p) => {
          const client = clients.find((c) => c.id === p.clientId);
          const projectIssues = issues.filter((i) => i.projectId === p.id);
          const openIssues = projectIssues.filter((i) => i.status !== "done").length;
          const doneIssues = projectIssues.filter((i) => i.status === "done").length;
          return (
            <div key={p.id} className="relative group">
              <ProjectCard
                project={p}
                client={client}
                openIssues={openIssues}
                doneIssues={doneIssues}
              />
              <div className="absolute top-3 right-3 flex gap-2 opacity-0 group-hover:opacity-100 transition-opacity z-10">
                <button
                  className="text-[11px] text-muted-foreground hover:text-foreground cursor-pointer"
                  onClick={(e) => { e.preventDefault(); openEdit(p.id); }}
                >
                  [edit]
                </button>
                <button
                  className="text-[11px] text-muted-foreground hover:text-destructive cursor-pointer"
                  onClick={(e) => { e.preventDefault(); confirmDelete(p.id); }}
                >
                  [del]
                </button>
              </div>
            </div>
          );
        })}
      </div>

      {filtered.length === 0 && (
        <p className="text-[10px] text-muted-foreground text-center py-10">
          No projects found
        </p>
      )}

      <AppDialog title="New project" open={open} onOpenChange={setOpen}
        footer={<Button onClick={handleCreate}>Create</Button>}
      >
        <Input placeholder="Project name" value={form.name} onChange={(e) => setForm((f) => ({ ...f, name: e.target.value }))} />
        <Select value={form.clientId} onValueChange={(v) => setForm((f) => ({ ...f, clientId: v ?? "" }))}>
          <SelectTrigger>
            <SelectValue placeholder="Select client">{form.clientId ? getClientName(form.clientId) : undefined}</SelectValue>
          </SelectTrigger>
          <SelectContent>
            {clients.map((c) => (<SelectItem key={c.id} value={c.id}>{c.name}</SelectItem>))}
          </SelectContent>
        </Select>
        <Select value={form.billingType} onValueChange={(v) => setForm((f) => ({ ...f, billingType: (v ?? "fixed") as "fixed" | "retainer" }))}>
          <SelectTrigger><SelectValue /></SelectTrigger>
          <SelectContent>
            <SelectItem value="fixed"><span className={`text-[10px] uppercase px-1.5 py-0.5 rounded mr-1.5 ${BILLING_COLORS.fixed}`}>fixed</span>Fixed price</SelectItem>
            <SelectItem value="retainer"><span className={`text-[10px] uppercase px-1.5 py-0.5 rounded mr-1.5 ${BILLING_COLORS.retainer}`}>retainer</span>Retainer</SelectItem>
          </SelectContent>
        </Select>
        <div className="flex gap-2">
          <Input placeholder="Amount" type="number" value={form.amount}
            onChange={(e) => setForm((f) => ({ ...f, amount: e.target.value }))} className="flex-1" />
          <Select value={form.currency} onValueChange={(v) => setForm((f) => ({ ...f, currency: v ?? mainCurrency }))}>
            <SelectTrigger className="w-24"><SelectValue /></SelectTrigger>
            <SelectContent>
              {wallets.map((w) => (<SelectItem key={w.currency} value={w.currency}>{w.currency}</SelectItem>))}
            </SelectContent>
          </Select>
        </div>
      </AppDialog>

      <AppDialog title="Edit project" open={editOpen} onOpenChange={setEditOpen}
        footer={<Button onClick={handleEdit}>Save</Button>}
      >
        {isRetainerLosing && editOrigProject && (
          <div className="rounded-md px-3 py-2 bg-amber-500/10 border border-amber-500/20 text-[12px] text-amber-400/90">
            <MaskedAmount value={editOrigProject.amount} currency={editOrigProject.currency} />/mo will stop counting from next month. Past months are preserved.
          </div>
        )}
        <Input placeholder="Project name" value={editForm.name} onChange={(e) => setEditForm((f) => ({ ...f, name: e.target.value }))} />
        <Select value={editForm.clientId} onValueChange={(v) => setEditForm((f) => ({ ...f, clientId: v ?? "" }))}>
          <SelectTrigger>
            <SelectValue placeholder="Select client">{editForm.clientId ? getClientName(editForm.clientId) : undefined}</SelectValue>
          </SelectTrigger>
          <SelectContent>
            {clients.map((c) => (<SelectItem key={c.id} value={c.id}>{c.name}</SelectItem>))}
          </SelectContent>
        </Select>
        <Select value={editForm.billingType} onValueChange={(v) => setEditForm((f) => ({ ...f, billingType: (v ?? "fixed") as "fixed" | "retainer" }))}>
          <SelectTrigger><SelectValue /></SelectTrigger>
          <SelectContent>
            <SelectItem value="fixed"><span className={`text-[10px] uppercase px-1.5 py-0.5 rounded mr-1.5 ${BILLING_COLORS.fixed}`}>fixed</span>Fixed price</SelectItem>
            <SelectItem value="retainer"><span className={`text-[10px] uppercase px-1.5 py-0.5 rounded mr-1.5 ${BILLING_COLORS.retainer}`}>retainer</span>Retainer</SelectItem>
          </SelectContent>
        </Select>
        <div className="flex gap-2">
          <Input placeholder="Amount" type="number" value={editForm.amount}
            onChange={(e) => setEditForm((f) => ({ ...f, amount: e.target.value }))} className="flex-1" />
          <Select value={editForm.currency} onValueChange={(v) => setEditForm((f) => ({ ...f, currency: v ?? mainCurrency }))}>
            <SelectTrigger className="w-24"><SelectValue /></SelectTrigger>
            <SelectContent>
              {wallets.map((w) => (<SelectItem key={w.currency} value={w.currency}>{w.currency}</SelectItem>))}
            </SelectContent>
          </Select>
        </div>
        <Select value={editForm.status} onValueChange={(v) => setEditForm((f) => ({ ...f, status: (v ?? "active") as Project["status"] }))}>
          <SelectTrigger><SelectValue /></SelectTrigger>
          <SelectContent>
            {(["proposal", "active", "delivered", "invoiced", "completed", "paused"] as const).map((s) => (
              <SelectItem key={s} value={s}>
                <span className={`text-[10px] uppercase px-1.5 py-0.5 rounded mr-1.5 ${STATUS_COLORS[s] || ""}`}>{s}</span>
                {s.charAt(0).toUpperCase() + s.slice(1)}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
      </AppDialog>

      <AppDialog title="Delete project?" open={deleteOpen} onOpenChange={setDeleteOpen}
        footer={<><Button variant="outline" onClick={() => setDeleteOpen(false)}>Cancel</Button><Button onClick={handleDelete} className="bg-destructive! text-destructive-foreground! border-destructive!">Delete</Button></>}
      >
        <p className="text-[13px] text-muted-foreground">This will permanently delete the project and cannot be undone.</p>
      </AppDialog>

      <AppDialog
        title="Clients"
        open={clientsOpen}
        onOpenChange={setClientsOpen}
        footer={
          <div className="flex gap-2 w-full">
            <Input
              value={newClientName}
              onChange={(e) => setNewClientName(e.target.value)}
              placeholder="New client name"
              className="flex-1"
              onKeyDown={(e) => { if (e.key === "Enter") handleAddClient(); }}
            />
            <Button size="sm" onClick={handleAddClient}>Add</Button>
          </div>
        }
      >
        <div>
          <div className="grid grid-cols-[1fr_70px_80px] gap-3 px-1 pb-2 text-[10px] uppercase tracking-[0.06em] text-muted-foreground border-b border-border">
            <span>Name</span>
            <span className="text-right">Projects</span>
            <span className="text-right">Actions</span>
          </div>

          {clients.length === 0 && (
            <p className="text-[12px] text-muted-foreground text-center py-6">No clients yet</p>
          )}
          {clients.map((c) => {
            const projectCount = projects.filter((p) => p.clientId === c.id).length;
            return (
              <div key={c.id} className="grid grid-cols-[1fr_70px_80px] gap-3 items-center px-1 py-2.5 border-b border-border last:border-0">
                {editClientId === c.id ? (
                  <>
                    <Input
                      value={editClientName}
                      onChange={(e) => setEditClientName(e.target.value)}
                      className="h-7 text-[13px]"
                      autoFocus
                      onKeyDown={(e) => { if (e.key === "Enter") handleEditClient(); if (e.key === "Escape") setEditClientId(null); }}
                    />
                    <span />
                    <span className="flex items-center justify-end gap-2">
                      <button
                        className="text-[11px] text-foreground cursor-pointer"
                        onClick={handleEditClient}
                      >
                        [save]
                      </button>
                      <button
                        className="text-[11px] text-muted-foreground hover:text-foreground cursor-pointer"
                        onClick={() => setEditClientId(null)}
                      >
                        [x]
                      </button>
                    </span>
                  </>
                ) : (
                  <>
                    <span className="text-[13px] text-foreground">{c.name}</span>
                    <span className="text-[12px] text-muted-foreground tabular-nums text-right">
                      {projectCount}
                    </span>
                    <span className="flex items-center justify-end gap-2">
                      <button
                        className="text-[11px] text-muted-foreground hover:text-foreground cursor-pointer"
                        onClick={() => startEditClient(c.id)}
                      >
                        [edit]
                      </button>
                      <button
                        className="text-[11px] text-muted-foreground hover:text-destructive cursor-pointer"
                        onClick={() => handleDeleteClient(c.id)}
                      >
                        [del]
                      </button>
                    </span>
                  </>
                )}
              </div>
            );
          })}
        </div>
      </AppDialog>
    </AppShell>
  );
}
