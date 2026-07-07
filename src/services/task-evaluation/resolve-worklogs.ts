import {
  gatherDeveloperWorklogs,
  resolveWorklogDateRange,
  sumWorklogHours,
} from "./parse-worklogs";
import type { JiraIssueInput, ResolvedWorklogs } from "./types";
import { collectWorklogSources } from "./worklog-sources";

function emptyResolvedWorklogs(): ResolvedWorklogs {
  return {
    resolved: false,
    actualHours: 0,
    worklogCount: 0,
    firstWorklogDate: null,
    lastWorklogDate: null,
    worklogs: [],
  };
}

/**
 * Resolves developer worklogs for a task.
 *
 * Reads engineering subtask worklogs only and never includes Story-level
 * worklogs or worklogs belonging to other developers.
 *
 * Issue status is intentionally ignored — status filtering belongs to the
 * evaluation engine.
 */
export function resolveWorklogs(
  issue: JiraIssueInput,
  developer: string
): ResolvedWorklogs {
  const sources = collectWorklogSources(issue);
  const worklogs = gatherDeveloperWorklogs(sources, developer);

  if (worklogs.length === 0) {
    return emptyResolvedWorklogs();
  }

  const { firstWorklogDate, lastWorklogDate } =
    resolveWorklogDateRange(worklogs);

  return {
    resolved: true,
    actualHours: sumWorklogHours(worklogs),
    worklogCount: worklogs.length,
    firstWorklogDate,
    lastWorklogDate,
    worklogs,
  };
}
