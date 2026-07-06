import { ELIGIBLE_DEVELOPERS } from "@/config/eligible-developers";

export async function buildContributionMetrics(
  issues: any[]
) {
  const developers: Record<
    string,
    {
      developer: string;
      deliveredHours: number;
      deliveredTickets: number;
    }
  > = {};

  const DONE_STATUSES = [
    "Merge in UAT",
    "Ready for UAT",
    "Ready for Live",
    "Live",
    "Done",
  ];

  for (const issue of issues) {
    const status =
      issue.fields?.status?.name;

    if (
      !DONE_STATUSES.includes(status)
    ) {
      continue;
    }

    const worklogs =
      issue.fields?.worklog?.worklogs || [];

    const estimateHours =
      (
        issue.fields?.timetracking
          ?.originalEstimateSeconds || 0
      ) / 3600;

    const totalActualHours =
      worklogs.reduce(
        (sum: number, wl: any) =>
          sum +
          wl.timeSpentSeconds / 3600,
        0
      );

    for (const worklog of worklogs) {
      const developer =
        worklog.author?.displayName;

      if (!developer) continue;

      if (
        !ELIGIBLE_DEVELOPERS.includes(
          developer
        )
      ) {
        continue;
      }

      if (!developers[developer]) {
        developers[developer] = {
          developer,
          deliveredHours: 0,
          deliveredTickets: 0,
        };
      }

      const actualHours =
        worklog.timeSpentSeconds / 3600;

      const allocatedContribution =
        totalActualHours > 0
          ? (actualHours /
              totalActualHours) *
            estimateHours
          : 0;

      developers[
        developer
      ].deliveredHours +=
        allocatedContribution;

      developers[
        developer
      ].deliveredTickets += 1;
    }
  }

  return Object.values(
    developers
  ).sort(
    (a, b) =>
      b.deliveredHours -
      a.deliveredHours
  );
}