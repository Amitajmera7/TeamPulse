import type {
  ContributorRow,
  EngineeringInsight,
  HealthMetrics,
  ScoreComponents,
  TechnologyCardData,
} from "./types";

export function calculateInsights(
  health: HealthMetrics,
  scoreComponents: ScoreComponents,
  technologies: TechnologyCardData[],
  contributors: ContributorRow[]
): EngineeringInsight[] {
  const items: EngineeringInsight[] = [];

  if (health.riskCount > 0) {
    items.push({
      id: "risk",
      title: "Review delivery risk in active sprints",
      description: `${health.riskCount} in-flight issue${health.riskCount === 1 ? "" : "s"} with engineering activity remain outside delivered statuses. Prioritize blockers before month end.`,
      tone: health.riskCount >= 5 ? "warning" : "success",
    });
  }

  if (scoreComponents.quality < 70) {
    items.push({
      id: "quality",
      title: "Quality signals need attention",
      description: `Engineering quality is at ${Math.round(scoreComponents.quality)}%. Review bug rework and estimate adherence across active teams.`,
      tone: "warning",
    });
  }

  const strugglingTech = technologies
    .filter((tech) => tech.status === "attention" || tech.developers === 0)
    .map((tech) => tech.name);

  if (strugglingTech.length > 0) {
    items.push({
      id: "technology",
      title: "Technology health requires review",
      description: `Composite health is below target for ${strugglingTech.join(", ")}. Balance workload before new pipeline commitments.`,
      tone: "warning",
    });
  }

  if (health.deliveryHealth >= 85) {
    items.push({
      id: "delivery",
      title: "Delivery health is strong this period",
      description: `${health.deliveryHealth}% of active issues reached delivered statuses. Maintain current execution cadence.`,
      tone: "success",
    });
  }

  if (scoreComponents.contribution >= 80) {
    items.push({
      id: "contribution",
      title: "Strong delivery contribution",
      description: `${Math.round(scoreComponents.contribution)}% of logged engineering effort converted to delivered value this period.`,
      tone: "info",
    });
  }

  const topContributor = contributors[0];
  if (topContributor && topContributor.efficiency >= 85) {
    items.push({
      id: "contributors",
      title: "Celebrate top contributors",
      description: `${topContributor.name} leads delivery with ${topContributor.stories} completed items and ${topContributor.efficiency}% efficiency.`,
      tone: "info",
    });
  }

  if (health.productivity < 75) {
    items.push({
      id: "productivity",
      title: "Engineering productivity needs attention",
      description: `Team efficiency is at ${health.productivity}%. Review estimate accuracy and scope changes on in-progress work.`,
      tone: "warning",
    });
  }

  if (items.length === 0) {
    items.unshift({
      id: "default",
      title: "Engineering metrics are within normal range",
      description:
        "No critical alerts this period. Continue monitoring delivery health and contributor balance.",
      tone: "info",
    });
  }

  return items.slice(0, 3);
}
