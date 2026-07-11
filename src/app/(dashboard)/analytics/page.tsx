import Link from "next/link";

import { PageContainer } from "@/components/common/layout/page-container";
import { Button } from "@/components/ui/button";
import {
  dashboardSectionSpacing,
  dashboardTypography,
} from "@/lib/dashboard-ui";

export default function AnalyticsPage() {
  return (
    <PageContainer>
      <div className={dashboardSectionSpacing}>
        <div>
          <h1 className={dashboardTypography.sectionTitle}>Analytics</h1>
          <p className={dashboardTypography.sectionDescription}>
            Delivery trends, throughput, and engineering health
          </p>
        </div>
        <div className="rounded-xl border border-border/70 bg-card p-6">
          <h2 className={dashboardTypography.cardTitle}>
            Historical Engineering Analytics
          </h2>
          <p className={`${dashboardTypography.description} mt-2 max-w-xl`}>
            View Engineering Score, Technology Health, Value Delivered, Recovery,
            Capacity Utilization, and Delivery Efficiency trends across reporting
            periods.
          </p>
          <div className="mt-4">
            <Button asChild>
              <Link href="/analytics/history">Open Historical Analytics</Link>
            </Button>
          </div>
        </div>
      </div>
    </PageContainer>
  );
}
