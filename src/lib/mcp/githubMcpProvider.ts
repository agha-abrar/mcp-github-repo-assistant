import {
  fetchRepoMetadata,
  fetchRepoReadme,
  fetchOpenIssues,
  fetchPullRequests,
} from "@/lib/github/githubApiClient";
import { McpProvider } from "./types";

/**
 * MCP-style tool provider for GitHub data.
 *
 * Each exported function here represents one MCP "tool" or "resource" -
 * getRepositoryMetadata, getRepositoryReadme, getOpenIssues, getPullRequests.
 * Right now they are implemented by calling our own GitHub REST client
 * (src/lib/github/githubApiClient.ts), but the function signatures and
 * return shapes are written to match what the tool calls would look like
 * against the official GitHub MCP Server
 * (https://github.com/github/github-mcp-server).
 *
 * TO SWAP IN THE REAL MCP SERVER LATER:
 *   1. Stand up (or connect to) the GitHub MCP Server.
 *   2. Replace the function bodies below with calls through an MCP client
 *      (see mcpClient.ts) using the same tool names, e.g.
 *        mcpClient.callTool("getRepositoryMetadata", { owner, repo })
 *   3. Nothing outside this file needs to change - repoAnalyzer.ts and the
 *      API route only ever import from this provider.
 */
export const githubMcpProvider: McpProvider = {
  async getRepositoryMetadata(owner: string, repo: string) {
    return fetchRepoMetadata(owner, repo);
  },

  async getRepositoryReadme(owner: string, repo: string) {
    return fetchRepoReadme(owner, repo);
  },

  async getOpenIssues(owner: string, repo: string) {
    return fetchOpenIssues(owner, repo);
  },

  async getPullRequests(owner: string, repo: string) {
    return fetchPullRequests(owner, repo);
  },
};
