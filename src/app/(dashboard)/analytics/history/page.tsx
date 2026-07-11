import { PageContainer } from "@/components/common/layout/page-container";
import { AnalyticsHistoryView } from "@/components/analytics/analytics-history-view";

export const dynamic = "force-dynamic";

export default function AnalyticsHistoryPage() {
  return (
    <PageContainer>
      <AnalyticsHistoryView />
    </PageContainer>
  );
}
