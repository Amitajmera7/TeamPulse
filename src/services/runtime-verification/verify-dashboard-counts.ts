/**
 * Dashboard-layer verification against Analytics outputs.
 */

import { buildDashboardData } from "@/services/dashboard/build-dashboard-data";
import type { DashboardData } from "@/services/dashboard/types";
import type { DeveloperProfile } from "@/services/developer-profile";
import type { TechnologyProfile } from "@/services/technology-profile";
import {
  weightedAverageEngineeringScore,
} from "@/services/dashboard/build-kpis";

import {
  flagCheck,
  nearlyEqual,
  sectionFromChecks,
  type VerificationSection,
} from "./types";

export interface DashboardVerificationInput {
  readonly dashboardData: DashboardData;
  readonly developerProfiles: readonly DeveloperProfile[];
  readonly technologyProfiles: readonly TechnologyProfile[];
  readonly reportingPeriod: {
    readonly month: string;
    readonly from: string;
    readonly to: string;
  };
  readonly generatedAt: string;
}

/**
 * Rebuilds DashboardData from analytics profiles and compares to the provided
 * dashboard projection (no UI changes).
 */
export function verifyDashboardCounts(
  input: DashboardVerificationInput
): VerificationSection {
  const rebuilt = buildDashboardData({
    developerProfiles: input.developerProfiles,
    technologyProfiles: input.technologyProfiles,
    reportingPeriod: input.reportingPeriod,
    generatedAt: input.generatedAt,
  });

  const expectedScore = weightedAverageEngineeringScore(
    input.developerProfiles
  );
  const expectedScoreRounded =
    expectedScore == null ? 0 : Math.round(expectedScore);

  const scoreMatches =
    input.dashboardData.engineeringScore.value === rebuilt.engineeringScore.value &&
    input.dashboardData.engineeringScore.value === expectedScoreRounded;

  const contributorNames = input.dashboardData.contributors.map((row) => row.name);
  const rebuiltNames = rebuilt.contributors.map((row) => row.name);
  const contributorsMatch =
    contributorNames.length === rebuiltNames.length &&
    contributorNames.every((name, index) => name === rebuiltNames[index]);

  const techMatches =
    input.dashboardData.technologies.length === rebuilt.technologies.length &&
    input.dashboardData.technologies.every((card, index) => {
      const other = rebuilt.technologies[index];
      return (
        other != null &&
        card.name === other.name &&
        card.healthScore === other.healthScore &&
        nearlyEqual(card.hours, other.hours, 0.5)
      );
    });

  return sectionFromChecks("Dashboard", [
    flagCheck(
      "Engineering Score",
      scoreMatches,
      String(input.dashboardData.engineeringScore.value),
      String(rebuilt.engineeringScore.value),
      "Dashboard value vs rebuild from analytics profiles"
    ),
    flagCheck(
      "Top Contributors",
      contributorsMatch,
      `${contributorNames.length} rows`,
      `${rebuiltNames.length} rows`,
      contributorsMatch
        ? "Contributor order/names match rebuild"
        : "Contributor list differs from analytics rebuild"
    ),
    flagCheck(
      "Technologies",
      techMatches,
      `${input.dashboardData.technologies.length} cards`,
      `${rebuilt.technologies.length} cards`,
      "Technology cards match analytics rebuild"
    ),
    flagCheck(
      "Reporting Period",
      input.dashboardData.reportingPeriod.month ===
        input.reportingPeriod.month,
      input.dashboardData.reportingPeriod.month,
      input.reportingPeriod.month
    ),
  ]);
}
