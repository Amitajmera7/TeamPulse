import { NextResponse } from "next/server";

import { getDashboardReadModel } from "@/services/analytics-read";

/**
 * Analytics Read API — returns the dashboard read model.
 */
export async function GET() {
  try {
    const model = await getDashboardReadModel();

    return NextResponse.json(model);
  } catch (error) {
    const message =
      error instanceof Error
        ? error.message
        : "Failed to load dashboard read model.";

    return NextResponse.json(
      {
        success: false,
        error: message,
      },
      {
        status: 500,
      }
    );
  }
}