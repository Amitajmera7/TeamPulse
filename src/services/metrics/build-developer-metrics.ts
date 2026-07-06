import { getTechByDeveloper } from "./get-tech-by-developer";
import { ELIGIBLE_DEVELOPERS } from "@/config/eligible-developers";
import { getEstimateHours } from "./get-estimate-hours";

export async function buildDeveloperMetrics(
  issues: any[]
) {

   const developers: Record<
    string,
    {
      developer: string;
      technology: string;
      actualHours: number;
      estimatedHours: number;
      worklogCount: number;
    }
  > = {};

 for (const issue of issues) {


       const worklogs =
      issue.fields?.worklog?.worklogs || [];

     const totalActualHours = worklogs.reduce(
  (sum: number, wl: any) =>
    sum +
    wl.timeSpentSeconds / 3600,
  0
);

    for (const worklog of worklogs) {
      const developer =
        worklog.author?.displayName;

      const estimateHours =
        getEstimateHours(
          issue,
          developer
        );

      if (!developer) continue;

      if (
  !ELIGIBLE_DEVELOPERS.includes(
    developer
  )
) {
  continue;
}

      if (!developers[developer]) {

  const technology =
    getTechByDeveloper(developer);

  developers[developer] = {
    developer,
    technology:
      technology || "Unknown",
    actualHours: 0,
    estimatedHours: 0,
    worklogCount: 0,
  };
}

      const actualHours =
        worklog.timeSpentSeconds / 3600;

      developers[developer].actualHours +=
        actualHours;

      developers[developer].worklogCount += 1;

     

const allocatedEstimate =
  totalActualHours > 0
    ? (actualHours / totalActualHours) *
      estimateHours
    : 0;

developers[developer].estimatedHours +=
  allocatedEstimate;
    }
  }

 return {
  metrics: Object.values(developers)
    .map((dev: any) => ({
      ...dev,

      efficiency:
        dev.actualHours > 0
          ? Number(
              (
                (dev.estimatedHours /
                  dev.actualHours) *
                100
              ).toFixed(2)
            )
          : 0,
    }))
    .sort(
      (a: any, b: any) =>
        b.efficiency -
        a.efficiency
    ),
};
}