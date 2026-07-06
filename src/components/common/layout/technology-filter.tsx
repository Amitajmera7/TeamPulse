import { ChevronDown, Cpu } from "lucide-react";

import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";

interface TechnologyFilterProps {
  className?: string;
}

export function TechnologyFilter({ className }: TechnologyFilterProps) {
  return (
    <Button
      variant="outline"
      size="sm"
      disabled
      aria-label="Filter by technology"
      className={cn("hidden gap-1.5 lg:inline-flex", className)}
    >
      <Cpu className="size-3.5" aria-hidden />
      <span>All Technologies</span>
      <ChevronDown className="size-3.5 opacity-60" aria-hidden />
    </Button>
  );
}
