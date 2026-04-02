import { cn } from "@/lib/utils";

interface HabitTileProps {
  icon: string;
  name: string;
  streak: number;
  completed: boolean;
  onClick: () => void;
}

export function HabitTile({ icon, name, streak, completed, onClick }: HabitTileProps) {
  return (
    <button
      onClick={onClick}
      className={cn(
        "p-3 cursor-pointer transition-all text-left w-full group",
        completed
          ? "bg-white/[0.06]"
          : "bg-white/[0.02] hover:bg-white/[0.04]"
      )}
    >
      <div className="flex justify-between items-start mb-1.5">
        <span
          className={cn(
            "text-lg transition-opacity",
            completed ? "opacity-100" : "opacity-20 group-hover:opacity-40"
          )}
        >
          {icon}
        </span>
        <span
          className={cn(
            "text-[11px] font-mono tabular-nums",
            completed ? "text-foreground" : "text-muted-foreground"
          )}
        >
          {streak}d
        </span>
      </div>
      <div
        className={cn(
          "text-[12px] leading-tight",
          completed ? "text-foreground" : "text-muted-foreground"
        )}
      >
        {name}
      </div>
    </button>
  );
}
