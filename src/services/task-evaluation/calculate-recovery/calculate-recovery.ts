import {
  calculateDeveloperRecoveryHours,
  calculateTotalRecoveryHours,
} from "./recovery-hours";
import {
  calculateRecoveryPercentage,
  resolveRecoveryRating,
} from "./recovery-percentage";
import type { RecoveryInput, RecoveryResult } from "./types";

/**
 * Recovery Engine
 * ===============
 *
 * Measures engineering effort spent fixing QA / UAT defects.
 *
 * This is an informational metric — it does not reduce Engineering Score,
 * Execution Efficiency, Delivery Quality, or Contribution.
 *
 * Pipeline:
 * 1. Collect QA / UAT bugs with worklogs (reopened bugs deduped for counts).
 * 2. Sum developer worklog hours directly (no proportional allocation).
 * 3. Sum total recovery hours across all developers on the same bug set.
 * 4. recoveryPercentage = developerHours / totalHours × 100
 * 5. Map percentage to Low / Medium / High rating.
 */
export function calculateRecovery(input: RecoveryInput): RecoveryResult {
  const { developer, linkedBugs } = input;

  const developerRecovery = calculateDeveloperRecoveryHours(
    linkedBugs,
    developer
  );
  const scopeTotalRecoveryHours = calculateTotalRecoveryHours(linkedBugs);

  const recoveryPercentage = calculateRecoveryPercentage(
    developerRecovery.totalRecoveryHours,
    scopeTotalRecoveryHours
  );

  return {
    resolved: true,
    qaRecoveryHours: developerRecovery.qaRecoveryHours,
    uatRecoveryHours: developerRecovery.uatRecoveryHours,
    totalRecoveryHours: developerRecovery.totalRecoveryHours,
    qaBugCount: developerRecovery.qaBugCount,
    uatBugCount: developerRecovery.uatBugCount,
    recoveryPercentage,
    rating: resolveRecoveryRating(recoveryPercentage),
  };
}
