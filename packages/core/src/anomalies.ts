import type { RecentTransaction } from "./queries";

const ML_SERVICE_TIMEOUT_MS = 2000;

export type DetectMethod = "statistical" | "arima" | "both";

export type AnomalyDetail = {
  transactionId: string;
  score: number;
  reason: string;
  method: string;
  merchant: string | null;
  amount: number | null;
  date: string | null;
};

export type DetectAnomaliesResult = {
  anomalies: AnomalyDetail[];
  available: boolean;
  transactionsScanned: number;
};

type RawAnomalyResult = {
  transaction_id: string;
  score: number;
  reason: string;
  method: string;
};

type RawDetectResponse = {
  anomalies: RawAnomalyResult[];
  transactions_scanned: number;
};

/**
 * Calls the services/ml /detect endpoint and joins results back to
 * transaction details for display. Returns every flagged anomaly sorted by
 * score descending, unsliced -- callers decide how many to keep. Degrades
 * gracefully (available: false) on any timeout, non-2xx, or network error.
 */
export async function detectAnomalies(
  mlServiceUrl: string,
  transactionsForLookup: RecentTransaction[],
  method: DetectMethod = "both",
): Promise<DetectAnomaliesResult> {
  try {
    const response = await fetch(`${mlServiceUrl}/detect?method=${method}`, {
      method: "POST",
      signal: AbortSignal.timeout(ML_SERVICE_TIMEOUT_MS),
    });
    if (!response.ok) {
      return { anomalies: [], available: false, transactionsScanned: 0 };
    }
    const data = (await response.json()) as RawDetectResponse;
    const byId = new Map(transactionsForLookup.map((tx) => [tx.id, tx]));
    const anomalies = data.anomalies
      .slice()
      .sort((a, b) => b.score - a.score)
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
    return { anomalies, available: true, transactionsScanned: data.transactions_scanned };
  } catch {
    return { anomalies: [], available: false, transactionsScanned: 0 };
  }
}
