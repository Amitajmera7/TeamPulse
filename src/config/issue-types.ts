/**
 * TeamPulse
 * Issue Type Configuration
 *
 * Defines how TeamPulse classifies Jira issue types.
 *
 * IMPORTANT:
 * Never hardcode issue type names in services.
 * Always use these configuration groups.
 */

/**
 * Planned engineering work.
 *
 * Included in:
 * - Productivity
 * - Execution Efficiency
 * - Contribution
 * - Engineering Score
 */
export const FEATURE_TYPES = [
    "Magento",
    "React JS",
    "HTML",
    "DT",
    "CR",
    "RE",
  ] as const;
  
  /**
   * Bug fixing work.
   *
   * Included in:
   * - Quality
   * - Recovery Effort
   * - Technology Health
   * - Executive Brief
   *
   * Excluded from:
   * - Productivity
   * - Contribution
   * - Execution Efficiency
   */
  export const BUG_TYPES = [
    "QA Bug",
    "UAT Bug",
  ] as const;
  
  /**
   * QA operational work.
   *
   * Currently informational only.
   *
   * Future:
   * - QA Productivity
   * - QA Dashboard
   */
  export const QA_TYPES = [
    "QA Task",
  ] as const;
  
  /**
   * Returns true if the issue
   * is planned feature work.
   */
  export function isFeatureWork(
    issueType: string
  ): boolean {
    return FEATURE_TYPES.includes(
      issueType as (typeof FEATURE_TYPES)[number]
    );
  }
  
  /**
   * Returns true if the issue
   * is bug fixing work.
   */
  export function isBugWork(
    issueType: string
  ): boolean {
    return BUG_TYPES.includes(
      issueType as (typeof BUG_TYPES)[number]
    );
  }
  
  /**
   * Returns true if the issue
   * belongs to QA operations.
   */
  export function isQaTask(
    issueType: string
  ): boolean {
    return QA_TYPES.includes(
      issueType as (typeof QA_TYPES)[number]
    );
  }