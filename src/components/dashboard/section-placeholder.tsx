import { cn } from "@/lib/utils";
import type { SectionPlaceholderProps } from "@/types/layout";

const COLUMN_CLASSES: Record<
  NonNullable<SectionPlaceholderProps["columns"]>,
  string
> = {
  1: "grid-cols-1",
  2: "grid-cols-1 md:grid-cols-2",
  3: "grid-cols-1 md:grid-cols-2 xl:grid-cols-3",
  4: "grid-cols-1 sm:grid-cols-2 xl:grid-cols-4",
};

export function SectionPlaceholder({
  title,
  description,
  columns = 4,
  children,
}: SectionPlaceholderProps) {
  return (
    <section className="space-y-4">
      <div>
        <h2 className="text-lg font-semibold text-foreground">{title}</h2>
        {description && (
          <p className="mt-1 text-sm text-muted-foreground">{description}</p>
        )}
      </div>
      <div className={cn("grid gap-6", COLUMN_CLASSES[columns])}>{children}</div>
    </section>
  );
}
