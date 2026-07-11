/**
 * Format verification text for Batch Explorer (derived from ops entry).
 */

import type { SyncHistoryEntry } from "./types";

export function formatHistoryVerificationReport(entry: SyncHistoryEntry): string {
  const lines = [
    "Verification Report",
    "",
    `History ID: ${entry.historyId}`,
    `Batch ID: ${entry.eawBatchId ?? "—"}`,
    `Source: ${entry.entrySource}`,
    `Validation Status: ${entry.validationStatus}`,
    `Warehouse Status: ${entry.warehouseStatus}`,
    `Analytics Status: ${entry.analyticsStatus}`,
    `Issues: ${entry.issuesProcessed}`,
    `Worklogs: ${entry.worklogsProcessed}`,
    `Overall: ${entry.success ? "PASS" : entry.errorMessage ? "FAIL" : "IDLE"}`,
  ];

  if (entry.errorMessage) {
    lines.push(`Error: ${entry.errorMessage}`);
  }

  return lines.join("\n");
}
