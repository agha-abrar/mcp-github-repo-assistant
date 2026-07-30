export default function ErrorState({
  message,
  onRetry,
}: {
  message: string;
  onRetry?: () => void;
}) {
  return (
    <div className="mx-auto max-w-2xl rounded-lg border border-accent-danger/30 bg-accent-danger/5 p-6">
      <div className="flex items-start gap-3">
        <span className="mt-0.5 font-mono text-accent-danger">✕</span>
        <div className="flex-1">
          <p className="font-mono text-xs uppercase tracking-wider text-accent-danger">
            Analysis failed
          </p>
          <p className="mt-1 text-sm text-ink">{message}</p>
          {onRetry && (
            <button
              onClick={onRetry}
              className="mt-4 rounded border border-border px-3 py-1.5 font-mono text-xs text-ink-muted transition hover:border-accent-mint hover:text-accent-mint"
            >
              Try again
            </button>
          )}
        </div>
      </div>
    </div>
  );
}
