interface KanbanColumnProps {
  status: string;
  count: number;
  children: React.ReactNode;
}

export function KanbanColumn({ status, count, children }: KanbanColumnProps) {
  return (
    <div className="bg-card p-3 min-h-[120px]">
      <div className="text-[11px] uppercase tracking-[0.06em] text-muted-foreground mb-3 flex items-center justify-between">
        <span>{status.replace("-", " ")}</span>
        <span className="text-foreground/40">{count}</span>
      </div>
      <div className="space-y-1.5">{children}</div>
    </div>
  );
}
