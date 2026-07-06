import jira from "./jira-client";

export async function fetchMonthlyIssues() {
  const allIssues: any[] = [];

  let nextPageToken: string | undefined;

  while (true) {
    const response = await jira.get(
      "/rest/api/3/search/jql",
      {
        params: {
          jql: `
            project = BB
            AND updated >= startOfMonth(-1)
            ORDER BY updated DESC
          `,
          maxResults: 100,
          ...(nextPageToken && {
            nextPageToken,
          }),
          fields: [
            "summary",
            "status",
            "issuetype",
            "parent",
            "timetracking",
            "worklog",
            "created",
            "updated",
            "customfield_10132",
            "customfield_10326",
            "customfield_10327",
            "customfield_10328",
            "customfield_10329",
          ].join(","),
        },
      }
    );

    const data = response.data;

    allIssues.push(...data.issues);

    if (data.isLast) {
      break;
    }

    nextPageToken = data.nextPageToken;
  }

  return allIssues;
}