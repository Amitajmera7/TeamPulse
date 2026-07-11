/**
 * Engineering Score configuration (Sprint 3B Milestone 8B).
 *
 * Score calculation must consume this object — never hardcode weights,
 * capacity, or status thresholds in formula code.
 */

/** Implemented KPI keys that currently participate in Engineering Score. */
export type EngineeringScoreKpi = "execution" | "quality" | "contribution";

/**
 * Future KPIs — ignored until implemented.
 * Listed here for documentation only; not included in {@link ENGINEERING_SCORE_CONFIG.weights}.
 */
export type FutureEngineeringScoreKpi =
  | "compliance"
  | "utilization"
  | "aiInsights";

/** Status band thresholds (score ≥ threshold maps to that band). */
export interface EngineeringScoreStatusThresholds {
  /** Score ≥ this value → Healthy. */
  healthy: number;
  /** Score ≥ this value (and < healthy) → Good. */
  good: number;
  /** Score ≥ this value (and < good) → Needs Attention. Below → Critical. */
  needsAttention: number;
}

/** Raw (pre-normalization) weights for implemented KPIs. */
export interface EngineeringScoreWeights {
  execution: number;
  quality: number;
  contribution: number;
}

export interface EngineeringScoreConfig {
  /**
   * Raw weights for implemented KPIs.
   *
   * Dynamic normalization redistributes these across only the KPIs
   * available for a given developer. Never hardcode normalized %.
   */
  weights: EngineeringScoreWeights;
  /** Expected engineering capacity hours for the reporting period. */
  expectedEngineeringCapacityHours: number;
  /** Profile status bands derived from Engineering Score. */
  statusThresholds: EngineeringScoreStatusThresholds;
}

/**
 * Canonical Engineering Score configuration.
 *
 * Current implemented KPI weights: Execution 25, Quality 25, Contribution 20.
 * Future KPIs (Compliance, Utilization, AI Insights) are omitted until ready.
 */
export const ENGINEERING_SCORE_CONFIG: EngineeringScoreConfig = {
  weights: {
    execution: 25,
    quality: 25,
    contribution: 20,
  },
  expectedEngineeringCapacityHours: 160,
  statusThresholds: {
    healthy: 90,
    good: 75,
    needsAttention: 60,
  },
};
