import { headers } from "next/headers";

import { DashboardHero } from "@/components/dashboard/dashboard-hero";
import { DashboardTopBar } from "@/components/dashboard/dashboard-top-bar";
import { ExecutiveDashboard } from "@/components/dashboard/executive-dashboard";
import { PageContainer } from "@/components/common/layout/page-container";
import {
  dashboardReadModelToDashboardData,
  type DashboardReadModel,
} from "@/services/analytics-read";

/** Dashboard reads request-time API data — do not bake a static shell. */
export const dynamic = "force-dynamic";

/**
 * Loads the Analytics Read API model for this request.
 * UI mapping stays identical via dashboardReadModelToDashboardData.
 */
async function loadDashboardReadModel(): Promise<DashboardReadModel> {
  const headerStore = await headers();
  const host =
    headerStore.get("x-forwarded-host") ??
    headerStore.get("host") ??
    "localhost:3000";
  const protocol = headerStore.get("x-forwarded-proto") ?? "http";

  const response = await fetch(`${protocol}://${host}/api/dashboard`, {
    cache: "no-store",
  });

  if (!response.ok) {
    throw new Error(`Analytics Read API failed with status ${response.status}`);
  }

  return (await response.json()) as DashboardReadModel;
}

export default async function DashboardPage() {
  const readModel = await loadDashboardReadModel();
  const data = dashboardReadModelToDashboardData(readModel);
  void readModel.generatedAt;
  void readModel.syncStatus;

  return (
    <>
      <DashboardTopBar />
      <DashboardHero
  engineeringScore={data.engineeringScore}
  generatedAt={readModel.generatedAt}
  syncStatus={readModel.syncStatus}
/>
      <PageContainer>
        <ExecutiveDashboard data={data} />
      </PageContainer>
    </>
  );
}
