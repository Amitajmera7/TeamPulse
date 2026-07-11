import { NextResponse } from "next/server";

import { getSyncHistoryDetail } from "@/services/operations-history";

interface RouteContext {
  params: Promise<{ batchId: string }>;
}

/**
 * GET /api/operations/history/{batchId}
 * Batch Explorer detail for one sync history entry.
 */
export async function GET(_request: Request, context: RouteContext) {
  const { batchId } = await context.params;
  const detail = await getSyncHistoryDetail(batchId);

  if (!detail) {
    return NextResponse.json(
      { success: false, error: "Sync history entry not found." },
      { status: 404 }
    );
  }

  return NextResponse.json({
    success: true,
    ...detail,
  });
}
