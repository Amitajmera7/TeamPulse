"use client";

import { useMemo } from "react";

import type {
  AllocationAssignment,
  AllocationAssignmentGroup,
  AllocationDeveloper,
} from "@/types/allocation";

const UNASSIGNED_GROUP_ID = "unassigned";

/**
 * Groups a flat `assignments[]` collection by assignee.
 *
 * The read model stays normalized (assignments are not nested inside
 * developers), so grouping happens once here and is memoized. Group headers
 * read their totals from the developer record — this hook never sums hours,
 * it only indexes. Unassigned active work becomes its own trailing group so
 * it can never be silently dropped from the table.
 */
export function useAssignmentGroups(
  developers: readonly AllocationDeveloper[],
  assignments: readonly AllocationAssignment[]
): AllocationAssignmentGroup[] {
  return useMemo(() => {
    const byDeveloper = new Map<string, AllocationAssignment[]>();
    const unassigned: AllocationAssignment[] = [];

    for (const developer of developers) {
      byDeveloper.set(developer.id, []);
    }

    for (const assignment of assignments) {
      if (!assignment.assignee) {
        unassigned.push(assignment);
        continue;
      }
      const bucket = byDeveloper.get(assignment.assignee.id);
      if (bucket) {
        bucket.push(assignment);
      } else {
        byDeveloper.set(assignment.assignee.id, [assignment]);
      }
    }

    const groups: AllocationAssignmentGroup[] = developers.map((developer) => ({
      id: developer.id,
      label: developer.displayName,
      developer,
      assignments: byDeveloper.get(developer.id) ?? [],
    }));

    if (unassigned.length > 0) {
      groups.push({
        id: UNASSIGNED_GROUP_ID,
        label: "Unassigned",
        developer: null,
        assignments: unassigned,
      });
    }

    return groups;
  }, [developers, assignments]);
}
