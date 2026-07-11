import { PageContainer } from "@/components/common/layout/page-container";
import { ProjectDetailView } from "@/components/explorer/project-detail-view";

export const dynamic = "force-dynamic";

interface PageProps {
  params: Promise<{ id: string }>;
}

export default async function ExplorerProjectPage({ params }: PageProps) {
  const { id } = await params;

  return (
    <PageContainer>
      <ProjectDetailView id={decodeURIComponent(id)} />
    </PageContainer>
  );
}
