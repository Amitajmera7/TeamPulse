import { PageContainer } from "@/components/common/layout/page-container";
import { DeveloperDetailView } from "@/components/explorer/developer-detail-view";

export const dynamic = "force-dynamic";

interface PageProps {
  params: Promise<{ id: string }>;
}

export default async function ExplorerDeveloperPage({ params }: PageProps) {
  const { id } = await params;

  return (
    <PageContainer>
      <DeveloperDetailView id={decodeURIComponent(id)} />
    </PageContainer>
  );
}
