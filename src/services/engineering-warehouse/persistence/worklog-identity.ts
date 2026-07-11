/**
 * Worklog identity helpers for idempotent warehouse persistence.
 *
 * Milestone 13A refinement — no analytics logic.
 *
 * Prefer Jira worklog id when available. Otherwise build a deterministic
 * fact key from issue/developer/started/hours/author.
 */

import { createHash } from "node:crypto";

/** Inputs used to build {@link EngineeringWorklog.worklogKey}. */
export interface BuildEngineeringWorklogKeyInput {
  /** Jira worklog id when known. */
  readonly jiraWorklogId?: string | null;
  readonly issueKey: string;
  readonly developer: string;
  readonly started: string;
  readonly hours: number;
  readonly author: string;
}

/**
 * Canonical decimal string for hours so 1 and 1.0 hash the same.
 */
export function canonicalWorklogHours(hours: number): string {
  if (!Number.isFinite(hours)) {
    throw new Error("Worklog hours must be a finite number.");
  }

  return hours.toFixed(6).replace(/\.?0+$/, "") || "0";
}

/**
 * Builds a stable worklog_key for UPSERT within a batch.
 *
 * - If `jiraWorklogId` is non-empty → `jira:{id}`
 * - Else → `fact:{sha256_hex(...)}` over issueKey, developer, started, hours, author
 */
export function buildEngineeringWorklogKey(
  input: BuildEngineeringWorklogKeyInput
): string {
  const jiraId = input.jiraWorklogId?.trim();
  if (jiraId) {
    return `jira:${jiraId}`;
  }

  const material = [
    input.issueKey,
    input.developer,
    input.started,
    canonicalWorklogHours(input.hours),
    input.author,
  ].join("\0");

  const digest = createHash("sha256").update(material, "utf8").digest("hex");
  return `fact:${digest}`;
}
