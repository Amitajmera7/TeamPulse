export async function searchIssues() {
  const auth = Buffer.from(
    `${process.env.JIRA_EMAIL}:${process.env.JIRA_API_TOKEN}`
  ).toString("base64");

  const response = await fetch(
    `${process.env.JIRA_BASE_URL}/rest/api/3/search/jql`,
    {
      method: "POST",
      headers: {
        Authorization: `Basic ${auth}`,
        Accept: "application/json",
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        jql: `
          project = BB
          AND updated >= startOfMonth(-6)
          ORDER BY updated DESC
        `,
        maxResults: 10,
      }),
      cache: "no-store",
    }
  );

  if (!response.ok) {
    throw new Error(
      `Jira API Error: ${response.status} ${response.statusText}`
    );
  }

  const data = await response.json();

  return data.issues;
}