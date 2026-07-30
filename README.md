# MCP-Powered GitHub Repo Assistant

An AI web app that analyzes a real GitHub repository — README, open issues, pull requests, and metadata — and turns it into a structured project report: issue triage, PR summary, documentation gaps, a 7-day sprint plan, and a health score.

## What problem it solves

Skimming a repo to understand "is this healthy? what's on fire? what should we work on next?" takes time — reading dozens of issues, checking PR activity, judging whether the docs are complete. This app automates that first pass: it pulls the real, current state of a repository and asks an AI to reason over it, producing a report a maintainer or new contributor could read in two minutes instead of two hours.

## How MCP is used

The core idea this project demonstrates: **the AI never analyzes a repo from memory. It only ever sees data that was just fetched.**

That separation is enforced by an MCP-style architecture:

- **MCP tools/resources** (`src/lib/mcp/githubMcpProvider.ts`) expose four functions — `getRepositoryMetadata`, `getRepositoryReadme`, `getOpenIssues`, `getPullRequests` — the same shape of tools the official [GitHub MCP Server](https://github.com/github/github-mcp-server) exposes.
- **MCP client** (`src/lib/mcp/mcpClient.ts`) calls those tools and assembles a `RepoContext` object. Today it calls the tools in-process; nothing else in the app needs to know that. If you connect the real GitHub MCP Server later, this is the only file you touch.
- **AI analysis layer** (`src/lib/ai/repoAnalyzer.ts` + `src/lib/ai/prompts.ts`) takes that `RepoContext` — real, fetched data — and is explicitly instructed *"base your analysis only on the JSON context provided, do not rely on prior knowledge about this repository."*

So the flow is always: **fetch first, then reason.** Built-in model knowledge is deliberately excluded from the analysis step.

### Architecture diagram (text form)

```
User
  │
  ▼
Next.js UI (RepoInputForm)
  │  POST /api/analyze-repo { url }
  ▼
Backend API route (src/app/api/analyze-repo/route.ts)
  │
  ├──▶ MCP Client (src/lib/mcp/mcpClient.ts)
  │        │
  │        ▼
  │     MCP-style Provider (src/lib/mcp/githubMcpProvider.ts)
  │        │  getRepositoryMetadata / getRepositoryReadme /
  │        │  getOpenIssues / getPullRequests
  │        ▼
  │     GitHub REST client (src/lib/github/githubApiClient.ts)
  │        │
  │        ▼
  │     GitHub API  ──▶  real metadata, README, issues, PRs
  │
  ▼
RepoContext (real fetched data)
  │
  ▼
AI Analyzer (src/lib/ai/repoAnalyzer.ts + prompts.ts)
  │  "analyze ONLY this JSON context"
  ▼
Structured JSON report (AnalysisResult)
  │
  ▼
AnalysisDashboard (UI) ──▶ User reads / copies the report
```

## Features

- Paste a GitHub repo URL, click **Analyze repo**
- Fetches: repo metadata, README, open issues, pull requests
- AI-generated:
  - Project summary
  - Repository metadata summary
  - README summary
  - Issue priority classification (High / Medium / Low) with reasons
  - Pull request summary
  - Documentation gaps
  - 7-day sprint plan
  - Project health score (0–100) with an explainable, deterministic fallback if the AI omits one
  - Final recommendations
- Copy the full report as plain text with one click
- Clear error states: invalid URL, repo not found, private repo, rate limit, missing keys, invalid AI JSON

## Tech stack

- Next.js 14 (App Router) + React 18 + TypeScript
- Tailwind CSS
- Next.js API routes (server-side only — no client-exposed secrets)
- OpenAI API for the AI layer (swappable — see `src/lib/ai/aiClient.ts`)
- GitHub REST API via a custom MCP-style provider layer

## Folder structure

```
src/
  app/
    page.tsx                     # Home page: input form + dashboard states
    layout.tsx
    globals.css
    api/analyze-repo/route.ts    # POST endpoint - orchestrates the whole flow
  components/
    RepoInputForm.tsx
    AnalysisDashboard.tsx
    ReportSection.tsx
    PriorityBadge.tsx
    LoadingState.tsx
    ErrorState.tsx
  lib/
    github/
      parseRepoUrl.ts            # Parses a GitHub URL into { owner, repo }
      githubApiClient.ts         # Only file that calls api.github.com directly
    mcp/
      mcpClient.ts                # MCP client facade - swap this for a real MCP session later
      githubMcpProvider.ts        # MCP-style tool provider (4 "tools")
      types.ts
    ai/
      aiClient.ts                 # Swappable LLM provider abstraction
      repoAnalyzer.ts              # Turns RepoContext -> AnalysisResult
      prompts.ts                   # System + user prompt construction
    utils/
      formatDate.ts
      calculateHealthScore.ts      # Deterministic health score (fallback/cross-check)
  types/
    repo.ts                       # Raw fetched-data types
    analysis.ts                   # AI output + API response types
```

## Installation

Requires Node.js 18.18+ (Node 20 LTS recommended) and npm.

```bash
git clone <this-repo-url>
cd mcp-github-assistant
npm install
```

## Environment variable setup

Copy the example file and fill in real values:

```bash
cp .env.example .env.local
```

```env
GITHUB_TOKEN=your_github_token_here
OPENAI_API_KEY=your_openai_api_key_here
OPENAI_MODEL=gpt-4o-mini   # optional
# Or, for OpenRouter:
# OPENROUTER_API_KEY=your_openrouter_api_key_here
# OPENROUTER_API_URL=https://openrouter.ai/api/v1
# OPENROUTER_MODEL=gpt-oss-120b
```

- `GITHUB_TOKEN`: a GitHub Personal Access Token with **read-only** scope (`public_repo` is enough for public repos). Create one at github.com → Settings → Developer settings → Personal access tokens.
- `OPENAI_API_KEY` or `OPENROUTER_API_KEY`: an API key for the AI provider.
- `OPENAI_MODEL` or `OPENROUTER_MODEL`: optional model name; defaults to `gpt-4o-mini`.
- `OPENAI_API_URL` or `OPENROUTER_API_URL`: optional endpoint override when using a non-OpenAI provider.

Never prefix any of these variables with `NEXT_PUBLIC_` — that would ship them to the browser. All values are read only inside server-side files (API routes and `lib/` modules that run on the server).

## How to run locally

```bash
npm run dev
```

Open http://localhost:3000, paste a repo URL, and click **Analyze repo**.

## Example repo to test

```
https://github.com/vercel/next.js
```

Smaller repos analyze faster and are easier to sanity-check, e.g. `https://github.com/expressjs/express`.

## How to test the project

1. Start the dev server and try the example repo above — you should see the full report render section by section.
2. Try a bad URL (e.g. `https://example.com`) — you should see the "invalid URL" error.
3. Try a repo that doesn't exist (e.g. `https://github.com/doesnotexist/doesnotexist123`) — you should see "repository not found."
4. Temporarily remove `OPENAI_API_KEY` from `.env.local` and restart — you should see the "missing AI key" error.
5. Click **Copy full report** and paste it into a text editor to confirm the plain-text report matches the dashboard.

## Security notes

- `GITHUB_TOKEN` and `OPENAI_API_KEY` are read only in server-side code (API routes, `lib/`). They are never sent to the browser.
- The app is **strictly read-only**: it never creates, updates, closes, or merges issues/PRs. Only `GET` requests are made to the GitHub API.
- Use a token with the minimum scopes needed (read-only, public repo access is sufficient for public repositories).

## Limitations

- Only public repositories are supported unless your token has access to the private repo in question.
- Issue/PR analysis is capped at the 20–25 most recently updated items per repo to keep prompts a reasonable size.
- The AI's JSON output is validated for shape, not for factual accuracy — always spot-check high-stakes decisions (e.g. before acting on a "high priority" issue).
- No persistence: reports aren't saved between requests.

## Future improvements

- Direct integration with the official GitHub MCP Server (swap `mcpClient.ts`'s implementation)
- Multi-agent orchestration (separate agents for issues, PRs, docs, sprint planning)
- Slack report generation
- Email report generation
- PDF export
- Issue creation suggestions (still read-only by default, opt-in for write actions)
- Auto-generated changelog
- Code quality analysis
- Security vulnerability analysis
- Team sprint board integration (Jira/Linear/GitHub Projects)
- Database storage for previous reports, so users can track health score over time
