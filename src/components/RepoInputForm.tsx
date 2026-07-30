"use client";

import { FormEvent, useState } from "react";

interface RepoInputFormProps {
  onSubmit: (url: string) => void;
  isLoading: boolean;
}

export default function RepoInputForm({ onSubmit, isLoading }: RepoInputFormProps) {
  const [value, setValue] = useState("");

  function handleSubmit(e: FormEvent) {
    e.preventDefault();
    if (!value.trim() || isLoading) return;
    onSubmit(value.trim());
  }

  return (
    <form onSubmit={handleSubmit} className="mx-auto w-full max-w-2xl">
      <div className="flex items-center gap-2 rounded-lg border border-border bg-bg-surface px-4 py-3.5 font-mono text-sm shadow-card transition focus-within:border-accent-mint/50">
        <span className="select-none text-accent-mint">$</span>
        <span className="select-none text-ink-muted">analyze</span>
        <input
          type="text"
          value={value}
          onChange={(e) => setValue(e.target.value)}
          placeholder="https://github.com/owner/repo"
          className="flex-1 bg-transparent text-ink placeholder:text-ink-faint outline-none"
          disabled={isLoading}
          aria-label="GitHub repository URL"
        />
      </div>
      <div className="mt-3 flex items-center justify-between">
        <p className="font-mono text-xs text-ink-faint">
          e.g. https://github.com/vercel/next.js
        </p>
        <button
          type="submit"
          disabled={isLoading || !value.trim()}
          className="rounded-md bg-accent-mint px-5 py-2 font-mono text-sm font-semibold text-bg transition hover:bg-accent-mint/90 disabled:cursor-not-allowed disabled:bg-border disabled:text-ink-faint"
        >
          {isLoading ? "Analyzing…" : "Analyze repo"}
        </button>
      </div>
    </form>
  );
}
