import { getTechByDeveloper } from "./get-tech-by-developer";

export function getEstimateHours(
  issue: any,
  developer: string
) {
  const type =
    issue.fields?.customfield_10132?.value;

  const tech =
    getTechByDeveloper(developer);

  // Standard Tickets
  if (
    type === "Magento" ||
    type === "React JS" ||
    type === "HTML" ||
    type === "DT"
  ) {
    return (
      issue.fields?.timetracking
        ?.originalEstimateSeconds || 0
    ) / 3600;
  }

  // CR / RE
  if (
    type === "CR" ||
    type === "RE"
  ) {

    if (tech === "Magento") {
      return (
        issue.fields?.customfield_10326 || 0
      );
    }

    if (tech === "React JS") {
      return (
        issue.fields?.customfield_10327 || 0
      );
    }

    if (tech === "HTML") {
      return (
        issue.fields?.customfield_10328 || 0
      );
    }

    if (tech === "DT") {
      return (
        issue.fields?.customfield_10329 || 0
      );
    }
  }
 
  return 0;
}