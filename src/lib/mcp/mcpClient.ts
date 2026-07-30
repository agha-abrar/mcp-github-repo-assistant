import { RepoContext } from "@/types/repo";
import { githubMcpProvider } from "./githubMcpProvider";
import { McpToolCallLog, McpToolName } from "./types";

/**
 * MCP client facade.
 *
 * This is the layer the rest of the app talks to. Today it forwards every
 * "tool call" straight to the in-process `githubMcpProvider`. If you later
 * connect to a real MCP server (stdio or HTTP transport, e.g. the official
 * GitHub MCP Server), this is the ONLY file that needs to change: swap the
 * body of `callTool` to open an MCP session and dispatch the call there,
 * and keep the same public `buildRepoContext` function so nothing else in
 * the app has to know the difference.
 */

const toolLog: McpToolCallLog[] = [];

async function callTool<T>(
  tool: McpToolName,
  owner: string,
  repo: string,
  fn: () => Promise<T>
): Promise<T> {
  const startedAt = new Date().toISOString();
  try {
    const result = await fn();
    toolLog.push({ tool, owner, repo, startedAt, finishedAt: new Date().toISOString(), ok: true });
    return result;
  } catch (err) {
    toolLog.push({ tool, owner, repo, startedAt, finishedAt: new Date().toISOString(), ok: false });
    throw err;
  }
}

/**
 * Calls all four MCP tools for a given repo and assembles the RepoContext
 * that gets handed to the AI analyzer. This is the "MCP Client or MCP-style
 * service layer" step in the architecture diagram.
 */
export async function buildRepoContext(
  owner: string,
  repo: string
): Promise<RepoContext> {
  const [metadata, readme, issues, pullRequests] = await Promise.all([
    callTool("getRepositoryMetadata", owner, repo, () =>
      githubMcpProvider.getRepositoryMetadata(owner, repo)
    ),
    callTool("getRepositoryReadme", owner, repo, () =>
      githubMcpProvider.getRepositoryReadme(owner, repo)
    ),
    callTool("getOpenIssues", owner, repo, () =>
      githubMcpProvider.getOpenIssues(owner, repo)
    ),
    callTool("getPullRequests", owner, repo, () =>
      githubMcpProvider.getPullRequests(owner, repo)
    ),
  ]);

  return { owner, repo, metadata, readme, issues, pullRequests };
}

export function getToolCallLog(): McpToolCallLog[] {
  return toolLog;
}
