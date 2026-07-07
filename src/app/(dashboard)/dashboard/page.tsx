import { DashboardHero } from "@/components/dashboard/dashboard-hero";
import { DashboardTopBar } from "@/components/dashboard/dashboard-top-bar";
import { ExecutiveDashboard } from "@/components/dashboard/executive-dashboard";
import { PageContainer } from "@/components/common/layout/page-container";
import { getDashboardData } from "@/services/dashboard/dashboard-aggregator";

export default async function DashboardPage() {
  const data = await getDashboardData();

  return (
    <>
      <DashboardTopBar />
      <DashboardHero engineeringScore={data.engineeringScore} />
      <PageContainer>
        <ExecutiveDashboard data={data} />
      </PageContainer>
    </>
  );
}
