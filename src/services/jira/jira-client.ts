import axios from "axios";

const jira = axios.create({
  baseURL: process.env.JIRA_BASE_URL,
  headers: {
    Authorization:
      "Basic " +
      Buffer.from(
        `${process.env.JIRA_EMAIL}:${process.env.JIRA_API_TOKEN}`
      ).toString("base64"),
    Accept: "application/json",
  },
});

export default jira;