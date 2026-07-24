import { RotateCcw, WifiOff } from "lucide-react";

import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { dashboardCard } from "@/lib/dashboard-ui";

interface AllocationErrorStateProps {
  onRetry: () => void;
  /** Surfaced by the read hook once Sprint 3 has a request that can fail. */
  message?: string | null;
}

/**
 * Nothing sets this state programmatically yet — there is no live fetch to
 * fail. It exists so Sprint 3 can flip `status` to "error" on a failed Jira
 * read without adding a new component.
 */
export function AllocationErrorState({ onRetry, message }: AllocationErrorStateProps) {
  return (
    <Card className={dashboardCard}>
      <CardContent className="flex flex-col items-center gap-3 px-4 py-12 text-center">
        <span className="flex size-10 items-center justify-center rounded-lg border border-destructive/20 bg-destructive/8">
          <WifiOff className="size-4 text-destructive" aria-hidden />
        </span>
        <div className="space-y-1">
          <p className="text-sm font-medium text-foreground">Couldn&apos;t load allocation data</p>
          <p className="max-w-sm text-xs text-muted-foreground">
            {message ??
              "We weren't able to reach the data source. None of the figures below are shown until this succeeds — nothing is assumed to be zero."}
          </p>
        </div>
        <Button size="sm" variant="outline" onClick={onRetry} className="mt-1 gap-1.5">
          <RotateCcw className="size-3.5" aria-hidden />
          Retry
        </Button>
      </CardContent>
    </Card>
  );
}
