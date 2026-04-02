import * as React from "react";
import { format } from "date-fns";
import { CalendarIcon } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Calendar } from "@/components/ui/calendar";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { cn } from "@/lib/utils";

interface DatePickerProps {
  value?: string; // YYYY-MM-DD string
  onChange: (value: string) => void;
  placeholder?: string;
  className?: string;
}

export function DatePicker({ value, onChange, placeholder = "Pick a date", className }: DatePickerProps) {
  const [open, setOpen] = React.useState(false);

  const selected = value ? new Date(value + "T00:00:00") : undefined;

  return (
    <Popover open={open} onOpenChange={setOpen}>
      <PopoverTrigger
        render={
          <button
            type="button"
            className={cn(
              "flex h-9 w-full items-center gap-2 rounded-[4px] border border-[#2a2a2a] bg-[#0b0b0b] px-3 text-[13px] text-foreground transition-colors hover:border-[#444] focus:border-[#444] focus:outline-none",
              !value && "text-muted-foreground",
              className,
            )}
          />
        }
      >
        <CalendarIcon className="size-3.5 text-muted-foreground" />
        {selected ? format(selected, "MMM d, yyyy") : placeholder}
      </PopoverTrigger>
      <PopoverContent className="w-auto p-0" align="start">
        <Calendar
          mode="single"
          selected={selected}
          onSelect={(date) => {
            if (date) {
              const y = date.getFullYear();
              const m = String(date.getMonth() + 1).padStart(2, "0");
              const d = String(date.getDate()).padStart(2, "0");
              onChange(`${y}-${m}-${d}`);
            } else {
              onChange("");
            }
            setOpen(false);
          }}
          defaultMonth={selected}
        />
      </PopoverContent>
    </Popover>
  );
}
