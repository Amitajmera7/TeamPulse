/**
 * Developer Evaluation & Profile Engine — public module entry.
 *
 * Sprint 3B Milestone 8A aggregates task-evaluation engine outputs.
 * Sprint 3B Milestone 8B adds Engineering Score, status bands, and dense ranking.
 *
 * Does not modify dashboard services or existing metric engines.
 */

export { buildDeveloperEvaluation } from "./build-developer-evaluation";
export {
  buildDeveloperProfile,
  wrapDeveloperEvaluation,
} from "./build-developer-profile";
export {
  calculateContributionScore,
  calculateEngineeringScore,
  resolveAvailableKpis,
} from "./calculate-engineering-score";
export {
  ENGINEERING_SCORE_CONFIG,
} from "./config";
export { normalizeWeights } from "./normalize-weights";
export { assignDenseRanks } from "./ranking";
export {
  hasCompletedWork,
  resolveDeveloperProfileStatus,
  resolveStatusFromScore,
} from "./status";

export type {
  BuildDeveloperEvaluationInput,
  DeveloperEvaluation,
  DeveloperProfile,
  DeveloperProfileStatus,
  EngineeringScoreComponents,
  EngineeringScoreResult,
  NormalizedWeights,
  ReportingPeriod,
} from "./types";
export type {
  EngineeringScoreConfig,
  EngineeringScoreKpi,
  EngineeringScoreStatusThresholds,
  EngineeringScoreWeights,
  FutureEngineeringScoreKpi,
} from "./config";
