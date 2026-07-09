/**
 * Developer Evaluation & Profile — type definitions.
 *
 * Milestone 8A aggregates task-evaluation engine outputs into the canonical
 * developer objects used throughout TeamPulse.
 *
 * Engineering Score is intentionally excluded (Sprint 3B Milestone 8B).
 */

import type { ReportingPeriod } from "@/services/dashboard/types";
import type {
  ContributionResult,
  ExecutionEfficiencyResult,
  QualityResult,
  RecoveryResult,
} from "@/services/task-evaluation/task-evaluation";

export type { ReportingPeriod };

/**
 * Profile health status for a developer in the reporting period.
 *
 * Score-band mapping (Healthy / Good / Needs Attention / Critical) is
 * provisional in Milestone 8A. Milestone 8B will derive these from
 * Engineering Score. "No Data" means no completed engineering work.
 */
export type DeveloperProfileStatus =
  | "Healthy"
  | "Good"
  | "Needs Attention"
  | "Critical"
  | "No Data";

/**
 * Aggregation of all implemented task-evaluation engine results for one
 * developer in one reporting period.
 *
 * Engine outputs remain intact — they are never flattened into primitives.
 * Recovery is included for visibility and does not affect Engineering Score.
 */
export interface DeveloperEvaluation {
  /** Developer display name (Jira worklog author). */
  developer: string;
  /**
   * Technology from team mapping.
   * Empty string when technology mapping is missing.
   */
  technology: string;
  /** Reporting window for this evaluation. */
  reportingPeriod: ReportingPeriod;
  /** Execution Efficiency engine result (intact). */
  execution: ExecutionEfficiencyResult;
  /** Delivery Quality engine result (intact). */
  quality: QualityResult;
  /**
   * Recovery engine result (intact).
   * Informational only — never feeds Engineering Score.
   */
  recovery: RecoveryResult;
  /** Business Contribution engine result (intact). */
  contribution: ContributionResult;
}

/**
 * Canonical developer object used throughout TeamPulse.
 *
 * Wraps {@link DeveloperEvaluation} with a profile status.
 *
 * Extension point (Milestone 8B): attach Engineering Score here without
 * changing the evaluation aggregation contract. Ranking is also deferred.
 */
export interface DeveloperProfile {
  evaluation: DeveloperEvaluation;
  status: DeveloperProfileStatus;
  /**
   * Reserved for Sprint 3B Milestone 8B.
   *
   * When Engineering Score is introduced, extend this interface (or a
   * dedicated subtype) with an `engineeringScore` field. Do not compute
   * or attach a score in Milestone 8A.
   */
  // engineeringScore?: EngineeringScore;
}

/** Inputs required to assemble a {@link DeveloperEvaluation}. */
export interface BuildDeveloperEvaluationInput {
  developer: string;
  /**
   * Technology from team mapping.
   * Pass an empty string when mapping is missing — do not invent a value.
   */
  technology: string;
  reportingPeriod: ReportingPeriod;
  /** Intact Execution Efficiency result. */
  execution: ExecutionEfficiencyResult;
  /** Intact Delivery Quality result. */
  quality: QualityResult;
  /** Intact Recovery result. */
  recovery: RecoveryResult;
  /** Intact Business Contribution result. */
  contribution: ContributionResult;
}
