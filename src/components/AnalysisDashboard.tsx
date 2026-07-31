"use client";

import { useState } from "react";
import { AnalyzeRepoResponse } from "@/types/analysis";
import ReportSection from "./ReportSection";
import PriorityBadge from "./PriorityBadge";
import { formatDate } from "@/lib/utils/formatDate";

function HealthGauge({ score }: { score: number }) {
  const radius = 54;
  const circumference = 2 * Math.PI * radius;
  const clamped = Math.max(0, Math.min(100, score));
  const offset = circumference * (1 - clamped / 100);

  const color =
    clamped >= 90
      ? "#5EEAD4"
      : clamped >= 70
      ? "#6C8EF5"
      : clamped >= 50
      ? "#F5A623"
      : "#F0555A";

  const band =
    clamped >= 90 ? "Excellent" : clamped >= 70 ? "Good" : clamped >= 50 ? "Needs attention" : "Risky";

  return (
    <div className="flex items-center gap-6">
      <div className="relative h-[132px] w-[132px] shrink-0">
        <svg width="132" height="132" viewBox="0 0 132 132" className="-rotate-90">
          <circle cx="66" cy="66" r={radius} fill="none" stroke="#232B3D" strokeWidth="12" />
          <circle
            cx="66"
            cy="66"
            r={radius}
            fill="none"
            stroke={color}
            strokeWidth="12"
            strokeDasharray={circumference}
            strokeDashoffset={offset}
            strokeLinecap="round"
            style={{ transition: "stroke-dashoffset 0.8s ease" }}
          />
        </svg>
        <div className="absolute inset-0 flex flex-col items-center justify-center">
          <span className="font-mono text-3xl font-bold text-ink">{clamped}</span>
          <span className="text-[11px] text-ink-faint">/ 100</span>
        </div>
      </div>
      <div>
        <p className="font-mono text-sm font-semibold" style={{ color }}>
          {band}
        </p>
      </div>
    </div>
  );
}

