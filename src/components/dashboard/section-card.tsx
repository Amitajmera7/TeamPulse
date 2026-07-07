import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { CardSkeleton } from "@/components/dashboard/skeletons";
import { cn } from "@/lib/utils";
import type { SectionCardProps } from "@/types/layout";

export function SectionCard({
  label,
  description = "Content coming soon",
  className,
}: SectionCardProps) {
  return (
    <Card
      className={cn(
        "border border-border ring-0 transition-colors duration-150 hover:border-foreground/15",
        className
      )}
    >
      <CardHeader className="border-b border-border/50 px-4 pt-4 pb-2">
        <CardTitle className="text-sm font-semibold">{label}</CardTitle>
        <CardDescription className="text-xs">{description}</CardDescription>
      </CardHeader>
      <CardContent className="px-4 py-4">
        <CardSkeleton rows={2} />
      </CardContent>
    </Card>
  );
}
