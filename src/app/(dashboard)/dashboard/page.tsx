import { PageContainer } from "@/components/common/layout/page-container";
import { PageHeader } from "@/components/common/layout/page-header";
import { ExecutiveDashboard } from "@/components/dashboard/executive-dashboard";

export default function DashboardPage() {
  return (
    <>
      <PageHeader
        title="Engineering Overview"
        description="Monitor delivery health, productivity, and team performance"
      />
      <PageContainer>
        <ExecutiveDashboard />
      </PageContainer>
    </>
  );
}
