import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { ChartSkeleton } from "@/components/dashboard/skeletons";
import { cn } from "@/lib/utils";
import type { TrendCardProps } from "@/types/dashboard";

export function TrendCard({ title, description, className }: TrendCardProps) {
  return (
    <Card
      className={cn(
        "border border-border ring-0 transition-colors duration-150 hover:border-foreground/15",
        className
      )}
    >
      <CardHeader className="px-4 pt-4 pb-1">
        <CardTitle className="text-sm font-semibold">{title}</CardTitle>
        {description && (
          <CardDescription className="text-xs">{description}</CardDescription>
        )}
      </CardHeader>
      <CardContent className="px-4 pb-4">
        <ChartSkeleton />
      </CardContent>
    </Card>
  );
}
