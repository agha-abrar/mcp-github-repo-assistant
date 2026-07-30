// Raw data shapes coming out of the GitHub layer / MCP provider.
// These represent the "real-time external data" half of the project -
// nothing here is invented by the AI, it's fetched straight from GitHub.

export interface RepoMetadata {
  name: string;
  fullName: string;
  description: string | null;
  stars: number;
  forks: number;
  openIssuesCount: number;
  defaultBranch: string;
  primaryLanguage: string | null;
  lastUpdated: string; // ISO date string
  htmlUrl: string;
  isPrivate: boolean;
}

export interface RepoIssue {
  title: string;
  body: string | null;
  labels: string[];
  createdAt: string;
  updatedAt: string;
  commentsCount: number;
  url: string;
  number: number;
}

export interface RepoPullRequest {
  title: string;
  body: string | null;
  status: "open" | "closed" | "merged";
  labels: string[];
  createdAt: string;
  updatedAt: string;
  url: string;
  number: number;
}

export interface RepoReadme {
  content: string | null;
  exists: boolean;
}

// The full bundle of context that gets handed to the AI analyzer.
// This is the "context passed to AI" step in the MCP flow.
export interface RepoContext {
  owner: string;
  repo: string;
  metadata: RepoMetadata;
  readme: RepoReadme;
  issues: RepoIssue[];
  pullRequests: RepoPullRequest[];
}
