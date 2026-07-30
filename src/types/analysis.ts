// Shape of the structured JSON the AI layer must return.
// Kept as a strict TypeScript interface so the UI can render it directly
// without guessing at field names.

export type IssuePriority = "high" | "medium" | "low";

export interface PriorityIssue {
  title: string;
  reason: string;
  url: string;
  labels: string[];
}

export interface SprintDay {
  day: string; // e.g. "Day 1"
  tasks: string[];
  reason: string;
}

export interface AnalysisResult {
  projectSummary: string;
  readmeSummary: string;
  repoMetadataSummary: string;
  issueAnalysis: {
    totalIssuesAnalyzed: number;
    highPriority: PriorityIssue[];
    mediumPriority: PriorityIssue[];
    lowPriority: PriorityIssue[];
  };
  pullRequestSummary: {
    totalPRsAnalyzed: number;
    summary: string;
    importantPRs: string[];
  };
  documentationGaps: string[];
  sprintPlan: SprintDay[];
  projectHealthScore: {
    score: number;
    reason: string;
  };
  finalRecommendations: string[];
}

// Full API response returned to the frontend, combining raw repo facts
// (fetched, not generated) with the AI's analysis of them.
export interface AnalyzeRepoResponse {
  owner: string;
  repo: string;
  metadata: {
    name: string;
    fullName: string;
    description: string | null;
    stars: number;
    forks: number;
    openIssuesCount: number;
    defaultBranch: string;
    primaryLanguage: string | null;
    lastUpdated: string;
    htmlUrl: string;
  };
  analysis: AnalysisResult;
}

export interface AnalyzeRepoErrorResponse {
  error: string;
  code:
    | "INVALID_URL"
    | "REPO_NOT_FOUND"
    | "PRIVATE_REPO"
    | "RATE_LIMITED"
    | "MISSING_GITHUB_TOKEN"
    | "MISSING_AI_KEY"
    | "AI_INVALID_JSON"
    | "UNKNOWN";
}
