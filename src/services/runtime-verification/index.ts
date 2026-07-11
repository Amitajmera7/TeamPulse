/**
 * Runtime Verification — public module entry.
 *
 * Sprint 6A Milestone 15: verification and reporting only.
 * Not wired into orchestrator runtime (no behavior change).
 */

export type {
  VerificationCheck,
  VerificationReport,
  VerificationSection,
  VerificationStatus,
} from "./types";

export type { JiraCountSnapshot } from "./verify-jira-counts";
export type { EawCountSnapshot } from "./verify-eaw-counts";
export type { AnalyticsCountSnapshot } from "./verify-analytics-counts";
export type { RuntimeVerificationInput } from "./run-runtime-verification";

export { collectJiraCounts, verifyJiraCounts } from "./verify-jira-counts";
export { collectEawCounts, verifyEawCounts } from "./verify-eaw-counts";
export {
  collectAnalyticsCounts,
  verifyAnalyticsCounts,
} from "./verify-analytics-counts";
export { verifyDashboardCounts } from "./verify-dashboard-counts";
export {
  buildVerificationReport,
  formatDetailedVerificationReport,
  formatVerificationSummary,
} from "./build-verification-report";
export { runRuntimeVerification } from "./run-runtime-verification";
