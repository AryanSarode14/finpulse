"use client";

import { useState, type FormEvent } from "react";
import { formatCategory, formatCurrency } from "@finpulse/core";
import type { StructuredContext } from "@/lib/insight-context";

const SUGGESTED_QUESTIONS = [
  "Which month was my most expensive?",
  "How has my dining spending changed?",
  "What are my biggest spending categories?",
  "Were there any unusual transactions?",
];

type InsightResponse = {
  insight: string;
  contextUsed: StructuredContext;
};

export function InsightsPanel() {
  const [question, setQuestion] = useState("");
  const [status, setStatus] = useState<"idle" | "loading" | "error">("idle");
  const [result, setResult] = useState<InsightResponse | null>(null);
  const [error, setError] = useState<string | null>(null);

  async function ask(q: string) {
    if (!q.trim()) return;
    setStatus("loading");
    setError(null);
    try {
      const res = await fetch("/api/insights", {
        method: "POST",
        headers: { "content-type": "application/json" },
        body: JSON.stringify({ question: q }),
      });
      const data: unknown = await res.json().catch(() => null);
      if (!res.ok) {
        const message =
          data && typeof data === "object" && "error" in data && typeof data.error === "string"
            ? data.error
            : `Request failed (${res.status})`;
        throw new Error(message);
      }
      setResult(data as InsightResponse);
      setStatus("idle");
    } catch (err) {
      setError(err instanceof Error ? err.message : "Something went wrong.");
      setStatus("error");
    }
  }

  function handleSubmit(event: FormEvent) {
    event.preventDefault();
    void ask(question);
  }

  return (
    <div className="rounded-xl border border-[var(--border)] bg-[var(--surface)] p-5 shadow-sm">
      <h2 className="mb-4 text-xs font-medium uppercase tracking-wide text-[var(--text-muted)]">
        Ask about your finances
      </h2>

      <form onSubmit={handleSubmit} className="flex flex-col gap-3 sm:flex-row">
        <input
          type="text"
          value={question}
          onChange={(event) => setQuestion(event.target.value)}
          placeholder="Ask a question about your spending..."
          className="flex-1 rounded-lg border border-[var(--border)] bg-[var(--page-bg)] px-3 py-2 text-sm text-[var(--text-primary)] outline-none focus:border-[var(--accent)]"
        />
        <button
          type="submit"
          disabled={status === "loading" || question.trim().length === 0}
          className="rounded-lg bg-[var(--accent)] px-4 py-2 text-sm font-medium text-white disabled:opacity-50"
        >
          {status === "loading" ? "Thinking..." : "Ask"}
        </button>
      </form>

      <div className="mt-3 flex flex-wrap gap-2">
        {SUGGESTED_QUESTIONS.map((suggestion) => (
          <button
            key={suggestion}
            type="button"
            onClick={() => {
              setQuestion(suggestion);
              void ask(suggestion);
            }}
            disabled={status === "loading"}
            className="rounded-full border border-[var(--border)] px-3 py-1 text-xs text-[var(--text-secondary)] hover:border-[var(--accent)] disabled:opacity-50"
          >
            {suggestion}
          </button>
        ))}
      </div>

      {status === "error" && error && (
        <p className="mt-4 text-sm text-[var(--chart-spend)]">{error}</p>
      )}

      {result && (
        <div className="mt-4 space-y-3">
          <p className="text-sm leading-relaxed text-[var(--text-primary)]">{result.insight}</p>
          <details className="rounded-lg border border-[var(--border)] p-3 text-xs text-[var(--text-secondary)]">
            <summary className="cursor-pointer font-medium text-[var(--text-muted)]">
              Grounded on
            </summary>
            <div className="mt-2 space-y-1">
              <p>Total spend: {formatCurrency(result.contextUsed.summary.totalSpend)}</p>
              <p>Total income: {formatCurrency(result.contextUsed.summary.totalIncome)}</p>
              <ul className="ml-4 list-disc">
                {result.contextUsed.spendByCategory.map((row) => (
                  <li key={row.category}>
                    {formatCategory(row.category)}: {formatCurrency(row.total)}
                  </li>
                ))}
              </ul>
              {!result.contextUsed.anomalyServiceAvailable && (
                <p className="italic">Anomaly detection service was unavailable for this answer.</p>
              )}
            </div>
          </details>
        </div>
      )}
    </div>
  );
}
