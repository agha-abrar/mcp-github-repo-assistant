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
    <form onSubmit={handleSubmit} className="mx-auto w-full max-w-2xl opacity-0 animate-fade-up">
      <div className="group flex items-center gap-2 rounded-3xl border border-border bg-bg-surface px-4 py-3.5 font-mono text-sm shadow-[0_0_40px_rgba(0,0,0,0.05)] transition duration-300 ease-out focus-within:border-accent-mint/50 hover:-translate-y-0.5 hover:border-accent-mint/70">
        <span className="select-none text-accent-mint">$</span>
        <span className="select-none text-ink-muted">analyze</span>
        <input
          type="text"
          value={value}
          onChange={(e) => setValue(e.target.value)}
          placeholder="https://github.com/owner/repo"
          className="flex-1 bg-transparent text-ink placeholder:text-ink-faint outline-none transition duration-200 ease-out focus:text-ink"
          disabled={isLoading}
          aria-label="GitHub repository URL"
        />
      </div>
      <div className="mt-3 flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
        <p className="font-mono text-xs text-ink-faint">
          e.g. https://github.com/vercel/next.js
        </p>
        <button
          type="submit"
          disabled={isLoading || !value.trim()}
          className="rounded-full bg-accent-mint px-5 py-2 font-mono text-sm font-semibold text-bg shadow-lg shadow-accent-mint/10 transition duration-200 ease-out hover:-translate-y-0.5 hover:bg-accent-mint/90 hover:shadow-[0_0_30px_rgba(94,234,212,0.18)] disabled:cursor-not-allowed disabled:bg-border disabled:text-ink-faint"
        >
          {isLoading ? "Analyzing…" : "Analyze repo"}
        </button>
      </div>
    </form>
  );
}
