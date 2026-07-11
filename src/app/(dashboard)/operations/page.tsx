import { PageContainer } from "@/components/common/layout/page-container";
import { OperationsCenter } from "@/components/operations/operations-center";

export const dynamic = "force-dynamic";

export default function OperationsPage() {
  return (
    <PageContainer>
      <OperationsCenter />
    </PageContainer>
  );
}
