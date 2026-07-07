import {
  Card,
  CardContent,
} from "@/components/ui/card";
import { TextSkeleton } from "@/components/dashboard/skeletons";
import { cn } from "@/lib/utils";
import type { EmptyStateProps } from "@/types/dashboard";
import { Inbox } from "lucide-react";

export function EmptyState({
  icon: Icon = Inbox,
  title,
  description,
  className,
}: EmptyStateProps) {
  return (
    <Card
      className={cn(
        "border border-border ring-0",
        className
      )}
    >
      <CardContent className="flex flex-col items-center gap-3 px-4 py-8 text-center">
        <span className="flex size-9 items-center justify-center rounded-lg border border-border bg-muted/50">
          <Icon className="size-4 text-muted-foreground" aria-hidden />
        </span>
        <div className="space-y-1">
          <p className="text-sm font-medium text-foreground">{title}</p>
          <p className="max-w-sm text-xs text-muted-foreground">{description}</p>
        </div>
        <TextSkeleton lines={2} className="mt-1 w-full max-w-xs" />
      </CardContent>
    </Card>
  );
}
