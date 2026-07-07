/**
 * Task Evaluation Engine — public module entry.
 *
 * Milestone 1 exposes factual task evaluation orchestration only.
 * Calculation modules are stubbed for future milestones.
 */

export { calculateContribution } from "./calculate-contribution";
export { calculateEfficiency } from "./calculate-efficiency";
export { calculateQuality } from "./calculate-quality";
export { evaluateTask } from "./evaluate-task";
export { resolveEstimate } from "./resolve-estimate";
export { resolveWorklogs } from "./resolve-worklogs";

export type {
  EstimateSource,
  EvaluateTaskOptions,
  JiraIssueInput,
  ResolvedEstimate,
  ResolvedWorklogs,
  TaskEvaluation,
  TaskWorklog,
} from "./types";
