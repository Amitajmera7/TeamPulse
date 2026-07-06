import { Search } from "lucide-react";

import { cn } from "@/lib/utils";

interface SearchBarProps {
  className?: string;
}

export function SearchBar({ className }: SearchBarProps) {
  return (
    <div className={cn("relative hidden md:block", className)}>
      <Search
        className="pointer-events-none absolute top-1/2 left-3 size-4 -translate-y-1/2 text-muted-foreground"
        aria-hidden
      />
      <input
        type="search"
        placeholder="Search developers, teams, tickets..."
        disabled
        aria-label="Search"
        className={cn(
          "h-9 w-full min-w-[200px] rounded-lg border border-input bg-background py-2 pr-3 pl-9 text-sm",
          "text-foreground placeholder:text-muted-foreground",
          "transition-colors focus-visible:border-ring focus-visible:ring-3 focus-visible:ring-ring/50 focus-visible:outline-none",
          "disabled:cursor-not-allowed disabled:opacity-60",
          "lg:min-w-[280px]"
        )}
      />
    </div>
  );
}
