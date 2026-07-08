/**
 * Task Evaluation Engine — public module entry.
 *
 * Milestone 1 exposes factual task evaluation orchestration only.
 * Calculation modules are stubbed for future milestones.
 */

export { calculateContribution } from "./calculate-contribution";
export { calculateEfficiency, calculateEfficiencyForIssue } from "./calculate-efficiency";
export { resolveAllocationDenominatorHours } from "./allocation-context";
export {
  calculateQuality,
  getBaseQualityScore,
} from "./calculate-quality";
export { evaluateTask } from "./evaluate-task";
export { resolveEstimate } from "./resolve-estimate";
export { resolveWorklogs } from "./resolve-worklogs";

export type {
  BugType,
  QualityBugRecord,
  QualityInput,
  QualityRating,
  QualityReason,
  QualityResult,
} from "./calculate-quality";
export type {
  EfficiencyRating,
  EstimateSource,
  EvaluateTaskOptions,
  ExecutionEfficiencyInput,
  ExecutionEfficiencyReason,
  ExecutionEfficiencyResult,
  JiraIssueInput,
  ResolvedEstimate,
  ResolvedWorklogs,
  TaskEvaluation,
  TaskWorklog,
} from "./types";
