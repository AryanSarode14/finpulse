import { afterEach, describe, expect, it, vi } from "vitest";
import { makeFindAnomaliesHandler } from "./find-anomalies";

vi.mock("@finpulse/core", () => ({
  listTransactions: vi.fn(),
  detectAnomalies: vi.fn(),
  formatCurrency: (n: number) => `$${n.toFixed(2)}`,
}));

import { detectAnomalies, listTransactions } from "@finpulse/core";

describe("find_anomalies handler", () => {
  afterEach(() => {
    vi.unstubAllEnvs();
  });

  it("returns a clear message when the ML service is unavailable", async () => {
    vi.mocked(listTransactions).mockResolvedValue([]);
    vi.mocked(detectAnomalies).mockResolvedValue({
      anomalies: [],
      available: false,
      transactionsScanned: 0,
    });
    const handler = makeFindAnomaliesHandler({} as never);
    const result = await handler({});

    expect(result.content[0]?.text).toContain("unavailable");
    expect(result.content[0]?.text).toContain("http://localhost:8000");
  });

  it("respects ML_SERVICE_URL when set", async () => {
    vi.stubEnv("ML_SERVICE_URL", "http://ml.internal:9000");
    vi.mocked(listTransactions).mockResolvedValue([]);
    vi.mocked(detectAnomalies).mockResolvedValue({
      anomalies: [],
      available: false,
      transactionsScanned: 0,
    });
    const handler = makeFindAnomaliesHandler({} as never);
    await handler({});

    expect(detectAnomalies).toHaveBeenCalledWith("http://ml.internal:9000", [], "both");
  });

  it("returns a clear message when no anomalies are found", async () => {
    vi.mocked(listTransactions).mockResolvedValue([]);
    vi.mocked(detectAnomalies).mockResolvedValue({
      anomalies: [],
      available: true,
      transactionsScanned: 100,
    });
    const handler = makeFindAnomaliesHandler({} as never);
    const result = await handler({});

    expect(result.content[0]?.text).toBe("No anomalies detected across 100 scanned transactions.");
  });

  it("formats flagged anomalies and respects the limit", async () => {
    vi.mocked(listTransactions).mockResolvedValue([]);
    vi.mocked(detectAnomalies).mockResolvedValue({
      anomalies: [
        {
          transactionId: "tx_1",
          score: 9.9,
          reason: "Never seen merchant",
          method: "arima",
          merchant: "Nobu",
          amount: -420,
          date: "2026-03-14",
        },
        {
          transactionId: "tx_2",
          score: 4.2,
          reason: "duplicate charge",
          method: "statistical",
          merchant: "Amazon",
          amount: -89.99,
          date: "2026-01-02",
        },
      ],
      available: true,
      transactionsScanned: 387,
    });
    const handler = makeFindAnomaliesHandler({} as never);
    const result = await handler({ limit: 1 });

    const text = result.content[0]?.text ?? "";
    expect(text).toContain("Found 1 anomaly (of 2 flagged across 387 scanned transactions)");
    expect(text).toContain("Nobu");
    expect(text).not.toContain("Amazon");
  });
});
