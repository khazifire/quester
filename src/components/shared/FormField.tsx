interface FormFieldProps {
  label: string;
  children: React.ReactNode;
  hint?: string;
  className?: string;
}

export function FormField({ label, children, hint, className }: FormFieldProps) {
  return (
    <div className={`space-y-1.5${className ? ` ${className}` : ""}`}>
      <label className="text-[12px] text-muted-foreground block">{label}</label>
      {children}
      {hint && <p className="text-[11px] text-muted-foreground/50">{hint}</p>}
    </div>
  );
}
