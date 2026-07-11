import { NextRequest, NextResponse } from "next/server";

import {
  getAnalyticsHistoryReadModel,
  parseAnalyticsHistoryFilters,
} from "@/services/analytics-read";

/**
 * GET /api/analytics/history?months=&technology=&developer=
 * Historical Engineering Analytics — chart-ready TrendChartData series.
 */
export async function GET(request: NextRequest) {
  const filters = parseAnalyticsHistoryFilters(request.nextUrl.searchParams);
  const model = getAnalyticsHistoryReadModel(filters);

  return NextResponse.json({
    success: true,
    ...model,
  });
}
