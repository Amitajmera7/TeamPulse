import { NextResponse } from "next/server";

import {
  getSyncState,
  runAnalyticsSync,
} from "@/services/orchestrator";

/**
 * Returns the current analytics sync state (progress / status).
 */
export async function GET() {
  return NextResponse.json({
    success: true,
    syncState: getSyncState(),
  });
}

/**
 * Triggers the Analytics Orchestration Engine.
 *
 * Thin controller — all pipeline logic lives in the orchestrator.
 */
export async function POST() {
  const result = await runAnalyticsSync();

  if (!result.success) {
    return NextResponse.json(
      {
        success: false,
        syncState: result.syncState,
        snapshotPublished: result.snapshotPublished,
        generatedAt: result.generatedAt,
        totalIssuesProcessed: result.totalIssuesProcessed,
        totalWorklogsProcessed: result.totalWorklogsProcessed,
        error: result.errorMessage,
      },
      { status: result.syncState.status === "Running" ? 409 : 500 }
    );
  }

  return NextResponse.json({
    success: true,
    syncState: result.syncState,
    snapshotPublished: result.snapshotPublished,
    generatedAt: result.generatedAt,
    totalIssuesProcessed: result.totalIssuesProcessed,
    totalWorklogsProcessed: result.totalWorklogsProcessed,
  });
}
