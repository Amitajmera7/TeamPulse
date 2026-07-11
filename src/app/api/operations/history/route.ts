import { NextRequest, NextResponse } from "next/server";

import { listSyncHistory } from "@/services/operations-history";

/**
 * GET /api/operations/history?limit=&offset=
 * Sync history newest-first (warehouse + in-memory merge).
 */
export async function GET(request: NextRequest) {
  const { searchParams } = request.nextUrl;
  const limitParam = searchParams.get("limit");
  const offsetParam = searchParams.get("offset");

  const limit = limitParam ? Number(limitParam) : undefined;
  const offset = offsetParam ? Number(offsetParam) : undefined;

  const result = await listSyncHistory({
    limit: Number.isFinite(limit) ? limit : undefined,
    offset: Number.isFinite(offset) ? offset : undefined,
  });

  return NextResponse.json({
    success: true,
    ...result,
  });
}
