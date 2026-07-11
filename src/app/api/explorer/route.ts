import { NextResponse } from "next/server";

import { getExplorerReadModel } from "@/services/analytics-read";

/**
 * GET /api/explorer — Engineering Explorer overview + tab lists + search index.
 */
export async function GET() {
  const model = await getExplorerReadModel();

  return NextResponse.json({
    success: true,
    ...model,
  });
}
