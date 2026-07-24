import { projectColor } from "@/components/allocation/allocation-palette";
import { Badge } from "@/components/ui/badge";
import { cn } from "@/lib/utils";
import type {
  AllocationIssueStatus,
  AllocationIssueType,
  AllocationProjectRef,
  AllocationStatusCategory,
} from "@/types/allocation";

interface ProjectBadgeProps {
  project: AllocationProjectRef;
  showName?: boolean;
}

export function ProjectBadge({ project, showName = false }: ProjectBadgeProps) {
  return (
    <Badge variant="outline" className="gap-1.5 font-medium" title={project.name}>
      <span
        className="size-1.5 rounded-full"
        style={{ backgroundColor: projectColor(project.key) }}
        aria-hidden
      />
      {showName ? project.name : project.key}
    </Badge>
  );
}

/**
 * Coloured by Jira status *category* (a fixed set of three in every instance)
 * and labelled with the instance's own status name.
 */
const CATEGORY_STYLE: Record<AllocationStatusCategory, string> = {
  "to-do": "border-border text-muted-foreground",
  "in-progress": "border-primary/25 bg-primary/8 text-primary",
  done: "border-border bg-muted/50 text-muted-foreground",
};

export function AssignmentStatusPill({ status }: { status: AllocationIssueStatus }) {
  return (
    <Badge variant="outline" className={cn("font-medium", CATEGORY_STYLE[status.category])}>
      {status.name}
    </Badge>
  );
}

export function IssueTypeLabel({ issueType }: { issueType: AllocationIssueType }) {
  return (
    <span className="text-[11px] font-medium tracking-wide text-muted-foreground">
      {issueType.name}
    </span>
  );
}
