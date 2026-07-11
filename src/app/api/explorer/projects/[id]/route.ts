import { NextResponse } from "next/server";

import { getExplorerProjectDetail } from "@/services/analytics-read";

interface RouteContext {
  params: Promise<{ id: string }>;
}

/**
 * GET /api/explorer/projects/{id}
 */
export async function GET(_request: Request, context: RouteContext) {
  const { id } = await context.params;
  const detail = await getExplorerProjectDetail(id);

  if (!detail) {
    return NextResponse.json(
      { success: false, error: "Project not found." },
      { status: 404 }
    );
  }

  return NextResponse.json({ success: true, ...detail });
}
