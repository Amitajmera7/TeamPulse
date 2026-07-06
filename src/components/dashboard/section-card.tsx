import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
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
        "transition-shadow duration-200 hover:shadow-sm",
        className
      )}
    >
      <CardHeader className="border-b border-border/50">
        <CardTitle>{label}</CardTitle>
        <CardDescription>{description}</CardDescription>
      </CardHeader>
      <CardContent>
        <div className="flex min-h-[120px] items-center justify-center rounded-lg border border-dashed border-border bg-muted/30">
          <span className="text-sm text-muted-foreground">Placeholder</span>
        </div>
      </CardContent>
    </Card>
  );
}
