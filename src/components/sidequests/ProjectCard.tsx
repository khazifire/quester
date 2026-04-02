import type { Project, Client } from "@/lib/types";
import Link from "next/link";

const STATUS_COLORS: Record<string, string> = {
  proposal: "bg-blue-400/20 text-blue-400",
  active: "bg-emerald-400/20 text-emerald-400",
  delivered: "bg-amber-400/20 text-amber-400",
  invoiced: "bg-violet-400/20 text-violet-400",
  completed: "bg-foreground/10 text-foreground/40",
  paused: "bg-orange-400/20 text-orange-400",
};

const BILLING_COLORS: Record<string, string> = {
  retainer: "bg-cyan-400/15 text-cyan-400",
  fixed: "bg-foreground/10 text-foreground/50",
};

interface ProjectCardProps {
  project: Project;
  client?: Client;
  openIssues: number;
  doneIssues: number;
}

export function ProjectCard({
  project,
  client,
  openIssues,
  doneIssues,
}: ProjectCardProps) {
  const total = openIssues + doneIssues;
  const pct = total > 0 ? Math.round((doneIssues / total) * 100) : 0;

  return (
    <Link href={`/sidequests/${project.id}`}>
      <div className="bg-card p-4 cursor-pointer hover:bg-white/[0.04] transition-colors group">
        <div className="flex items-center gap-2 mb-2">
          <span
            className={`text-[10px] uppercase tracking-[0.06em] px-1.5 py-0.5 rounded ${BILLING_COLORS[project.billingType] || "text-muted-foreground"}`}
          >
            {project.billingType}
          </span>
          <span
            className={`text-[10px] uppercase tracking-[0.06em] px-1.5 py-0.5 rounded ${STATUS_COLORS[project.status] || "text-muted-foreground"}`}
          >
            {project.status}
          </span>
        </div>
        <div className="text-[15px] font-medium text-foreground mb-1 group-hover:text-white transition-colors">
          {project.name}
        </div>
        <div className="text-[12px] text-muted-foreground mb-3">
          {client?.name}
        </div>

        <div className="w-full h-1 bg-white/[0.06] mb-1.5">
          <div
            className="h-full bg-foreground/40 transition-all"
            style={{ width: `${pct}%` }}
          />
        </div>
        <div className="flex justify-between">
          <span className="text-[11px] text-muted-foreground">
            {openIssues > 0 ? `${openIssues} open` : ""}
            {openIssues > 0 && doneIssues > 0 ? " · " : ""}
            {doneIssues > 0 ? `${doneIssues} done` : ""}
            {total === 0 ? "No issues" : ""}
          </span>
          {total > 0 && (
            <span className="text-[11px] text-muted-foreground tabular-nums">{pct}%</span>
          )}
        </div>
      </div>
    </Link>
  );
}

export { STATUS_COLORS, BILLING_COLORS };
