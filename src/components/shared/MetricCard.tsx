import { cn } from "@/lib/utils";

interface MetricCardProps {
  label: string;
  value: React.ReactNode;
  subtitle?: string;
  variant?: "dark" | "light";
  valueClassName?: string;
  className?: string;
}

export function MetricCard({
  label,
  value,
  subtitle,
  variant = "dark",
  valueClassName,
  className,
}: MetricCardProps) {
  return (
    <div className={cn("py-2", className)}>
      <p className="text-[12px] text-muted-foreground uppercase tracking-[0.06em] mb-1.5">
        {label}
      </p>
      <p
        className={cn(
          "text-[22px] font-medium tabular-nums tracking-tight leading-none",
          valueClassName
        )}
      >
        {value}
      </p>
      {subtitle && (
        <p className="text-[11px] text-muted-foreground mt-1.5">{subtitle}</p>
      )}
    </div>
  );
}
