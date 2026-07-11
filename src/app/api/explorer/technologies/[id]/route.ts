import { NextResponse } from "next/server";

import { getExplorerTechnologyDetail } from "@/services/analytics-read";

interface RouteContext {
  params: Promise<{ id: string }>;
}

/**
 * GET /api/explorer/technologies/{id}
 */
export async function GET(_request: Request, context: RouteContext) {
  const { id } = await context.params;
  const detail = getExplorerTechnologyDetail(id);

  if (!detail) {
    return NextResponse.json(
      { success: false, error: "Technology not found." },
      { status: 404 }
    );
  }

  return NextResponse.json({ success: true, ...detail });
}
