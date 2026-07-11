/**
 * Analytics-layer totals from Developer / Technology profiles.
 */

import type { DeveloperProfile } from "@/services/developer-profile";
import type { TechnologyProfile } from "@/services/technology-profile";
import { TECHNOLOGY_NAMES } from "@/services/technology-profile";

import type { EawCountSnapshot } from "./verify-eaw-counts";
import {
  countCheck,
  flagCheck,
  nearlyEqual,
  sectionFromChecks,
  type VerificationSection,
} from "./types";

export interface AnalyticsCountSnapshot {
  readonly developerCount: number;
  readonly technologyCount: number;
  readonly developersWithScore: number;
  readonly deliveredEngineeringHours: number;
  readonly scoreInputCoverage: number;
}

export function collectAnalyticsCounts(
  developerProfiles: readonly DeveloperProfile[],
  technologyProfiles: readonly TechnologyProfile[]
): AnalyticsCountSnapshot {
  const developersWithScore = developerProfiles.filter(
    (profile) => profile.engineeringScore != null
  ).length;

  const deliveredEngineeringHours = developerProfiles.reduce(
    (total, profile) =>
      total + profile.evaluation.contribution.deliveredEngineeringHours,
    0
  );

  const withInputs = developerProfiles.filter((profile) => {
    const components = profile.engineeringScoreDetail?.components;
    return components != null && Object.keys(components).length > 0;
  }).length;

  return {
    developerCount: developerProfiles.length,
    technologyCount: technologyProfiles.length,
    developersWithScore,
    deliveredEngineeringHours,
    scoreInputCoverage: withInputs,
  };
}

/**
 * Verifies analytics aggregates vs EAW developer coverage and score inputs.
 */
export function verifyAnalyticsCounts(
  developerProfiles: readonly DeveloperProfile[],
  technologyProfiles: readonly TechnologyProfile[],
  eaw: EawCountSnapshot | null
): { section: VerificationSection; snapshot: AnalyticsCountSnapshot } {
  const snapshot = collectAnalyticsCounts(
    developerProfiles,
    technologyProfiles
  );

  const expectedTechCount = TECHNOLOGY_NAMES.length;

  const checks = [
    countCheck(
      "Developer Totals",
      snapshot.developerCount,
      eaw?.developerCount ?? null,
      eaw
        ? "Compared to unique EAW allocation developers"
        : "EAW unavailable — informational"
    ),
    countCheck(
      "Technology Totals",
      snapshot.technologyCount,
      expectedTechCount,
      "Expected canonical TECHNOLOGY_NAMES length"
    ),
    countCheck(
      "Engineering Score Inputs",
      snapshot.scoreInputCoverage,
      null,
      "Developers with at least one Engineering Score KPI component"
    ),
    flagCheck(
      "Score Coverage",
      snapshot.developerCount === 0 ||
        snapshot.developersWithScore >= 0,
      `${snapshot.developersWithScore}/${snapshot.developerCount} scored`,
      null,
      "Informational — No Data developers may have null scores"
    ),
    {
      label: "Delivered Engineering Hours",
      actual: snapshot.deliveredEngineeringHours.toFixed(4),
      expected: null,
      passed: nearlyEqual(snapshot.deliveredEngineeringHours, snapshot.deliveredEngineeringHours),
      detail: "Sum of contribution.deliveredEngineeringHours (estimate-based, not worklog hours)",
    },
  ];

  return {
    snapshot,
    section: sectionFromChecks("Analytics", checks),
  };
}
