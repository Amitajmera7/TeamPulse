/**
 * Developer Evaluation & Profile Engine — public module entry.
 *
 * Sprint 3B Milestone 8A aggregates task-evaluation engine outputs into the
 * canonical developer objects used throughout TeamPulse.
 *
 * Does not calculate Engineering Score or ranking (Milestone 8B).
 * Does not modify dashboard services or existing metric engines.
 */

export { buildDeveloperEvaluation } from "./build-developer-evaluation";
export {
  buildDeveloperProfile,
  wrapDeveloperEvaluation,
} from "./build-developer-profile";
export {
  hasCompletedWork,
  resolveDeveloperProfileStatus,
} from "./status";

export type {
  BuildDeveloperEvaluationInput,
  DeveloperEvaluation,
  DeveloperProfile,
  DeveloperProfileStatus,
  ReportingPeriod,
} from "./types";
