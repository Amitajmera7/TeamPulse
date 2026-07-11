import { PageContainer } from "@/components/common/layout/page-container";
import { BatchExplorer } from "@/components/operations/batch-explorer";

export const dynamic = "force-dynamic";

interface BatchExplorerPageProps {
  params: Promise<{ batchId: string }>;
}

export default async function BatchExplorerPage({
  params,
}: BatchExplorerPageProps) {
  const { batchId } = await params;

  return (
    <PageContainer>
      <BatchExplorer batchId={decodeURIComponent(batchId)} />
    </PageContainer>
  );
}
