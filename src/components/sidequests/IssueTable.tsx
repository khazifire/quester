import { PRIORITY_COLORS } from "@/lib/constants";
import { formatDate } from "@/lib/utils";
import type { Issue } from "@/lib/types";

interface IssueTableProps {
  issues: Issue[];
}

export function IssueTable({ issues }: IssueTableProps) {
  if (issues.length === 0) {
    return (
      <div className="py-8 text-center">
        <p className="text-[12px] text-muted-foreground">No issues</p>
      </div>
    );
  }

  return (
    <div className="bg-card">
      <div className="grid grid-cols-[1fr_80px_100px_90px_90px] gap-3 px-3 py-2.5 text-[11px] uppercase tracking-[0.06em] text-muted-foreground border-b border-border">
        <span>Title</span>
        <span>Priority</span>
        <span>Status</span>
        <span>Created</span>
        <span>Deadline</span>
      </div>
      {issues.map((issue) => (
        <div
          key={issue.id}
          className="grid grid-cols-[1fr_80px_100px_90px_90px] gap-3 px-3 py-2.5 text-[13px] border-b border-border last:border-0 hover:bg-white/[0.02] transition-colors"
        >
          <span className="text-foreground truncate">{issue.title}</span>
          <span
            className="text-[12px]"
            style={{ color: PRIORITY_COLORS[issue.priority] }}
          >
            {issue.priority}
          </span>
          <span className="text-[12px] text-muted-foreground capitalize">
            {issue.status.replace("-", " ")}
          </span>
          <span className="text-[11px] text-muted-foreground font-mono tabular-nums">
            {formatDate(new Date(issue.createdAt).toISOString())}
          </span>
          <span className="text-[11px] text-muted-foreground font-mono tabular-nums">
            {issue.deadline ? formatDate(issue.deadline) : "—"}
          </span>
        </div>
      ))}
    </div>
  );
}
