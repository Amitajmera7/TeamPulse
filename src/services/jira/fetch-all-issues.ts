import jira from "./jira-client";

export async function fetchAllIssues() {
  const response = await jira.get(
    "/rest/api/3/search/jql",
    {
      params: {
        jql: "project = BB ORDER BY created DESC",
        maxResults: 10,
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

  return response.data;
}