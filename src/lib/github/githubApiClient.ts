import { RepoMetadata, RepoIssue, RepoPullRequest, RepoReadme } from "@/types/repo";

/**
 * Thin wrapper around the GitHub REST API.
 *
 * This file is the ONLY place that talks to api.github.com directly.
 * Everything above it (the MCP provider layer) calls these functions
 * instead of hitting fetch() directly, so that swapping this out for the
 * official GitHub MCP Server later is a one-file change.
 *
 * IMPORTANT: this file must only ever run on the server. It reads
 * process.env.GITHUB_TOKEN, which must never be exposed to the browser.
 */

const GITHUB_API_BASE = "https://api.github.com";

export class GitHubApiError extends Error {
  status: number;
  constructor(message: string, status: number) {
    super(message);
    this.status = status;
    this.name = "GitHubApiError";
  }
}

function getAuthHeaders(): Record<string, string> {
  const token = process.env.GITHUB_TOKEN;
  const headers: Record<string, string> = {
    Accept: "application/vnd.github+json",
    "X-GitHub-Api-Version": "2022-11-28",
  };
  // Read-only token. The app never calls any write endpoint.
  if (token) headers.Authorization = `Bearer ${token}`;
  return headers;
}

async function githubFetch(path: string): Promise<Response> {
  const res = await fetch(`${GITHUB_API_BASE}${path}`, {
    headers: getAuthHeaders(),
    // Always fetch fresh data - this is a "real-time data" tool, not a cache.
    cache: "no-store",
  });
  return res;
}

export async function fetchRepoMetadata(
  owner: string,
  repo: string
): Promise<RepoMetadata> {
  const res = await githubFetch(`/repos/${owner}/${repo}`);

  if (res.status === 404) {
    throw new GitHubApiError("Repository not found", 404);
  }
  if (res.status === 403) {
    const remaining = res.headers.get("x-ratelimit-remaining");
    if (remaining === "0") {
      throw new GitHubApiError("GitHub API rate limit exceeded", 403);
    }
    throw new GitHubApiError("Access forbidden - repository may be private", 403);
  }
  if (!res.ok) {
    throw new GitHubApiError(`GitHub API error (${res.status})`, res.status);
  }

  const data = await res.json();

  if (data.private) {
    throw new GitHubApiError("Repository is private", 403);
  }

  return {
    name: data.name,
    fullName: data.full_name,
    description: data.description,
    stars: data.stargazers_count ?? 0,
    forks: data.forks_count ?? 0,
    openIssuesCount: data.open_issues_count ?? 0,
    defaultBranch: data.default_branch ?? "main",
    primaryLanguage: data.language,
    lastUpdated: data.updated_at,
    htmlUrl: data.html_url,
    isPrivate: !!data.private,
  };
}

export async function fetchRepoReadme(
  owner: string,
  repo: string
): Promise<RepoReadme> {
  const res = await githubFetch(`/repos/${owner}/${repo}/readme`);

  if (res.status === 404) {
    return { content: null, exists: false };
  }
  if (!res.ok) {
    // Non-fatal: a broken README fetch shouldn't kill the whole report.
    return { content: null, exists: false };
  }

  const data = await res.json();
  const content = data.content
    ? Buffer.from(data.content, "base64").toString("utf-8")
    : null;

  return { content, exists: !!content };
}

export async function fetchOpenIssues(
  owner: string,
  repo: string,
  limit = 25
): Promise<RepoIssue[]> {
  const res = await githubFetch(
    `/repos/${owner}/${repo}/issues?state=open&per_page=${limit}&sort=updated&direction=desc`
  );

  if (!res.ok) {
    if (res.status === 403) throw new GitHubApiError("GitHub API rate limit exceeded", 403);
    return [];
  }

  const data = await res.json();

  // The /issues endpoint also returns pull requests - filter those out.
  return (data as any[])
    .filter((item) => !item.pull_request)
    .map((item) => ({
      title: item.title,
      body: item.body,
      labels: (item.labels ?? []).map((l: any) =>
        typeof l === "string" ? l : l.name
      ),
      createdAt: item.created_at,
      updatedAt: item.updated_at,
      commentsCount: item.comments ?? 0,
      url: item.html_url,
      number: item.number,
    }));
}

export async function fetchPullRequests(
  owner: string,
  repo: string,
  limit = 25
): Promise<RepoPullRequest[]> {
  const res = await githubFetch(
    `/repos/${owner}/${repo}/pulls?state=all&per_page=${limit}&sort=updated&direction=desc`
  );

  if (!res.ok) {
    if (res.status === 403) throw new GitHubApiError("GitHub API rate limit exceeded", 403);
    return [];
  }

  const data = await res.json();

  return (data as any[]).map((item) => ({
    title: item.title,
    body: item.body,
    status: item.merged_at ? "merged" : item.state === "closed" ? "closed" : "open",
    labels: (item.labels ?? []).map((l: any) =>
      typeof l === "string" ? l : l.name
    ),
    createdAt: item.created_at,
    updatedAt: item.updated_at,
    url: item.html_url,
    number: item.number,
  }));
}
