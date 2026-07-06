import { format } from "date-fns";

import { getGreeting } from "@/lib/greeting";
import { cn } from "@/lib/utils";
import type { PageHeaderProps } from "@/types/layout";

export function PageHeader({
  title,
  description,
  greeting,
}: PageHeaderProps) {
  const now = new Date();
  const currentMonth = format(now, "MMMM yyyy");
  const todayDate = format(now, "EEEE, MMMM d, yyyy");

  return (
    <div className={cn("border-b border-border bg-background px-4 py-6 lg:px-6")}>
      <div className="mx-auto flex max-w-[1440px] flex-col gap-4 sm:flex-row sm:items-end sm:justify-between">
        <div className="space-y-1">
          <p className="text-sm font-medium text-muted-foreground">
            {greeting ?? getGreeting()}
          </p>
          <h1 className="text-2xl font-semibold tracking-tight text-foreground sm:text-[32px] sm:leading-tight">
            {title}
          </h1>
          {description && (
            <p className="text-sm text-muted-foreground">{description}</p>
          )}
        </div>

        <div className="flex flex-col gap-0.5 text-right text-sm">
          <span className="font-medium text-foreground">{currentMonth}</span>
          <span className="text-muted-foreground">{todayDate}</span>
        </div>
      </div>
    </div>
  );
}
