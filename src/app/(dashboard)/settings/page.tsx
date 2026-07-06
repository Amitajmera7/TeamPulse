import { StubPage } from "@/components/common/stub-page";

export default function SettingsPage() {
  return (
    <StubPage
      header={{
        title: "Settings",
        description: "Configure TeamPulse preferences and integrations",
      }}
      sectionLabel="Application Settings"
      sectionDescription="Team mapping, filters, and notification preferences will appear here"
    />
  );
}
