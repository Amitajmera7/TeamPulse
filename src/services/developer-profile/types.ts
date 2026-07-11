/**
 * Developer Evaluation & Profile — type definitions.
 *
 * Milestone 8A aggregates task-evaluation engine outputs.
 * Milestone 8B attaches Engineering Score, status bands, and dense ranking.
 */

import type { ReportingPeriod } from "@/services/dashboard/types";
import type {
  ContributionResult,
  ExecutionEfficiencyResult,
  QualityResult,
  RecoveryResult,
} from "@/services/task-evaluation/task-evaluation";
import type { EngineeringScoreKpi } from "./config";

export type { ReportingPeriod };

/**
 * Profile health status for a developer in the reporting period.
 *
 * Derived from Engineering Score bands (Milestone 8B), except "No Data"
 * when the developer has no completed engineering work / no available KPIs.
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
 * Per-KPI component scores that participated in Engineering Score.
 * Missing KPIs are omitted (never coerced to zero).
 */
export type EngineeringScoreComponents = Partial<
  Record<EngineeringScoreKpi, number>
>;

/**
 * Normalized weight map for the KPIs available on a developer.
 * Values sum to 1 when at least one KPI is available.
 */
export type NormalizedWeights = Partial<Record<EngineeringScoreKpi, number>>;

/** Output of the Engineering Score Engine. */
export interface EngineeringScoreResult {
  /**
   * Full-precision Engineering Score (0–100 scale).
   * Null when no implemented KPIs are available (No Data).
   */
  score: number | null;
  /** Component scores used (only available KPIs). */
  components: EngineeringScoreComponents;
  /** Dynamically normalized weights that summed to the score. */
  normalizedWeights: NormalizedWeights;
}

/**
 * Canonical developer object used throughout TeamPulse.
 *
 * Wraps {@link DeveloperEvaluation} with Engineering Score, status, and
 * optional dense rank (assigned by assignDenseRanks).
 */
export interface DeveloperProfile {
  evaluation: DeveloperEvaluation;
  status: DeveloperProfileStatus;
  /**
   * Full-precision Engineering Score (0–100).
   * Null when no implemented KPIs are available (No Data).
   */
  engineeringScore: number | null;
  /**
   * Explainable score breakdown (components + normalized weights).
   * Null when Engineering Score could not be calculated.
   */
  engineeringScoreDetail: EngineeringScoreResult | null;
  /**
   * Dense rank among peers (1 = highest score).
   * Null until assignDenseRanks runs, or when score is null.
   */
  rank: number | null;
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
