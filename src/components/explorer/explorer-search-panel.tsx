"use client";

import { useMemo, useState } from "react";
import Link from "next/link";
import { Search } from "lucide-react";

import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import {
  dashboardCard,
  dashboardCardContent,
  dashboardCardHeader,
  dashboardTypography,
} from "@/lib/dashboard-ui";
import type { ExplorerSearchIndexEntry } from "@/services/analytics-read/explorer";
import { cn } from "@/lib/utils";

interface ExplorerSearchPanelProps {
  index: readonly ExplorerSearchIndexEntry[];
}

/**
 * Global search architecture for Explorer — client filter over searchIndex.
 * Supports Developer, Technology, Project, Issue Key.
 */
export function ExplorerSearchPanel({ index }: ExplorerSearchPanelProps) {
  const [query, setQuery] = useState("");

  const results = useMemo(() => {
    const q = query.trim().toLowerCase();
    if (!q) {
      return index.slice(0, 25);
    }

    return index
      .filter((entry) => {
        if (entry.label.toLowerCase().includes(q)) {
          return true;
        }
        if (entry.subtitle?.toLowerCase().includes(q)) {
          return true;
        }
        return entry.keywords.some((keyword) =>
          keyword.toLowerCase().includes(q)
        );
      })
      .slice(0, 50);
  }, [index, query]);

  return (
    <Card className={dashboardCard}>
      <CardHeader className={dashboardCardHeader}>
        <CardTitle className={dashboardTypography.cardTitle}>
          Global Search
        </CardTitle>
        <p className={dashboardTypography.description}>
          Search developers, technologies, projects, and issue keys
        </p>
      </CardHeader>
      <CardContent className={cn(dashboardCardContent, "space-y-4")}>
        <label className="relative block">
          <Search
            className="pointer-events-none absolute top-1/2 left-3 size-4 -translate-y-1/2 text-muted-foreground"
            aria-hidden
          />
          <input
            value={query}
            onChange={(event) => setQuery(event.target.value)}
            placeholder="Search by name, technology, project, or issue key…"
            className="h-10 w-full rounded-lg border border-border/70 bg-background pr-3 pl-10 text-[13px] outline-none focus-visible:ring-2 focus-visible:ring-ring/40"
            aria-label="Global search"
          />
        </label>

        {results.length === 0 ? (
          <p className="py-6 text-center text-[13px] text-muted-foreground">
            No matches.
          </p>
        ) : (
          <ul className="divide-y divide-border/60 rounded-lg border border-border/60">
            {results.map((entry) => (
              <li key={`${entry.type}-${entry.id}`}>
                <Link
                  href={entry.href}
                  className="flex items-center justify-between gap-3 px-3 py-2.5 text-[13px] transition-colors hover:bg-muted/40"
                >
                  <div>
                    <p className="font-medium text-foreground">{entry.label}</p>
                    <p className="text-[12px] text-muted-foreground">
                      {entry.type}
                      {entry.subtitle ? ` · ${entry.subtitle}` : ""}
                    </p>
                  </div>
                  <span className="text-[12px] text-primary">Open</span>
                </Link>
              </li>
            ))}
          </ul>
        )}
      </CardContent>
    </Card>
  );
}
