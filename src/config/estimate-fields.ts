import type { Technology } from "./technologies";

/**
 * TeamPulse
 * Estimate Resolution Configuration
 *
 * Defines which Jira estimate field should be used
 * for each technology when resolving estimates for
 * CR / RE issues.
 *
 * NOTE:
 * Feature issues (Magento, React JS, HTML, DT)
 * always use Jira Original Estimate.
 */

export const ESTIMATE_FIELDS: Record<Technology, string> = {
  Magento: "customfield_10326",
  "React JS": "customfield_10327",
  HTML: "customfield_10328",
  DT: "customfield_10329",
};

/**
 * Returns the custom estimate field
 * for a developer technology.
 */
export function getEstimateField(
  technology: Technology
): string {
  return ESTIMATE_FIELDS[technology];
}