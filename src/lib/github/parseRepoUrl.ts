/**
 * Parses a GitHub repository URL into an { owner, repo } pair.
 *
 * Accepts things like:
 *   https://github.com/vercel/next.js
 *   https://github.com/vercel/next.js/
 *   https://github.com/vercel/next.js.git
 *   github.com/vercel/next.js
 *
 * Returns null if the URL is not a valid GitHub repository URL.
 */
export function parseRepoUrl(
  input: string
): { owner: string; repo: string } | null {
  if (!input || typeof input !== "string") return null;

  const trimmed = input.trim();

  // Allow the user to paste a bare "owner/repo" as well as a full URL.
  const withProtocol = /^https?:\/\//i.test(trimmed)
    ? trimmed
    : `https://${trimmed.replace(/^\/\//, "")}`;

  let url: URL;
  try {
    url = new URL(withProtocol);
  } catch {
    return null;
  }

  if (!/^(www\.)?github\.com$/i.test(url.hostname)) {
    return null;
  }

  const segments = url.pathname.split("/").filter(Boolean);
  if (segments.length < 2) return null;

  const owner = segments[0];
  const repo = segments[1].replace(/\.git$/i, "");

  const validSegment = /^[a-zA-Z0-9._-]+$/;
  if (!validSegment.test(owner) || !validSegment.test(repo)) {
    return null;
  }

  return { owner, repo };
}
