export async function fetchIssue(issueKey: string) {
  const auth = Buffer.from(
    `${process.env.JIRA_EMAIL}:${process.env.JIRA_API_TOKEN}`
  ).toString("base64");

  const response = await fetch(
    `${process.env.JIRA_BASE_URL}/rest/api/3/issue/${issueKey}`,
    {
      method: "GET",
      headers: {
        Authorization: `Basic ${auth}`,
        Accept: "application/json",
      },
      cache: "no-store",
    }
  );

  if (!response.ok) {
    throw new Error("Failed to fetch issue");
  }

  return response.json();
}