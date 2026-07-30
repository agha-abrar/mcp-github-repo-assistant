import { NextRequest, NextResponse } from "next/server";
import { parseRepoUrl } from "@/lib/github/parseRepoUrl";
import { GitHubApiError } from "@/lib/github/githubApiClient";
import { buildRepoContext } from "@/lib/mcp/mcpClient";
import { analyzeRepo, InvalidAiJsonError } from "@/lib/ai/repoAnalyzer";
import { MissingApiKeyError, AiRequestError } from "@/lib/ai/aiClient";
import { AnalyzeRepoErrorResponse, AnalyzeRepoResponse } from "@/types/analysis";

/**
 * POST /api/analyze-repo
 * Body: { url: string }
 *
 * Flow (matches the architecture diagram in the README):
 *   1. Parse + validate the GitHub URL
 *   2. MCP layer fetches repo metadata, README, issues, PRs
 *   3. AI layer analyzes that real data and returns structured JSON
 *   4. Combine + return to the frontend
 *
 * This route is read-only. It never creates, edits, or closes anything
 * on GitHub, and never exposes GITHUB_TOKEN or OPENAI_API_KEY to the client.
 */
export async function POST(req: NextRequest) {
  let body: { url?: string };
  try {
    body = await req.json();
  } catch {
    return errorResponse("INVALID_URL", "Request body must be valid JSON.", 400);
  }

  const parsed = body.url ? parseRepoUrl(body.url) : null;
  if (!parsed) {
    return errorResponse(
      "INVALID_URL",
      "That doesn't look like a valid GitHub repository URL. Try something like https://github.com/owner/repo.",
      400
    );
  }

  if (!process.env.GITHUB_TOKEN) {
    return errorResponse(
      "MISSING_GITHUB_TOKEN",
      "Server is missing GITHUB_TOKEN. Add it to .env.local and restart the server.",
      500
    );
  }
  if (!process.env.OPENAI_API_KEY && !process.env.OPENROUTER_API_KEY) {
    return errorResponse(
      "MISSING_AI_KEY",
      "Server is missing OPENAI_API_KEY or OPENROUTER_API_KEY. Add it to .env.local and restart the server.",
      500
    );
  }

  const { owner, repo } = parsed;

  try {
    // Step 1: MCP-style fetch layer gathers real repo data.
    const context = await buildRepoContext(owner, repo);

    // Step 2: AI layer analyzes the fetched data.
    const analysis = await analyzeRepo(context);

    const response: AnalyzeRepoResponse = {
      owner,
      repo,
      metadata: {
        name: context.metadata.name,
        fullName: context.metadata.fullName,
        description: context.metadata.description,
        stars: context.metadata.stars,
        forks: context.metadata.forks,
        openIssuesCount: context.metadata.openIssuesCount,
        defaultBranch: context.metadata.defaultBranch,
        primaryLanguage: context.metadata.primaryLanguage,
        lastUpdated: context.metadata.lastUpdated,
        htmlUrl: context.metadata.htmlUrl,
      },
      analysis,
    };

    return NextResponse.json(response, { status: 200 });
  } catch (err) {
    return handleError(err);
  }
}

function handleError(err: unknown) {
  if (err instanceof GitHubApiError) {
    if (err.status === 404) {
      return errorResponse(
        "REPO_NOT_FOUND",
        "That repository doesn't exist or isn't accessible.",
        404
      );
    }
    if (err.message.toLowerCase().includes("private")) {
      return errorResponse(
        "PRIVATE_REPO",
        "This repository is private and the configured token can't access it.",
        403
      );
    }
    if (err.message.toLowerCase().includes("rate limit")) {
      return errorResponse(
        "RATE_LIMITED",
        "GitHub API rate limit reached. Wait a bit and try again.",
        429
      );
    }
    return errorResponse("UNKNOWN", err.message, 502);
  }

  if (err instanceof MissingApiKeyError) {
    return errorResponse(
      "MISSING_AI_KEY",
      "Server is missing OPENAI_API_KEY. Add it to .env.local and restart the server.",
      500
    );
  }

  if (err instanceof InvalidAiJsonError) {
    return errorResponse(
      "AI_INVALID_JSON",
      "The AI returned a response that wasn't valid JSON. Try analyzing the repo again.",
      502
    );
  }

  if (err instanceof AiRequestError) {
    return errorResponse(
      "UNKNOWN",
      `AI provider error: ${err.message}`,
      err.status ?? 502
    );
  }

  console.error("Unhandled analyze-repo error:", err);
  return errorResponse(
    "UNKNOWN",
    "Something went wrong while analyzing the repository.",
    500
  );
}

function errorResponse(
  code: AnalyzeRepoErrorResponse["code"],
  error: string,
  status: number
) {
  const payload: AnalyzeRepoErrorResponse = { error, code };
  return NextResponse.json(payload, { status });
}
