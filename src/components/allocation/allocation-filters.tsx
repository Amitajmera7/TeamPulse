"use client";

import { useId, useState } from "react";
import { ChevronDown, Search, SlidersHorizontal } from "lucide-react";

import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";
import type { AllocationFilterOptions, AllocationOption } from "@/types/allocation";

interface AllocationFilterSelectProps {
  label: string;
  placeholder: string;
  options: readonly AllocationOption[];
  /** Copy shown when the connected instance supplies no values for this field. */
  emptyPlaceholder?: string;
}

/**
 * Fully collection-driven. An empty collection means the connected Jira
 * instance has nothing for that field, so the control disables itself rather
 * than presenting an empty list.
 */
export function AllocationFilterSelect({
  label,
  placeholder,
  options,
  emptyPlaceholder = "Not available",
}: AllocationFilterSelectProps) {
  const id = useId();
  const isEmpty = options.length === 0;

  return (
    <div className="min-w-0">
      <label htmlFor={id} className="text-[12px] font-medium text-muted-foreground">
        {label}
      </label>
      <select
        id={id}
        defaultValue=""
        disabled={isEmpty}
        aria-label={label}
        className={cn(
          "mt-1.5 h-9 w-full rounded-lg border border-border/70 bg-background px-3 text-[13px] text-foreground",
          "transition-colors focus-visible:border-ring focus-visible:ring-3 focus-visible:ring-ring/50 focus-visible:outline-none",
          isEmpty && "cursor-not-allowed opacity-60"
        )}
      >
        <option value="">{isEmpty ? emptyPlaceholder : placeholder}</option>
        {options.map((option) => (
          <option key={option.value} value={option.value}>
            {option.label}
            {typeof option.count === "number" ? ` (${option.count})` : ""}
          </option>
        ))}
      </select>
    </div>
  );
}

interface AllocationFiltersProps {
  options: AllocationFilterOptions;
}

export function AllocationFilters({ options }: AllocationFiltersProps) {
  const [expanded, setExpanded] = useState(false);
  const searchId = useId();

  return (
    <section className="rounded-xl border border-border/70 bg-card p-4 sm:p-5">
      <div className="flex items-center justify-between gap-3">
        <div className="flex items-center gap-2 text-foreground">
          <SlidersHorizontal className="size-3.5 text-muted-foreground" aria-hidden />
          <span className="text-[13px] font-semibold tracking-tight">Scope</span>
        </div>
        <Button
          variant="ghost"
          size="sm"
          aria-expanded={expanded}
          onClick={() => setExpanded((prev) => !prev)}
          className="gap-1.5 text-muted-foreground"
        >
          More Filters
          <ChevronDown
            className={cn("size-3.5 transition-transform", expanded && "rotate-180")}
            aria-hidden
          />
        </Button>
      </div>

      <div className="mt-4 grid grid-cols-2 gap-3 sm:grid-cols-4">
        <AllocationFilterSelect
          label="Project"
          placeholder="All Projects"
          options={options.projects}
        />
        <AllocationFilterSelect
          label="Technology"
          placeholder="All Technologies"
          options={options.technologies}
        />
        <AllocationFilterSelect
          label="Developer"
          placeholder="All Developers"
          options={options.developers}
        />
        <AllocationFilterSelect
          label="Load"
          placeholder="All Load Levels"
          options={options.loadStatuses}
        />
      </div>

      {expanded && (
        <div className="mt-4 grid grid-cols-1 gap-3 border-t border-border/60 pt-4 animate-in fade-in slide-in-from-top-1 duration-200 sm:grid-cols-3">
          <div className="min-w-0">
            <label htmlFor={searchId} className="text-[12px] font-medium text-muted-foreground">
              Search
            </label>
            <div className="relative mt-1.5">
              <Search
                className="pointer-events-none absolute top-1/2 left-3 size-3.5 -translate-y-1/2 text-muted-foreground"
                aria-hidden
              />
              <input
                id={searchId}
                type="search"
                placeholder="Search developers, issues, projects…"
                className="h-9 w-full rounded-lg border border-border/70 bg-background pl-8 pr-3 text-[13px] text-foreground placeholder:text-muted-foreground focus-visible:border-ring focus-visible:ring-3 focus-visible:ring-ring/50 focus-visible:outline-none"
              />
            </div>
          </div>
          <AllocationFilterSelect
            label="Issue Type"
            placeholder="All Types"
            options={options.issueTypes}
          />
          <AllocationFilterSelect
            label="Team"
            placeholder="All Teams"
            options={options.teams}
            emptyPlaceholder="No teams configured"
          />
        </div>
      )}
    </section>
  );
}
