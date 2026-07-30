import { RepoContext } from "@/types/repo";

/**
 * Types describing the MCP-style contract used by this app.
 *
 * In a full MCP setup, an MCP *client* running inside the app would
 * connect to an MCP *server* process (e.g. the official GitHub MCP
 * Server) over stdio or HTTP, and call its exposed "tools"/"resources".
 *
 * For this MVP we model that same contract in-process:
 *   - `McpToolName`   -> the tool names the server would expose
 *   - `McpProvider`   -> the interface githubMcpProvider.ts implements
 *   - `mcpClient.ts`  -> the thing the rest of the app calls, which
 *                        currently forwards to the in-process provider,
 *                        but could instead forward to a real MCP client.
 */

export type McpToolName =
  | "getRepositoryMetadata"
  | "getRepositoryReadme"
  | "getOpenIssues"
  | "getPullRequests";

export interface McpProvider {
  getRepositoryMetadata: (owner: string, repo: string) => Promise<RepoContext["metadata"]>;
  getRepositoryReadme: (owner: string, repo: string) => Promise<RepoContext["readme"]>;
  getOpenIssues: (owner: string, repo: string) => Promise<RepoContext["issues"]>;
  getPullRequests: (owner: string, repo: string) => Promise<RepoContext["pullRequests"]>;
}

export interface McpToolCallLog {
  tool: McpToolName;
  owner: string;
  repo: string;
  startedAt: string;
  finishedAt: string;
  ok: boolean;
}
