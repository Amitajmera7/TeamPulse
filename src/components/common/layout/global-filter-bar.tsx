import { MonthSelector } from "@/components/common/layout/month-selector";
import { TechnologyFilter } from "@/components/common/layout/technology-filter";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";

interface GlobalFilterBarProps {
  className?: string;
}

export function GlobalFilterBar({ className }: GlobalFilterBarProps) {
  return (
    <div
      className={cn(
        "flex flex-wrap items-center gap-2 border-b border-border bg-muted/15 px-4 py-1.5 lg:px-6",
        className
      )}
    >
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
  );
}
