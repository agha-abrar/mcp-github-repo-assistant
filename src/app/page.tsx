"use client";

import { useState } from "react";
import RepoInputForm from "@/components/RepoInputForm";
import LoadingState from "@/components/LoadingState";
import ErrorState from "@/components/ErrorState";
import AnalysisDashboard from "@/components/AnalysisDashboard";
import { AnalyzeRepoResponse } from "@/types/analysis";

type ViewState =
  | { status: "idle" }
  | { status: "loading" }
  | { status: "error"; message: string }
  | { status: "success"; data: AnalyzeRepoResponse };

export default function Home() {
  const [state, setState] = useState<ViewState>({ status: "idle" });
  const [lastUrl, setLastUrl] = useState("");

  async function handleAnalyze(url: string) {
    setLastUrl(url);
    setState({ status: "loading" });
    try {
      const res = await fetch("/api/analyze-repo", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ url }),
      });
      const json = await res.json();
      if (!res.ok) {
        setState({ status: "error", message: json.error || "Something went wrong." });
        return;
      }
      setState({ status: "success", data: json as AnalyzeRepoResponse });
    } catch {
      setState({
        status: "error",
        message: "Couldn't reach the server. Check your connection and try again.",
      });
    }
  }

  const showHero = state.status === "idle";

  return (
    <main className="min-h-screen">
      <section
        className={`bg-hero-grid border-b border-border-soft px-6 ${
          showHero ? "py-24" : "py-12"
        } transition-all`}
      >
        <div className="mx-auto max-w-2xl text-center">
          <p className="mb-3 font-mono text-xs uppercase tracking-[0.2em] text-accent-mint/80">
            MCP-powered · read-only
          </p>
          <h1 className="text-3xl font-bold tracking-tight text-ink sm:text-4xl">
            GitHub Repo Assistant
          </h1>
          {showHero && (
            <p className="mx-auto mt-3 max-w-lg text-sm leading-relaxed text-ink-muted">
              Paste a repository URL. An MCP-style layer fetches its real README,
              issues, and pull requests, then an AI analyzer turns that into a
              full project report — issue triage, doc gaps, a 7-day sprint plan,
              and a health score.
            </p>
          )}
          <div className="mt-8">
            <RepoInputForm onSubmit={handleAnalyze} isLoading={state.status === "loading"} />
          </div>
        </div>
      </section>

      <section className="px-6 py-10">
        {state.status === "loading" && <LoadingState />}
        {state.status === "error" && (
          <ErrorState message={state.message} onRetry={() => handleAnalyze(lastUrl)} />
        )}
        {state.status === "success" && <AnalysisDashboard data={state.data} />}
        {state.status === "idle" && (
          <div className="mx-auto max-w-2xl text-center font-mono text-xs text-ink-faint">
            No repository analyzed yet. Try{" "}
            <code className="text-ink-muted">github.com/vercel/next.js</code>.
          </div>
        )}
      </section>
    </main>
  );
}
