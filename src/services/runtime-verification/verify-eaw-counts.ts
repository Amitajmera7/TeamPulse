/**
 * EAW-layer counts vs Jira baseline (eligible subset).
 */

import type { EngineeringWarehouseModel } from "@/services/engineering-warehouse";

import type { JiraCountSnapshot } from "./verify-jira-counts";
import {
  countCheck,
  nearlyEqual,
  sectionFromChecks,
  type VerificationSection,
} from "./types";

export interface EawCountSnapshot {
  readonly issueCount: number;
  readonly worklogCount: number;
  readonly allocationCount: number;
  readonly developerCount: number;
  readonly technologyCount: number;
  readonly engineeringHours: number;
}

export function collectEawCounts(
  model: EngineeringWarehouseModel
): EawCountSnapshot {
  const developers = new Set(model.allocations.map((row) => row.developer));
  const technologies = new Set(
    model.allocations.map((row) => row.technology).filter(Boolean)
  );
  const engineeringHours = model.worklogs.reduce(
    (total, row) => total + row.hours,
    0
  );

  return {
    issueCount: model.issues.length,
    worklogCount: model.worklogs.length,
    allocationCount: model.allocations.length,
    developerCount: developers.size,
    technologyCount: technologies.size,
    engineeringHours,
  };
}

/**
 * Verifies EAW counts against Jira (issues exact; worklogs/hours vs eligible).
 */
export function verifyEawCounts(
  model: EngineeringWarehouseModel | null,
  jira: JiraCountSnapshot
): { section: VerificationSection; snapshot: EawCountSnapshot | null } {
  if (model == null) {
    return {
      snapshot: null,
      section: sectionFromChecks("EAW", [
        {
          label: "Model",
          actual: "missing",
          expected: "present",
          passed: false,
          detail: "EngineeringWarehouseModel was not provided",
        },
      ]),
    };
  }

  const snapshot = collectEawCounts(model);

  const section = sectionFromChecks("EAW", [
    countCheck("Issues", snapshot.issueCount, jira.issueCount),
    countCheck(
      "Worklogs",
      snapshot.worklogCount,
      jira.eligibleWorklogCount,
      "Compared to eligible Jira worklogs (hours > 0)"
    ),
    countCheck("Allocations", snapshot.allocationCount, null),
    countCheck("Developers", snapshot.developerCount, jira.developerCount),
    countCheck(
      "Technologies",
      snapshot.technologyCount,
      jira.technologyCount
    ),
    {
      label: "Engineering Hours",
      actual: snapshot.engineeringHours.toFixed(4),
      expected: jira.eligibleEngineeringHours.toFixed(4),
      passed: nearlyEqual(
        snapshot.engineeringHours,
        jira.eligibleEngineeringHours,
        0.01
      ),
      detail: "Compared to eligible Jira engineering hours (±0.01h)",
    },
    countCheck(
      "Batch worklogsProcessed",
      model.syncBatch.worklogsProcessed,
      snapshot.worklogCount
    ),
    countCheck(
      "Batch issuesProcessed",
      model.syncBatch.issuesProcessed,
      snapshot.issueCount
    ),
  ]);

  return { section, snapshot };
}
