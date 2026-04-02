import { useMemo } from "react";
import { useProjectStore } from "@/stores/projectStore";
import Link from "next/link";

export function ActiveProjects() {
  const allProjects = useProjectStore((s) => s.projects);
  const clients = useProjectStore((s) => s.clients);
  const issues = useProjectStore((s) => s.issues);

  const projects = useMemo(
    () => allProjects.filter((p) => p.status === "active"),
    [allProjects]
  );
  const getClientById = (id: string) => clients.find((c) => c.id === id);
  const getOpenIssueCount = (projectId: string) =>
    issues.filter((i) => i.projectId === projectId && i.status !== "done").length;

  return (
    <div>
      <div className="text-[12px] uppercase tracking-[0.06em] text-muted-foreground mb-3">
        Projects
      </div>
      {projects.map((p) => {
        const client = getClientById(p.clientId);
        const openIssues = getOpenIssueCount(p.id);
        return (
          <Link
            key={p.id}
            href={`/sidequests/${p.id}`}
            className="flex items-center gap-3 py-2 border-b border-border last:border-0 hover:bg-white/[0.02] -mx-1 px-1 transition-colors"
          >
            <span className="text-[13px] text-foreground flex-1 truncate">
              {p.name}
            </span>
            <div className="w-16 h-1 bg-white/[0.06] shrink-0">
              <div
                className="h-full bg-foreground/40"
                style={{
                  width: openIssues > 0 ? `${Math.min(openIssues * 20, 100)}%` : "0%",
                }}
              />
            </div>
            <span className="text-[12px] text-muted-foreground tabular-nums w-8 text-right shrink-0">
              {openIssues > 0 ? `${openIssues}` : "—"}
            </span>
          </Link>
        );
      })}
      {projects.length === 0 && (
        <p className="text-[12px] text-muted-foreground py-4">
          No active projects
        </p>
      )}
      <Link
        href="/sidequests"
        className="text-[11px] text-muted-foreground hover:text-foreground mt-2 block"
      >
        View all &rarr;
      </Link>
    </div>
  );
}
