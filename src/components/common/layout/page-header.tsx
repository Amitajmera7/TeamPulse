import type { PageHeaderProps } from "@/types/layout";

export function PageHeader({ title, description }: PageHeaderProps) {
  return (
    <div className="border-b border-border bg-background px-4 py-3 lg:px-6">
      <div className="mx-auto max-w-[1440px] space-y-1">
        <h1 className="text-xl font-semibold tracking-tight text-foreground">
          {title}
        </h1>
        {description && (
          <p className="text-xs text-muted-foreground">{description}</p>
        )}
      </div>
    </div>
  );
}
