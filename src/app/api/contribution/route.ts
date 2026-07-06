import { NextResponse } from "next/server";

import { fetchMonthlyIssues } from "@/services/jira/fetch-monthly-issues";
import { buildContributionMetrics } from "@/services/metrics/build-contribution-metrics";

export async function GET() {
  try {
    const issues =
      await fetchMonthlyIssues();

    const contribution =
      await buildContributionMetrics(
        issues
      );

    return NextResponse.json({
      contribution,
    });
  } catch (error: any) {
    return NextResponse.json({
      success: false,
      error: error.message,
      details: error?.response?.data,
    });
  }
}