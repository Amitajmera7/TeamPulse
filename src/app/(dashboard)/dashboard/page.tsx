import { DashboardHero } from "@/components/dashboard/dashboard-hero";
import { DashboardTopBar } from "@/components/dashboard/dashboard-top-bar";
import { ExecutiveDashboard } from "@/components/dashboard/executive-dashboard";
import { PageContainer } from "@/components/common/layout/page-container";
import { getDashboardData } from "@/services/dashboard-repository";

export default function DashboardPage() {
  // Repository is the only DashboardData source for the UI.
  // `generatedAt` is exposed for future Last Sync display (no header redesign yet).
  const { dashboardData: data, generatedAt: _generatedAt } = getDashboardData();
  void _generatedAt;

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
