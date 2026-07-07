/**
 * TeamPulse
 * Quality Configuration
 *
 * Defines how TeamPulse evaluates engineering quality.
 *
 * IMPORTANT:
 * These are product rules, not technical rules.
 * Changes should be reviewed by Product.
 */

/**
 * Quality score penalties.
 *
 * Every developer starts from 100.
 * Penalties are applied based on completed work.
 */
export const QUALITY_RULES = {
    qaBugPenalty: 5,
  
    uatBugPenalty: 10,
  
    reopenedPenalty: 8,
  } as const;
  
  /**
   * Recovery Effort thresholds.
   *
   * Recovery Effort =
   *
   * QA Bug Hours + UAT Bug Hours
   * ----------------------------
   * Total Logged Hours
   */
  export const RECOVERY_EFFORT = {
    excellent: 10,
    healthy: 20,
    attention: 30,
  } as const;
  
  /**
   * Returns Recovery Effort status.
   */
  export function getRecoveryStatus(
    percentage: number
  ):
    | "Excellent"
    | "Healthy"
    | "Needs Attention"
    | "Critical" {
  
    if (percentage < RECOVERY_EFFORT.excellent) {
      return "Excellent";
    }
  
    if (percentage < RECOVERY_EFFORT.healthy) {
      return "Healthy";
    }
  
    if (percentage < RECOVERY_EFFORT.attention) {
      return "Needs Attention";
    }
  
    return "Critical";
  }