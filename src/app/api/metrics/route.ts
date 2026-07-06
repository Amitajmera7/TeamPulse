import { NextResponse } from "next/server";

import { fetchMonthlyIssues } from "@/services/jira/fetch-monthly-issues";
import { buildDeveloperMetrics } from "@/services/metrics/build-developer-metrics";

export async function GET() {
  try {
    const issues = await fetchMonthlyIssues();

    const metrics =
      await buildDeveloperMetrics(issues);

    return NextResponse.json(metrics);
  } catch (error: any) {
    return NextResponse.json({
      success: false,
      error: error.message,
      details: error?.response?.data,
    });
  }
}