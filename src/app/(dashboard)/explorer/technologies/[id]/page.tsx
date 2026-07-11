import { PageContainer } from "@/components/common/layout/page-container";
import { TechnologyDetailView } from "@/components/explorer/technology-detail-view";

export const dynamic = "force-dynamic";

interface PageProps {
  params: Promise<{ id: string }>;
}

export default async function ExplorerTechnologyPage({ params }: PageProps) {
  const { id } = await params;

  return (
    <PageContainer>
      <TechnologyDetailView id={decodeURIComponent(id)} />
    </PageContainer>
  );
}
