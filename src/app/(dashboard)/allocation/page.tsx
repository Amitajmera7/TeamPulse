import { Suspense } from "react";

import { AllocationView } from "@/components/allocation/allocation-view";

export const dynamic = "force-dynamic";

export default function AllocationPage() {
  return (
    <Suspense
      fallback={
        <p className="px-4 py-10 text-center text-[13px] text-muted-foreground lg:px-8">
          Loading Team Allocation…
        </p>
      }
    >
      <AllocationView />
    </Suspense>
  );
}
