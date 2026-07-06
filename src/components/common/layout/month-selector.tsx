import { CalendarDays, ChevronDown } from "lucide-react";

import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";

interface MonthSelectorProps {
  className?: string;
}

export function MonthSelector({ className }: MonthSelectorProps) {
  return (
    <Button
      variant="outline"
      size="sm"
      disabled
      aria-label="Select month"
      className={cn("hidden gap-1.5 sm:inline-flex", className)}
    >
      <CalendarDays className="size-3.5" aria-hidden />
      <span>Current Month</span>
      <ChevronDown className="size-3.5 opacity-60" aria-hidden />
    </Button>
  );
}
