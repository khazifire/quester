import { KanbanColumn } from "@/components/shared/KanbanColumn";
import { PRIORITY_COLORS } from "@/lib/constants";
import type { Issue } from "@/lib/types";

interface IssueKanbanProps {
  issues: Issue[];
}

const COLUMNS = ["todo", "in-progress", "done"] as const;

export function IssueKanban({ issues }: IssueKanbanProps) {
  return (
    <div className="grid grid-cols-3 gap-px bg-border">
      {COLUMNS.map((col) => {
        const colIssues = issues.filter((i) => i.status === col);
        return (
          <KanbanColumn key={col} status={col} count={colIssues.length}>
            {colIssues.map((issue) => (
              <div
                key={issue.id}
                className="bg-background p-2 hover:bg-white/[0.03] transition-colors"
              >
                <div className="text-[11px] text-foreground mb-1">{issue.title}</div>
                <span
                  className="text-[9px]"
                  style={{ color: PRIORITY_COLORS[issue.priority] }}
                >
                  {issue.priority}
                </span>
              </div>
            ))}
          </KanbanColumn>
        );
      })}
    </div>
  );
}
