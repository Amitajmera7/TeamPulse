import { SectionCard } from "@/components/dashboard/section-card";
import { SectionPlaceholder } from "@/components/dashboard/section-placeholder";

export function ExecutiveDashboard() {
  return (
    <div className="space-y-8">
      <SectionPlaceholder
        title="Executive KPIs"
        description="High-level engineering health at a glance"
        columns={4}
      >
        <SectionCard label="Delivery Health" />
        <SectionCard label="Engineering Productivity" />
        <SectionCard label="Resource Utilization" />
        <SectionCard label="Delivery Risk" />
      </SectionPlaceholder>

      <SectionPlaceholder
        title="Delivery Trends"
        description="Monthly delivery and productivity patterns"
        columns={2}
      >
        <SectionCard
          label="Delivery Trend"
          className="min-h-[240px]"
        />
        <SectionCard
          label="Productivity Trend"
          className="min-h-[240px]"
        />
      </SectionPlaceholder>

      <SectionPlaceholder
        title="Technology Overview"
        description="Performance across engineering teams"
        columns={4}
      >
        <SectionCard label="Magento" />
        <SectionCard label="React JS" />
        <SectionCard label="HTML" />
        <SectionCard label="DT" />
      </SectionPlaceholder>

      <SectionPlaceholder
        title="Leaderboard"
        description="Top contributors this month"
        columns={1}
      >
        <SectionCard
          label="Developer Rankings"
          className="min-h-[200px]"
        />
      </SectionPlaceholder>

      <SectionPlaceholder
        title="AI Insights"
        description="Executive summary and recommendations"
        columns={1}
      >
        <SectionCard
          label="AI Executive Summary"
          className="min-h-[160px]"
        />
      </SectionPlaceholder>
    </div>
  );
}
