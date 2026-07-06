import { RefreshCw } from "lucide-react";

import { cn } from "@/lib/utils";

interface LastSyncProps {
  className?: string;
}

export function LastSync({ className }: LastSyncProps) {
  return (
    <div
      className={cn(
        "flex items-center gap-1.5 text-xs text-muted-foreground",
        className
      )}
    >
      <RefreshCw className="size-3.5" aria-hidden />
      <span>Last sync: —</span>
    </div>
  );
}
