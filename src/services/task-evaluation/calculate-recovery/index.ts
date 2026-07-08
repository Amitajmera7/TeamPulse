/**
 * Recovery Engine — public module entry.
 */

export { calculateRecovery } from "./calculate-recovery";
export {
  classifyRecoveryBugType,
  collectRecoveryBugs,
  dedupeBugIssuesByKey,
  recoveryBugHasWorklogs,
  sumBugRecoveryHours,
  sumDeveloperBugRecoveryHours,
} from "./bug-worklog-sources";
export {
  calculateDeveloperRecoveryHours,
  calculateTotalRecoveryHours,
} from "./recovery-hours";
export {
  calculateRecoveryPercentage,
  RECOVERY_RATING_THRESHOLDS,
  resolveRecoveryRating,
} from "./recovery-percentage";

export type {
  RecoveryBugType,
  RecoveryHoursBreakdown,
  RecoveryInput,
  RecoveryRating,
  RecoveryResult,
} from "./types";