export default function AnalysisDashboard({ data }: { data: AnalyzeRepoResponse }) {
  const [copied, setCopied] = useState(false);
  const { metadata, analysis, owner, repo } = data;

  function buildPlainTextReport(): string {
    const lines: string[] = [];
    lines.push(`# Repo Assistant Report - ${owner}/${repo}`);
    lines.push("");
    lines.push("## Project Summary");
    lines.push(analysis.projectSummary);
    lines.push("");
    lines.push("## Repository Metadata");
    lines.push(analysis.repoMetadataSummary);
    lines.push(
      `Stars: ${metadata.stars} | Forks: ${metadata.forks} | Open issues: ${metadata.openIssuesCount} | Language: ${
        metadata.primaryLanguage ?? "n/a"
      } | Last updated: ${formatDate(metadata.lastUpdated)}`
    );
    lines.push("");
    lines.push("## README Summary");
    lines.push(analysis.readmeSummary);
    lines.push("");
    lines.push("## Issue Priority Analysis");
    lines.push(`Total analyzed: ${analysis.issueAnalysis.totalIssuesAnalyzed}`);
    (["highPriority", "mediumPriority", "lowPriority"] as const).forEach((key) => {
      const label = key === "highPriority" ? "High" : key === "mediumPriority" ? "Medium" : "Low";
      lines.push(`\n${label} priority:`);
      analysis.issueAnalysis[key].forEach((issue) => {
        lines.push(`- ${issue.title} — ${issue.reason} (${issue.url})`);
      });
    });
    lines.push("");
    lines.push("## Pull Request Summary");
    lines.push(analysis.pullRequestSummary.summary);
    analysis.pullRequestSummary.importantPRs.forEach((pr) => lines.push(`- ${pr}`));
    lines.push("");
    lines.push("## Documentation Gaps");
    analysis.documentationGaps.forEach((gap) => lines.push(`- ${gap}`));
    lines.push("");
    lines.push("## 7-Day Sprint Plan");
    analysis.sprintPlan.forEach((day) => {
      lines.push(`\n${day.day}: ${day.reason}`);
      day.tasks.forEach((t) => lines.push(`  - ${t}`));
    });
    lines.push("");
    lines.push("## Project Health Score");
    lines.push(`${analysis.projectHealthScore.score}/100 - ${analysis.projectHealthScore.reason}`);
    lines.push("");
    lines.push("## Final Recommendations");
    analysis.finalRecommendations.forEach((r) => lines.push(`- ${r}`));
    return lines.join("\n");
  }

  async function handleCopy() {
    try {
      await navigator.clipboard.writeText(buildPlainTextReport());
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    } catch {
      // Clipboard API can fail in insecure contexts - fail silently, button just won't confirm.
    }
  }

  return (
    <div className="mx-auto max-w-4xl space-y-5 pb-16 opacity-0 animate-fade-up">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div>
          <p className="font-mono text-xs text-ink-faint">report for</p>
          <a
            href={metadata.htmlUrl}
            target="_blank"
            rel="noreferrer"
            className="font-mono text-lg font-semibold text-ink hover:text-accent-mint"
          >
            {owner}/{repo} ↗
          </a>
        </div>
        <button
          onClick={handleCopy}
          className="rounded-md border border-border px-4 py-2 font-mono text-xs text-ink-muted transition hover:border-accent-mint hover:text-accent-mint"
        >
          {copied ? "Copied ✓" : "Copy full report"}
        </button>
      </div>

      <ReportSection hash="a1b2c3d" title="Project overview" delay={0.05}>
        <p className="text-sm leading-relaxed text-ink-muted">{analysis.projectSummary}</p>
      </ReportSection>

      <ReportSection hash="e4f5a6b" title="Repository metadata" delay={0.1}>
        <div className="mb-3 grid grid-cols-2 gap-3 sm:grid-cols-4">
          <Stat label="Stars" value={metadata.stars.toLocaleString()} />
          <Stat label="Forks" value={metadata.forks.toLocaleString()} />
          <Stat label="Open issues" value={metadata.openIssuesCount.toLocaleString()} />
          <Stat label="Language" value={metadata.primaryLanguage ?? "—"} />
        </div>
        <p className="text-xs text-ink-faint">
          Default branch <span className="text-ink-muted">{metadata.defaultBranch}</span> · Last updated{" "}
          <span className="text-ink-muted">{formatDate(metadata.lastUpdated)}</span>
        </p>
        <p className="mt-3 text-sm leading-relaxed text-ink-muted">{analysis.repoMetadataSummary}</p>
      </ReportSection>

      <ReportSection hash="7c8d9e0" title="README summary" delay={0.15}>
        <p className="text-sm leading-relaxed text-ink-muted">{analysis.readmeSummary}</p>
      </ReportSection>

      <ReportSection
        hash="1f2a3b4"
        title="Issue priority analysis"
        subtitle={`${analysis.issueAnalysis.totalIssuesAnalyzed} open issues analyzed`}
        delay={0.2}
      >
        <div className="space-y-5">
          <IssueGroup priority="high" issues={analysis.issueAnalysis.highPriority} />
          <IssueGroup priority="medium" issues={analysis.issueAnalysis.mediumPriority} />
          <IssueGroup priority="low" issues={analysis.issueAnalysis.lowPriority} />
        </div>
      </ReportSection>

      <ReportSection
        hash="5c6d7e8"
        title="Pull request summary"
        subtitle={`${analysis.pullRequestSummary.totalPRsAnalyzed} pull requests analyzed`}
        delay={0.25}
      >
        <p className="mb-3 text-sm leading-relaxed text-ink-muted">
          {analysis.pullRequestSummary.summary}
        </p>
        {analysis.pullRequestSummary.importantPRs.length > 0 && (
          <ul className="space-y-1.5">
            {analysis.pullRequestSummary.importantPRs.map((pr, i) => (
              <li key={i} className="flex gap-2 text-sm text-ink-muted">
                <span className="text-accent-mint">›</span> {pr}
              </li>
            ))}
          </ul>
        )}
      </ReportSection>

      <ReportSection hash="9a0b1c2" title="Documentation gaps" delay={0.3}>
        {analysis.documentationGaps.length === 0 ? (
          <p className="text-sm text-ink-faint">No significant documentation gaps found.</p>
        ) : (
          <ul className="space-y-1.5">
            {analysis.documentationGaps.map((gap, i) => (
              <li key={i} className="flex gap-2 text-sm text-ink-muted">
                <span className="text-accent-amber">▲</span> {gap}
              </li>
            ))}
          </ul>
        )}
      </ReportSection>

      <ReportSection hash="3d4e5f6" title="7-day sprint plan" delay={0.35}>
        <ol className="relative space-y-5 border-l border-border pl-6">
          {analysis.sprintPlan.map((day, i) => (
            <li key={i} className="relative">
              <span className="absolute -left-[29px] top-1 h-3 w-3 rounded-full border-2 border-accent-mint bg-bg-surface" />
              <p className="font-mono text-xs font-semibold text-accent-mint">{day.day}</p>
              <p className="mt-0.5 text-xs italic text-ink-faint">{day.reason}</p>
              <ul className="mt-2 space-y-1">
                {day.tasks.map((task, j) => (
                  <li key={j} className="text-sm text-ink-muted">
                    · {task}
                  </li>
                ))}
              </ul>
            </li>
          ))}
        </ol>
      </ReportSection>

      <ReportSection hash="7g8h9i0" title="Project health score" delay={0.4}>
        <HealthGauge score={analysis.projectHealthScore.score} />
        <p className="mt-4 text-sm leading-relaxed text-ink-muted">
          {analysis.projectHealthScore.reason}
        </p>
      </ReportSection>

      <ReportSection hash="b1c2d3e" title="Final recommendations" delay={0.45}>
        <ul className="space-y-1.5">
          {analysis.finalRecommendations.map((rec, i) => (
            <li key={i} className="flex gap-2 text-sm text-ink-muted">
              <span className="text-accent-mint">✓</span> {rec}
            </li>
          ))}
        </ul>
      </ReportSection>
    </div>
  );
}

