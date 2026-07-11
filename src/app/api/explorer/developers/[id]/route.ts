import { NextResponse } from "next/server";

import { getExplorerDeveloperDetail } from "@/services/analytics-read";

interface RouteContext {
  params: Promise<{ id: string }>;
}

/**
 * GET /api/explorer/developers/{id}
 */
export async function GET(_request: Request, context: RouteContext) {
  const { id } = await context.params;
  const detail = getExplorerDeveloperDetail(id);

  if (!detail) {
    return NextResponse.json(
      { success: false, error: "Developer not found." },
      { status: 404 }
    );
  }

  return NextResponse.json({ success: true, ...detail });
}
