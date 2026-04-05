import { useRef } from "react";
import { KanbanColumn } from "@/components/shared/KanbanColumn";
import { PRIORITY_COLORS } from "@/lib/constants";
import { useProjectStore } from "@/stores/projectStore";
import type { Issue } from "@/lib/types";

interface IssueKanbanProps {
  issues: Issue[];
  onEdit?: (issue: Issue) => void;
  onDelete?: (id: string) => void;
}

const COLUMNS: Issue["status"][] = ["todo", "in-progress", "done"];

export function IssueKanban({ issues, onEdit, onDelete }: IssueKanbanProps) {
  const updateIssue = useProjectStore((s) => s.updateIssue);
  const dragId = useRef<string | null>(null);

  return (
    <div className="grid grid-cols-3 gap-px bg-border">
      {COLUMNS.map((col) => {
        const colIssues = issues.filter((i) => i.status === col);
        return (
          <KanbanColumn
            key={col}
            status={col}
            count={colIssues.length}
            onDragOver={(e) => e.preventDefault()}
            onDrop={() => {
              if (dragId.current) updateIssue(dragId.current, { status: col });
              dragId.current = null;
            }}
          >
            {colIssues.map((issue) => (
              <div
                key={issue.id}
                draggable
                onDragStart={() => { dragId.current = issue.id; }}
                className="bg-background p-2 hover:bg-white/[0.03] transition-colors cursor-grab group"
              >
                <div className="text-[11px] text-foreground mb-1">{issue.title}</div>
                <div className="flex items-center justify-between">
                  <span className="text-[9px]" style={{ color: PRIORITY_COLORS[issue.priority] }}>
                    {issue.priority}
                  </span>
                  <span className="flex gap-1.5 opacity-0 group-hover:opacity-100 transition-opacity">
                    {onEdit && (
                      <button
                        className="text-[9px] text-muted-foreground hover:text-foreground cursor-pointer"
                        onClick={(e) => { e.stopPropagation(); onEdit(issue); }}
                      >
                        [edit]
                      </button>
                    )}
                    {onDelete && (
                      <button
                        className="text-[9px] text-muted-foreground hover:text-destructive cursor-pointer"
                        onClick={(e) => { e.stopPropagation(); onDelete(issue.id); }}
                      >
                        [del]
                      </button>
                    )}
                  </span>
                </div>
              </div>
            ))}
          </KanbanColumn>
        );
      })}
    </div>
  );
}
