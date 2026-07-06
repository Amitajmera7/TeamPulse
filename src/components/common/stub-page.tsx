import { PageContainer } from "@/components/common/layout/page-container";
import { PageHeader } from "@/components/common/layout/page-header";
import { SectionCard } from "@/components/dashboard/section-card";
import type { PageHeaderProps } from "@/types/layout";

interface StubPageProps {
  header: PageHeaderProps;
  sectionLabel: string;
  sectionDescription?: string;
}

export function StubPage({
  header,
  sectionLabel,
  sectionDescription = "This section is under development",
}: StubPageProps) {
  return (
    <>
      <PageHeader {...header} />
      <PageContainer>
        <SectionCard
          label={sectionLabel}
          description={sectionDescription}
          className="min-h-[320px]"
        />
      </PageContainer>
    </>
  );
}
