import { formatCategory, formatCurrency } from "./format";
import {
  type CategorySpend,
  type MonthlySpend,
  type RecentTransaction,
  type SummaryStats,
  getMonthlySpend,
  getRecentTransactions,
  getSpendByCategory,
  getSummaryStats,
} from "./queries";

const ML_SERVICE_TIMEOUT_MS = 2000;
const MAX_ANOMALIES = 5;

export type MonthOverMonth = {
  currentMonth: string;
  previousMonth: string;
  currentSpend: number;
  previousSpend: number;
  changePct: number | null;
};

export type AnomalyDetail = {
  transactionId: string;
  score: number;
  reason: string;
  method: string;
  merchant: string | null;
  amount: number | null;
  date: string | null;
};

export type StructuredContext = {
  summary: SummaryStats;
  spendByCategory: CategorySpend[];
  monthOverMonth: MonthOverMonth | null;
  anomalies: AnomalyDetail[];
  anomalyServiceAvailable: boolean;
};

type RawAnomalyResult = {
  transaction_id: string;
  score: number;
  reason: string;
  method: string;
};

type RawDetectResponse = {
  anomalies: RawAnomalyResult[];
};

export function computeMonthOverMonth(monthlySpend: MonthlySpend[]): MonthOverMonth | null {
  const [previous, current] = monthlySpend.slice(-2);
  if (!current || !previous) {
    return null;
  }
  return {
    currentMonth: current.month,
    previousMonth: previous.month,
    currentSpend: current.spend,
    previousSpend: previous.spend,
    changePct:
      previous.spend === 0 ? null : ((current.spend - previous.spend) / previous.spend) * 100,
  };
}

export async function getTopAnomalies(
  recentTransactions: RecentTransaction[],
  mlServiceUrl: string,
): Promise<{ anomalies: AnomalyDetail[]; available: boolean }> {
  try {
    const response = await fetch(`${mlServiceUrl}/detect?method=both`, {
      method: "POST",
      signal: AbortSignal.timeout(ML_SERVICE_TIMEOUT_MS),
    });
    if (!response.ok) {
      return { anomalies: [], available: false };
    }
    const data = (await response.json()) as RawDetectResponse;
    const byId = new Map(recentTransactions.map((tx) => [tx.id, tx]));
    const anomalies = data.anomalies
      .slice()
      .sort((a, b) => b.score - a.score)
      .slice(0, MAX_ANOMALIES)
      .map((anomaly): AnomalyDetail => {
        const tx = byId.get(anomaly.transaction_id);
        return {
          transactionId: anomaly.transaction_id,
          score: anomaly.score,
          reason: anomaly.reason,
          method: anomaly.method,
          merchant: tx?.merchant ?? null,
          amount: tx?.amount ?? null,
          date: tx ? tx.date.toISOString().slice(0, 10) : null,
        };
      });
    return { anomalies, available: true };
  } catch {
    return { anomalies: [], available: false };
  }
}

export async function buildInsightContext(): Promise<StructuredContext> {
  const mlServiceUrl = process.env.ML_SERVICE_URL ?? "http://localhost:8000";
  const [summary, spendByCategory, monthlySpend, recentTransactions] = await Promise.all([
    getSummaryStats(),
    getSpendByCategory(),
    getMonthlySpend(),
    getRecentTransactions(200),
  ]);

  const { anomalies, available } = await getTopAnomalies(recentTransactions, mlServiceUrl);

  return {
    summary,
    spendByCategory,
    monthOverMonth: computeMonthOverMonth(monthlySpend),
    anomalies,
    anomalyServiceAvailable: available,
  };
}

export function buildPrompt(
  question: string,
  context: StructuredContext,
): { system: string; question: string } {
  const categoryLines = context.spendByCategory
    .map((row) => `- ${formatCategory(row.category)}: ${formatCurrency(row.total)}`)
    .join("\n");

  const momLine = context.monthOverMonth
    ? `${context.monthOverMonth.previousMonth} spend ${formatCurrency(context.monthOverMonth.previousSpend)} -> ` +
      `${context.monthOverMonth.currentMonth} spend ${formatCurrency(context.monthOverMonth.currentSpend)}` +
      (context.monthOverMonth.changePct !== null
        ? ` (${context.monthOverMonth.changePct >= 0 ? "+" : ""}${context.monthOverMonth.changePct.toFixed(1)}%)`
        : "")
    : "Not enough months of data to compute a month-over-month change.";

  const anomalyLines = context.anomalyServiceAvailable
    ? context.anomalies.length > 0
      ? context.anomalies
          .map(
            (a) =>
              `- ${a.date ?? "unknown date"} ${a.merchant ?? a.transactionId} ` +
              `${a.amount !== null ? formatCurrency(a.amount) : ""} — ${a.reason} (score ${a.score.toFixed(2)}, ${a.method})`,
          )
          .join("\n")
      : "No anomalies detected."
    : "Anomaly detection service was unavailable — no anomaly data for this answer.";

  const system = `You are a financial insights assistant for FinPulse, a personal spending dashboard.
Answer the user's question using ONLY the figures given below. Cite specific numbers from this
data in your answer. Be concise (2-4 sentences). If the data below does not contain the
information needed to answer the question, say so plainly instead of guessing or inventing numbers.

## Summary (last 12 months)
Total spend: ${formatCurrency(context.summary.totalSpend)}
Total income: ${formatCurrency(context.summary.totalIncome)}
Net: ${formatCurrency(context.summary.net)}
Transaction count: ${context.summary.transactionCount}

## Spend by category (last 12 months)
${categoryLines || "No category data available."}

## Month-over-month change (most recent two months)
${momLine}

## Anomalies
${anomalyLines}`;

  return { system, question };
}
