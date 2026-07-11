import { Suspense } from "react";

import { PageContainer } from "@/components/common/layout/page-container";
import { ExplorerCenter } from "@/components/explorer/explorer-center";

export const dynamic = "force-dynamic";

export default function ExplorerPage() {
  return (
    <PageContainer>
      <Suspense
        fallback={
          <p className="text-[13px] text-muted-foreground">Loading explorer…</p>
        }
      >
        <ExplorerCenter />
      </Suspense>
    </PageContainer>
  );
}
