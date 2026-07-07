import { cn } from "@/lib/utils";

interface MetadataChipProps {
  value: string;
  label?: string;
  className?: string;
}

export function MetadataChip({ value, label, className }: MetadataChipProps) {
  return (
    <div
      className={cn(
        "inline-flex flex-col rounded-lg border border-border bg-background px-2.5 py-1.5",
        className
      )}
    >
      {label && (
        <span className="text-[10px] font-medium tracking-wide text-muted-foreground uppercase">
          {label}
        </span>
      )}
      <span className="text-xs font-medium text-foreground">{value}</span>
    </div>
  );
}
