import { RepoContext } from "@/types/repo";

/**
 * Builds the system + user prompt sent to the LLM.
 *
 * The model is explicitly told NOT to rely on built-in knowledge about the
 * repository - only on the fetched context below. This is the line in the
 * sand between "built-in model knowledge" and "real fetched context" that
 * the project is meant to demonstrate.
 */

export const SYSTEM_PROMPT = `You are a senior engineering manager producing a repository health report.

Rules you must follow:
- Base your entire analysis ONLY on the JSON context provided in the user message. Do not rely on prior knowledge you may have about this repository from training data - the data below is the current, real state of the repo.
- If the context is missing information (e.g. no README, no issues), say so explicitly instead of inventing details.
- Classify each open issue as high, medium, or low priority using: bug/security/breaking-change labels, comment count, recency of activity, urgency implied by the title/body, and whether it looks stale or unclear.
- Identify documentation gaps by comparing the README content against what a project of this kind would typically need to document (setup, usage, contribution guide, API docs, etc).
- Produce a realistic 7-day sprint plan that a small team could actually execute, grounded in the real issues and PRs you were given.
- Compute a project health score from 0-100 and explain the reasoning in one or two sentences.
- Respond with ONLY valid JSON matching the schema below. No markdown fences, no preamble, no trailing commentary - just the JSON object.

JSON schema to return:
{
  "projectSummary": "string",
  "readmeSummary": "string",
  "repoMetadataSummary": "string",
  "issueAnalysis": {
    "totalIssuesAnalyzed": 0,
    "highPriority": [{ "title": "string", "reason": "string", "url": "string", "labels": ["string"] }],
    "mediumPriority": [{ "title": "string", "reason": "string", "url": "string", "labels": ["string"] }],
    "lowPriority": [{ "title": "string", "reason": "string", "url": "string", "labels": ["string"] }]
  },
  "pullRequestSummary": {
    "totalPRsAnalyzed": 0,
    "summary": "string",
    "importantPRs": ["string"]
  },
  "documentationGaps": ["string"],
  "sprintPlan": [{ "day": "Day 1", "tasks": ["string"], "reason": "string" }],
  "projectHealthScore": { "score": 0, "reason": "string" },
  "finalRecommendations": ["string"]
}`;

// Trims arbitrarily long text so we don't blow the model's context window
// on a single giant issue body or README.
function truncate(text: string | null | undefined, max: number): string {
  if (!text) return "(none provided)";
  return text.length > max ? `${text.slice(0, max)}... [truncated]` : text;
}

export function buildUserPrompt(context: RepoContext): string {
  const { owner, repo, metadata, readme, issues, pullRequests } = context;

  const issuesForPrompt = issues.slice(0, 20).map((i) => ({
    title: i.title,
    body: truncate(i.body, 600),
    labels: i.labels,
    createdAt: i.createdAt,
    updatedAt: i.updatedAt,
    commentsCount: i.commentsCount,
    url: i.url,
  }));

  const prsForPrompt = pullRequests.slice(0, 20).map((p) => ({
    title: p.title,
    body: truncate(p.body, 400),
    status: p.status,
    labels: p.labels,
    createdAt: p.createdAt,
    updatedAt: p.updatedAt,
    url: p.url,
  }));

  const contextPayload = {
    repository: `${owner}/${repo}`,
    metadata: {
      description: metadata.description,
      stars: metadata.stars,
      forks: metadata.forks,
      openIssuesCount: metadata.openIssuesCount,
      defaultBranch: metadata.defaultBranch,
      primaryLanguage: metadata.primaryLanguage,
      lastUpdated: metadata.lastUpdated,
    },
    readme: readme.exists ? truncate(readme.content, 4000) : "(no README found)",
    openIssues: issuesForPrompt,
    pullRequests: prsForPrompt,
  };

  return `Here is the real, freshly-fetched data for ${owner}/${repo}. Analyze it and return the JSON report described in the system prompt.\n\nDATA:\n${JSON.stringify(
    contextPayload,
    null,
    2
  )}`;
}
