const STEPS = [
  "Connecting to MCP data layer",
  "Fetching repository metadata",
  "Reading README + open issues + pull requests",
  "Handing real repo context to the AI analyzer",
  "Compiling report",
];

export default function LoadingState() {
  return (
    <div className="mx-auto max-w-2xl rounded-lg border border-border bg-bg-surface p-6 font-mono text-sm shadow-card">
      <p className="mb-4 text-ink-muted">$ analyze --repo --live</p>
      <ul className="space-y-2.5">
        {STEPS.map((step, i) => (
          <li
            key={step}
            className="flex items-center gap-3 text-ink-muted opacity-0 animate-[fadein_0.4s_ease_forwards]"
            style={{ animationDelay: `${i * 0.35}s` }}
          >
            <span className="h-3.5 w-3.5 shrink-0 animate-pulse rounded-full border-2 border-accent-mint border-t-transparent" />
            <span>{step}...</span>
          </li>
        ))}
      </ul>
      <style>{`
        @keyframes fadein {
          to { opacity: 1; }
        }
      `}</style>
    </div>
  );
}
