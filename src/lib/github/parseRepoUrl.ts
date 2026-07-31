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
  if (!trimmed) return null;

  const bareRepoMatch = trimmed.match(/^([a-zA-Z0-9._-]+)\/([a-zA-Z0-9._-]+)$/);
  if (bareRepoMatch) {
    return { owner: bareRepoMatch[1], repo: bareRepoMatch[2] };
  }

  let normalized = trimmed;

  if (/^git@github\.com:/i.test(normalized)) {
    normalized = normalized.replace(/^git@github\.com:/i, "https://github.com/");
  } else if (/^git\+https?:\/\//i.test(normalized)) {
    normalized = normalized.replace(/^git\+/, "");
  } else if (/^github\.com\//i.test(normalized)) {
    normalized = `https://${normalized}`;
  } else if (/^www\.github\.com\//i.test(normalized)) {
    normalized = `https://${normalized}`;
  } else if (!/^(https?:)?\/\//i.test(normalized)) {
    normalized = `https://${normalized.replace(/^\//, "")}`;
  }

  let url: URL;
  try {
    url = new URL(normalized);
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
