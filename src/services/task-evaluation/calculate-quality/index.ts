/**
 * Delivery Quality Engine — public module entry.
 */

export { calculateQuality, getBaseQualityScore, getFeatureIssueType } from "./calculate-quality";
export { collectQualityBugs, countBugsByType } from "./bug-sources";
export {
  allocateQualityPenalties,
  calculateFeaturePenalties,
  computeAllocationPercentage,
  resolveFeatureWorklogHours,
} from "./allocate-quality-penalty";
export {
  BASE_QUALITY_SCORE,
  calculateQualityScore,
  resolveQualityRating,
} from "./quality-score";

export type {
  BugType,
  QualityBugRecord,
  QualityInput,
  QualityRating,
  QualityReason,
  QualityResult,
} from "./types";

export { DELIVERY_QUALITY_PENALTIES } from "./types";
