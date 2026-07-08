/** Version 1 delivery quality penalties (Sprint 3B Milestone 5). */
export const DELIVERY_QUALITY_PENALTIES = {
  QA_BUG: 5,
  UAT_BUG: 8,
} as const;

export type QualityRating =
  | "Excellent"
  | "Very Good"
  | "On Track"
  | "Needs Improvement"
  | "Critical"
  | "Unresolved";

export type QualityReason =
  | "feature-not-complete"
  | "missing-feature-worklogs";

export type BugType = "QA Bug" | "UAT Bug";

/** A qualifying QA or UAT bug linked to completed feature work. */
export interface QualityBugRecord {
  issueKey: string;
  bugType: BugType;
}

/** Inputs for delivery quality calculation. */
export interface QualityInput {
  developer: string;
  /** Completed engineering feature work item. */
  featureIssue: import("../types").JiraIssueInput;
  /** QA / UAT bugs linked to the feature work item. */
  linkedBugs: import("../types").JiraIssueInput[];
}

/** Output of the Delivery Quality Engine. */
export interface QualityResult {
  resolved: boolean;
  reason?: QualityReason;
  qualityScore: number;
  qaBugCount: number;
  uatBugCount: number;
  /** Developer's proportional share of QA penalties. */
  qaPenalty: number;
  /** Developer's proportional share of UAT penalties. */
  uatPenalty: number;
  /** Sum of developer QA + UAT proportional penalties. */
  totalPenalty: number;
  /** Developer penalty after proportional allocation. */
  proportionalPenalty: number;
  /** Developer's share of feature worklog hours (0–1). */
  allocationPercentage: number;
  rating: QualityRating;
}
