/**
 * Dashboard Aggregator V2 — rule-based Executive Brief.
 *
 * Sprint 3D Milestone 10B. Always emits exactly four insights. No AI.
 */

import type { TechnologyProfile } from "@/services/technology-profile";
import { TECHNOLOGY_STATUS_THRESHOLDS } from "@/services/technology-profile";

import type { EngineeringInsight } from "./types";

/**
 * Selects the technology with the highest Engineering Health.
 * Null health is ignored. Ties break by Engineering Value Delivered DESC,
 * then technology name ASC.
 */
export function selectBestPerformingTechnology(
  profiles: readonly TechnologyProfile[]
): TechnologyProfile | null {
  const scored = profiles.filter(
    (profile) => profile.engineeringHealth !== null
  );

  if (scored.length === 0) {
    return null;
  }

  return [...scored].sort((a, b) => {
    const healthDiff =
      (b.engineeringHealth as number) - (a.engineeringHealth as number);
    if (healthDiff !== 0) {
      return healthDiff;
    }

    if (a.engineeringValueDeliveredHours !== b.engineeringValueDeliveredHours) {
      return b.engineeringValueDeliveredHours - a.engineeringValueDeliveredHours;
    }

    return a.technology.localeCompare(b.technology);
  })[0];
}

/**
 * Selects the technology with the highest Engineering Value Delivered.
 * Ties break by Engineering Health DESC (nulls last), then name ASC.
 */
export function selectHighestValueTechnology(
  profiles: readonly TechnologyProfile[]
): TechnologyProfile | null {
  if (profiles.length === 0) {
    return null;
  }

  return [...profiles].sort((a, b) => {
    if (a.engineeringValueDeliveredHours !== b.engineeringValueDeliveredHours) {
      return b.engineeringValueDeliveredHours - a.engineeringValueDeliveredHours;
    }

    const aHealth = a.engineeringHealth;
    const bHealth = b.engineeringHealth;

    if (aHealth === null && bHealth === null) {
      // fall through
    } else if (aHealth === null) {
      return 1;
    } else if (bHealth === null) {
      return -1;
    } else if (aHealth !== bHealth) {
      return bHealth - aHealth;
    }

    return a.technology.localeCompare(b.technology);
  })[0];
}

/**
 * Selects a technology below the Monitor threshold (engineeringHealth < 60).
 * Prefers the lowest health. Ties break by name ASC.
 */
export function selectAttentionTechnology(
  profiles: readonly TechnologyProfile[]
): TechnologyProfile | null {
  const belowMonitor = profiles.filter(
    (profile) =>
      profile.engineeringHealth !== null &&
      profile.engineeringHealth < TECHNOLOGY_STATUS_THRESHOLDS.monitor
  );

  if (belowMonitor.length === 0) {
    return null;
  }

  return [...belowMonitor].sort((a, b) => {
    const healthDiff =
      (a.engineeringHealth as number) - (b.engineeringHealth as number);
    if (healthDiff !== 0) {
      return healthDiff;
    }

    return a.technology.localeCompare(b.technology);
  })[0];
}

/**
 * Selects the technology with the highest Recovery Hours.
 * Ties break by name ASC.
 */
export function selectRecoveryFocusTechnology(
  profiles: readonly TechnologyProfile[]
): TechnologyProfile | null {
  if (profiles.length === 0) {
    return null;
  }

  return [...profiles].sort((a, b) => {
    if (a.recoveryHours !== b.recoveryHours) {
      return b.recoveryHours - a.recoveryHours;
    }

    return a.technology.localeCompare(b.technology);
  })[0];
}

/**
 * Returns true when every technology profile has status Healthy.
 * Empty technology lists are not considered all-healthy.
 */
export function allTechnologiesHealthy(
  profiles: readonly TechnologyProfile[]
): boolean {
  return (
    profiles.length > 0 &&
    profiles.every((profile) => profile.status === "Healthy")
  );
}

/**
 * Builds exactly four Executive Brief insights from Technology Profiles.
 *
 * 1. Best Performing Technology
 * 2. Highest Engineering Value Delivered
 * 3. Engineering Attention (or all-healthy / stable-or-above message)
 * 4. Recovery Focus
 */
export function buildExecutiveBrief(
  technologyProfiles: readonly TechnologyProfile[]
): EngineeringInsight[] {
  const best = selectBestPerformingTechnology(technologyProfiles);
  const highestValue = selectHighestValueTechnology(technologyProfiles);
  const attention = selectAttentionTechnology(technologyProfiles);
  const recoveryFocus = selectRecoveryFocusTechnology(technologyProfiles);

  const insight1: EngineeringInsight = best
    ? {
        id: "best-technology",
        title: "Best Performing Technology",
        description: `${best.technology} leads with Engineering Health of ${formatHealth(best.engineeringHealth)}.`,
        tone: "success",
      }
    : {
        id: "best-technology",
        title: "Best Performing Technology",
        description:
          "No technology health scores are available for this reporting period.",
        tone: "info",
      };

  const insight2: EngineeringInsight = highestValue
    ? {
        id: "highest-value",
        title: "Highest Engineering Value Delivered",
        description: `${highestValue.technology} delivered ${formatHours(highestValue.engineeringValueDeliveredHours)} of engineering value.`,
        tone: "info",
      }
    : {
        id: "highest-value",
        title: "Highest Engineering Value Delivered",
        description:
          "No engineering value was delivered in this reporting period.",
        tone: "info",
      };

  const insight3: EngineeringInsight = attention
    ? {
        id: "engineering-attention",
        title: "Engineering Attention",
        description: `${attention.technology} is below the Monitor threshold with Engineering Health of ${formatHealth(attention.engineeringHealth)}. Prioritize recovery of delivery health.`,
        tone: "warning",
      }
    : allTechnologiesHealthy(technologyProfiles)
      ? {
          id: "engineering-attention",
          title: "Engineering Attention",
          description:
            "All engineering teams maintained Healthy status this reporting period.",
          tone: "success",
        }
      : {
          id: "engineering-attention",
          title: "Engineering Attention",
          description:
            "All engineering teams maintained Stable status or above this reporting period.",
          tone: "info",
        };

  const insight4: EngineeringInsight =
    recoveryFocus && recoveryFocus.recoveryHours > 0
      ? {
          id: "recovery-focus",
          title: "Recovery Focus",
          description: `${recoveryFocus.technology} recorded the highest recovery effort at ${formatHours(recoveryFocus.recoveryHours)}.`,
          tone: "warning",
        }
      : {
          id: "recovery-focus",
          title: "Recovery Focus",
          description:
            "No recovery effort was recorded across technologies this reporting period.",
          tone: "info",
        };

  return [insight1, insight2, insight3, insight4];
}

function formatHealth(value: number | null): string {
  if (value === null) {
    return "—";
  }

  return Number.isInteger(value) ? String(value) : value.toFixed(1);
}

function formatHours(value: number): string {
  if (Number.isInteger(value)) {
    return `${value}h`;
  }

  return `${value.toFixed(1)}h`;
}
