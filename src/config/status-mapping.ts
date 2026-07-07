/**
 * TeamPulse
 * Jira Status Configuration
 *
 * Defines how TeamPulse interprets Jira workflow statuses.
 *
 * IMPORTANT:
 * These statuses are business rules.
 * Do NOT hardcode Jira status names anywhere else.
 */

/**
 * Development is considered completed once
 * the developer has handed over work to QA
 * or the work has reached production.
 *
 * These statuses are used for:
 *
 * - Productivity
 * - Execution Efficiency
 * - Contribution
 * - Engineering Score
 */
export const DEVELOPMENT_COMPLETE_STATUSES = [
    "Merge in UAT",
    "Ready for UAT",
    "Ready for Live",
    "Live",
    "Done",
  ] as const;
  
  /**
   * Work currently being executed.
   *
   * Used for:
   * - Future Work In Progress metrics
   * - Delivery Risk
   * - Capacity Planning
   */
  export const ACTIVE_STATUSES = [
    "Open",
    "Ready for Developer",
    "In Progress",
    "In Technical Review",
  ] as const;
  
  /**
   * QA validation workflow.
   *
   * Reserved for future releases.
   */
  export const QA_STATUSES = [
    "Open",
    "Ready for QA",
    "In QA",
    "QA Passed",
  ] as const;
  
  /**
   * Returns true if the issue
   * is considered delivered by TeamPulse.
   */
  export function isDevelopmentComplete(
    status: string
  ): boolean {
    return DEVELOPMENT_COMPLETE_STATUSES.includes(
      status as (typeof DEVELOPMENT_COMPLETE_STATUSES)[number]
    );
  }
  
  /**
   * Returns true if development
   * is currently in progress.
   */
  export function isActiveDevelopment(
    status: string
  ): boolean {
    return ACTIVE_STATUSES.includes(
      status as (typeof ACTIVE_STATUSES)[number]
    );
  }