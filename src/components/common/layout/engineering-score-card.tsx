import { cn } from "@/lib/utils";

interface EngineeringScoreCardProps {
  className?: string;
}

export function EngineeringScoreCard({ className }: EngineeringScoreCardProps) {
  return (
    <div
      className={cn(
        "flex min-w-[140px] flex-col rounded-xl border border-border bg-background px-4 py-3",
        className
      )}
    >
      <span className="text-[10px] font-medium tracking-wide text-muted-foreground uppercase">
        Engineering Score
      </span>
      <span className="mt-1 text-3xl font-semibold tracking-tight text-foreground tabular-nums">
        —
      </span>
      <span className="mt-0.5 text-xs text-muted-foreground">
        Awaiting metrics
      </span>
    </div>
  );
}
