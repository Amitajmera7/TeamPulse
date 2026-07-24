"use client";

import { useMemo, useState } from "react";

import { DeveloperOccupancyCard } from "@/components/allocation/developer-occupancy-card";
import { Button } from "@/components/ui/button";
import { dashboardGridGap, dashboardTypography } from "@/lib/dashboard-ui";
import { cn } from "@/lib/utils";
import type {
  AllocationDeveloper,
  AllocationLoadBand,
  AllocationLoadStatus,
} from "@/types/allocation";

const ALL_SEGMENT = "all";

interface DeveloperOccupancyGridProps {
  developers: readonly AllocationDeveloper[];
  /** Segment buttons are built from the model's bands, not a fixed list. */
  loadBands: readonly AllocationLoadBand[];
  onSelect: (id: string) => void;
}

export function DeveloperOccupancyGrid({
  developers,
  loadBands,
  onSelect,
}: DeveloperOccupancyGridProps) {
  const [segment, setSegment] = useState<AllocationLoadStatus | typeof ALL_SEGMENT>(ALL_SEGMENT);

  const segments = useMemo(
    () => loadBands.filter((band) => band.developerCount > 0),
    [loadBands]
  );

  const visible = useMemo(
    () =>
      segment === ALL_SEGMENT
        ? developers
        : developers.filter((developer) => developer.status === segment),
    [developers, segment]
  );

  return (
    <section>
      <div className="mb-4 flex flex-wrap items-end justify-between gap-3">
        <div>
          <h2 className={dashboardTypography.sectionTitle}>Availability &amp; Workload</h2>
          <p className={dashboardTypography.sectionDescription}>
            {developers.length} developer{developers.length === 1 ? "" : "s"}, earliest
            availability first — click a card for the full picture
          </p>
        </div>
        <div className="inline-flex flex-wrap items-center gap-1 rounded-lg border border-border/70 bg-muted/40 p-1">
          <Button
            size="sm"
            variant={segment === ALL_SEGMENT ? "default" : "ghost"}
            onClick={() => setSegment(ALL_SEGMENT)}
            className={cn("h-7", segment !== ALL_SEGMENT && "text-muted-foreground")}
          >
            All {developers.length}
          </Button>
          {segments.map((band) => (
            <Button
              key={band.status}
              size="sm"
              variant={segment === band.status ? "default" : "ghost"}
              onClick={() => setSegment(band.status)}
              className={cn("h-7", segment !== band.status && "text-muted-foreground")}
            >
              {band.label} {band.developerCount}
            </Button>
          ))}
        </div>
      </div>

      {visible.length === 0 ? (
        <p className="rounded-xl border border-border/70 bg-card py-10 text-center text-[13px] text-muted-foreground">
          No developers match this view.
        </p>
      ) : (
        <div
          className={`grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-3 2xl:grid-cols-4 ${dashboardGridGap}`}
        >
          {visible.map((developer) => (
            <DeveloperOccupancyCard
              key={developer.id}
              developer={developer}
              onSelect={onSelect}
            />
          ))}
        </div>
      )}
    </section>
  );
}
