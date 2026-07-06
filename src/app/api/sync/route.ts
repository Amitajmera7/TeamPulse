import { NextResponse } from "next/server";
import { fetchAllIssues } from "@/services/jira/fetch-all-issues";

export async function GET() {
  try {
    const data = await fetchAllIssues();

    return NextResponse.json({
      success: true,
      totalReturned: data.issues.length,

      // Existing simplified response (keep this)
      issues: data.issues.map((issue: any) => ({
        key: issue.key,
        summary: issue.fields.summary,
        status: issue.fields.status?.name,
        type: issue.fields.customfield_10132?.value,
      })),

      // 👇 First complete Jira issue for debugging
      sampleIssue:
  data.issues.find(
    (issue: any) =>
      issue.fields.worklog?.total > 0
  ) || data.issues[0],
    });
  } catch (error: any) {
    return NextResponse.json({
      success: false,
      error: error.message,
      details: error?.response?.data,
    });
  }
}