import { ReactNode } from "react";

interface ReportSectionProps {
  hash: string; // short git-hash-style id, e.g. "a1b2c3d" - encodes section order like a commit log
  title: string;
  subtitle?: string;
  children: ReactNode;
}

/**
 * Card wrapper used for every section of the report. Sections are labeled
 * with a short commit-hash-style id instead of "01/02/03" - a small nod to
 * the fact that this whole report is built from real git/GitHub data.
 */
export default function ReportSection({ hash, title, subtitle, children }: ReportSectionProps) {
  return (
    <section className="rounded-lg border border-border bg-bg-surface shadow-card">
      <header className="flex items-baseline gap-3 border-b border-border-soft px-5 py-4">
        <span className="font-mono text-xs text-accent-mint/70">{hash}</span>
        <div>
          <h2 className="font-mono text-sm font-semibold tracking-wide text-ink">{title}</h2>
          {subtitle && <p className="mt-0.5 text-xs text-ink-muted">{subtitle}</p>}
        </div>
      </header>
      <div className="px-5 py-4">{children}</div>
    </section>
  );
}
