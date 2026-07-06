import jira from "./jira-client";

export async function getIssueWorklogs(issueKey: string) {
  const response = await jira.get(
    `/rest/api/3/issue/${issueKey}/worklog`
  );

  return response.data.worklogs || [];
}