function Stat({ label, value }: { label: string; value: string }) {
  return (
    <div className="rounded-md border border-border-soft bg-bg-raised px-3 py-2">
      <p className="text-[11px] uppercase tracking-wide text-ink-faint">{label}</p>
      <p className="font-mono text-sm font-semibold text-ink">{value}</p>
    </div>
  );
}

function IssueGroup({
  priority,
  issues,
}: {
  priority: "high" | "medium" | "low";
  issues: { title: string; reason: string; url: string; labels: string[] }[];
}) {
  if (issues.length === 0) return null;
  return (
    <div>
      <div className="mb-2 flex items-center gap-2">
        <PriorityBadge priority={priority} />
        <span className="text-xs text-ink-faint">{issues.length} issue(s)</span>
      </div>
      <ul className="space-y-2">
        {issues.map((issue, i) => (
          <li key={i} className="rounded-md border border-border-soft bg-bg-raised p-3">
            <a
              href={issue.url}
              target="_blank"
              rel="noreferrer"
              className="text-sm font-medium text-ink hover:text-accent-mint"
            >
              {issue.title}
            </a>
            <p className="mt-1 text-xs text-ink-muted">{issue.reason}</p>
            {issue.labels.length > 0 && (
              <div className="mt-2 flex flex-wrap gap-1.5">
                {issue.labels.map((label) => (
                  <span
                    key={label}
                    className="rounded border border-border-soft bg-bg-surface px-1.5 py-0.5 font-mono text-[10px] text-ink-faint"
                  >
                    {label}
                  </span>
                ))}
              </div>
            )}
          </li>
        ))}
      </ul>
    </div>
  );
}
