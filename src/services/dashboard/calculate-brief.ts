import type {
  BriefItem,
  ContributorRow,
  HealthMetrics,
  TechnologyCardData,
} from "./types";

export function calculateBrief(
  health: HealthMetrics,
  technologies: TechnologyCardData[],
  contributors: ContributorRow[]
): BriefItem[] {
  const items: BriefItem[] = [];

  if (health.riskCount > 0) {
    items.push({
      id: "risk",
      title: "Review delivery risk in active sprints",
      description: `${health.riskCount} in-flight issue${health.riskCount === 1 ? "" : "s"} with engineering activity remain outside delivered statuses. Prioritize blockers before month end.`,
      tone: health.riskCount >= 5 ? "warning" : "success",
    });
  }

  const strugglingTech = technologies
    .filter((tech) => tech.status === "attention" || tech.developers === 0)
    .map((tech) => tech.name);

  if (strugglingTech.length > 0) {
    items.push({
      id: "utilization",
      title: "Check utilization across engineering teams",
      description: `Monitor workload balance for ${strugglingTech.join(", ")} before adding new pipeline commitments.`,
      tone: "warning",
    });
  } else if (health.utilization > 95 || health.utilization < 60) {
    items.push({
      id: "capacity",
      title: "Review resource utilization levels",
      description:
        health.utilization > 95
          ? "Teams are logging above estimated capacity. Consider redistributing work to protect delivery quality."
          : "Utilization is below target range. Confirm estimates and sprint commitments are aligned with capacity.",
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

  const topContributor = contributors[0];
  if (topContributor && topContributor.efficiency >= 85) {
    items.push({
      id: "contributors",
      title: "Celebrate top contributors",
      description: `${topContributor.name} leads delivery with ${topContributor.stories} completed items and ${topContributor.efficiency}% efficiency. Recognize consistent estimate accuracy.`,
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
    items.push({
      id: "default",
      title: "Engineering metrics are within normal range",
      description:
        "No critical alerts this period. Continue monitoring delivery health and contributor balance.",
      tone: "info",
    });
  }

  return items.slice(0, 3);
}
