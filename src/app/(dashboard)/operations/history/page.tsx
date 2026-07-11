import { PageContainer } from "@/components/common/layout/page-container";
import { SyncHistoryView } from "@/components/operations/sync-history-view";

export const dynamic = "force-dynamic";

export default function SyncHistoryPage() {
  return (
    <PageContainer>
      <SyncHistoryView />
    </PageContainer>
  );
}
