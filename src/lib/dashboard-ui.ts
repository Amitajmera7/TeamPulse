export const dashboardTypography = {
  title: "text-[2.5rem] font-bold leading-[1.1] tracking-tight text-foreground",
  sectionTitle: "text-xl font-semibold tracking-tight text-foreground",
  sectionDescription:
    "mt-1 text-[13px] font-normal leading-relaxed text-muted-foreground",
  cardTitle: "text-[15px] font-semibold tracking-tight text-foreground",
  metricValue: "text-[2.625rem] font-bold leading-none tracking-tight tabular-nums",
  label: "text-[13px] font-medium text-muted-foreground",
  description: "text-[13px] font-normal leading-relaxed text-muted-foreground",
} as const;

export const dashboardCard =
  "rounded-xl border border-border/70 bg-card shadow-[0_1px_2px_oklch(0_0_0/0.04),0_8px_24px_oklch(0_0_0/0.04)] ring-0 transition-all duration-200 ease-out hover:-translate-y-0.5 hover:border-primary/20 hover:shadow-[0_10px_30px_oklch(0_0_0/0.07)]";

export const dashboardCardHeader = "px-5 pt-5 pb-0";
export const dashboardCardContent = "px-5 pb-5 pt-3";
export const dashboardSectionSpacing = "space-y-8";
export const dashboardGridGap = "gap-4";
