import { NextResponse } from "next/server";

import {
  ANALYTICS_SYNC_STEPS,
  getLastSyncSummary,
  getSyncState,
  mirrorLiveSyncState,
} from "@/services/orchestrator";

/**
 * Operations Center snapshot — sync health + last run summary.
 */
export async function GET() {
  const syncState = getSyncState();
  mirrorLiveSyncState(syncState);
  const lastSync = getLastSyncSummary();

  return NextResponse.json({
    success: true,
    syncState,
    lastSync,
    pipelineSteps: ANALYTICS_SYNC_STEPS,
  });
}
