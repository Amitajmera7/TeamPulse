import { Filter } from "lucide-react";

import { MonthSelector } from "@/components/common/layout/month-selector";
import { TechnologyFilter } from "@/components/common/layout/technology-filter";
import { LastSync } from "@/components/common/layout/last-sync";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";

interface GlobalFilterBarProps {
  className?: string;
}

export function GlobalFilterBar({ className }: GlobalFilterBarProps) {
  return (
    <div
      className={cn(
        "flex flex-wrap items-center justify-between gap-3 border-b border-border bg-muted/30 px-4 py-3 lg:px-6",
        className
      )}
    >
      <div className="flex flex-wrap items-center gap-2">
        <div className="flex items-center gap-1.5 text-sm font-medium text-foreground">
          <Filter className="size-4 text-muted-foreground" aria-hidden />
          <span className="hidden sm:inline">Filters</span>
        </div>
        <MonthSelector />
        <TechnologyFilter />
        <Button
          variant="outline"
          size="sm"
          disabled
          aria-label="Filter by developer"
          className="hidden md:inline-flex"
        >
          All Developers
        </Button>
        <Button
          variant="outline"
          size="sm"
          disabled
          aria-label="Filter by status"
          className="hidden xl:inline-flex"
        >
          All Statuses
        </Button>
      </div>
      <LastSync />
    </div>
  );
}
