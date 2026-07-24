import { PartyPopper } from "lucide-react";

import { EmptyState } from "@/components/dashboard/empty-state";

/**
 * Page-level empty state. The mock roster is never empty, but the branch is
 * real: the read hook selects it whenever `developers[]` arrives empty —
 * a brand new Jira instance, or a filter that matches nobody.
 */
export function AllocationEmptyState() {
  return (
    <EmptyState
      icon={PartyPopper}
      title="No active assignments"
      description="The whole team has open capacity. Nothing is blocking a new assignment right now."
      className="py-4"
    />
  );
}
