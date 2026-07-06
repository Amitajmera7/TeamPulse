import jira from "./jira-client";

export async function fetchIssueDetails(
  issueKey: string
) {
  const response = await jira.get(
    `/rest/api/3/issue/${issueKey}`,
    {
      params: {
        fields: [
          "summary",
          "status",
          "parent",
          "issuetype",
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

  return response.data;
}