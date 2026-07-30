import { RepoContext } from "@/types/repo";
import { daysSince } from "./formatDate";

/**
 * Deterministic, explainable health score computed straight from the
 * fetched GitHub data (no AI involved). The AI is also asked to produce
 * its own score with reasoning; this function exists as a transparent,
 * reproducible cross-check and as a fallback if the AI omits one.
 *
 * Bands:
 *   90-100 Excellent | 70-89 Good | 50-69 Needs attention | <50 Risky
 */
export function calculateHealthScore(context: RepoContext): {
  score: number;
  breakdown: { label: string; points: number; max: number }[];
} {
  const breakdown: { label: string; points: number; max: number }[] = [];

  // README availability - 20 pts
  const readmePoints = context.readme.exists ? 20 : 0;
  breakdown.push({ label: "README availability", points: readmePoints, max: 20 });

  // Recent update activity - 20 pts (fresher = better)
  const daysSinceUpdate = daysSince(context.metadata.lastUpdated);
  let activityPoints = 0;
  if (daysSinceUpdate <= 7) activityPoints = 20;
  else if (daysSinceUpdate <= 30) activityPoints = 15;
  else if (daysSinceUpdate <= 90) activityPoints = 8;
  else activityPoints = 2;
  breakdown.push({ label: "Recent update activity", points: activityPoints, max: 20 });

  // Open issue load - 20 pts (fewer relative to stars = healthier)
  const issueCount = context.metadata.openIssuesCount;
  let issuePoints = 20;
  if (issueCount > 500) issuePoints = 4;
  else if (issueCount > 200) issuePoints = 8;
  else if (issueCount > 50) issuePoints = 14;
  breakdown.push({ label: "Open issue load", points: issuePoints, max: 20 });

  // PR activity - 20 pts
  const prCount = context.pullRequests.length;
  const mergedRecently = context.pullRequests.filter(
    (p) => p.status === "merged" && daysSince(p.updatedAt) <= 30
  ).length;
  let prPoints = 5;
  if (prCount > 0) prPoints = 10;
  if (mergedRecently > 0) prPoints = 20;
  breakdown.push({ label: "Pull request activity", points: prPoints, max: 20 });

  // Issue severity mix - 20 pts (fewer bug/security-labeled issues = healthier)
  const severeLabels = ["bug", "security", "critical", "breaking"];
  const severeCount = context.issues.filter((i) =>
    i.labels.some((l) => severeLabels.some((s) => l.toLowerCase().includes(s)))
  ).length;
  let severityPoints = 20;
  if (severeCount > 20) severityPoints = 2;
  else if (severeCount > 10) severityPoints = 8;
  else if (severeCount > 3) severityPoints = 14;
  breakdown.push({ label: "Issue severity mix", points: severityPoints, max: 20 });

  const score = breakdown.reduce((sum, b) => sum + b.points, 0);

  return { score, breakdown };
}
