import { RepoContext } from "@/types/repo";
import { AnalysisResult } from "@/types/analysis";
import { getCompletion } from "./aiClient";
import { SYSTEM_PROMPT, buildUserPrompt } from "./prompts";
import { calculateHealthScore } from "@/lib/utils/calculateHealthScore";

export class InvalidAiJsonError extends Error {
  constructor(raw: string) {
    super("AI response was not valid JSON");
    this.name = "InvalidAiJsonError";
    this.raw = raw;
  }
  raw: string;
}

/**
 * Strips accidental markdown code fences some models add even when asked
 * not to, then parses the result as JSON.
 */
function parseAiJson(raw: string): AnalysisResult {
  const cleaned = raw
    .trim()
    .replace(/^```json/i, "")
    .replace(/^```/, "")
    .replace(/```$/, "")
    .trim();

  try {
    return JSON.parse(cleaned) as AnalysisResult;
  } catch {
    throw new InvalidAiJsonError(raw);
  }
}

/**
 * Runs the AI analysis step: takes the fetched RepoContext (real GitHub
 * data, gathered via the MCP layer) and turns it into a structured
 * AnalysisResult. This is the "AI analysis over fetched context" step -
 * the model never sees a bare URL, only real, current repo data.
 */
export async function analyzeRepo(context: RepoContext): Promise<AnalysisResult> {
  const userPrompt = buildUserPrompt(context);

  const raw = await getCompletion({
    systemPrompt: SYSTEM_PROMPT,
    userPrompt,
  });

  const parsed = parseAiJson(raw);

  // Deterministic, reproducible score computed straight from the fetched
  // data (see calculateHealthScore.ts). Used as a fallback whenever the AI
  // omits a score or returns something out of range - keeps the "Project
  // Health Score" section trustworthy even if the model misbehaves.
  const fallbackScore = calculateHealthScore(context);
  const aiScore = parsed.projectHealthScore?.score;
  const validAiScore = typeof aiScore === "number" && aiScore >= 0 && aiScore <= 100;

  // Light structural safety net in case the model omits a field despite
  // instructions - keeps the UI from crashing on a missing array/object.
  return {
    projectSummary: parsed.projectSummary ?? "",
    readmeSummary: parsed.readmeSummary ?? "",
    repoMetadataSummary: parsed.repoMetadataSummary ?? "",
    issueAnalysis: {
      totalIssuesAnalyzed: parsed.issueAnalysis?.totalIssuesAnalyzed ?? context.issues.length,
      highPriority: parsed.issueAnalysis?.highPriority ?? [],
      mediumPriority: parsed.issueAnalysis?.mediumPriority ?? [],
      lowPriority: parsed.issueAnalysis?.lowPriority ?? [],
    },
    pullRequestSummary: {
      totalPRsAnalyzed: parsed.pullRequestSummary?.totalPRsAnalyzed ?? context.pullRequests.length,
      summary: parsed.pullRequestSummary?.summary ?? "",
      importantPRs: parsed.pullRequestSummary?.importantPRs ?? [],
    },
    documentationGaps: parsed.documentationGaps ?? [],
    sprintPlan: parsed.sprintPlan ?? [],
    projectHealthScore: {
      score: validAiScore ? aiScore! : fallbackScore.score,
      reason:
        parsed.projectHealthScore?.reason ??
        `Computed from README availability, update recency, issue load, PR activity, and issue severity mix.`,
    },
    finalRecommendations: parsed.finalRecommendations ?? [],
  };
}
