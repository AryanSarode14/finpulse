import { Category } from "@prisma/client";
import { afterEach, describe, expect, it, vi } from "vitest";
import { detectAnomalies } from "./anomalies";
import type { RecentTransaction } from "./queries";

describe("detectAnomalies", () => {
  const transactions: RecentTransaction[] = [
    {
      id: "tx_1",
      date: new Date("2026-02-01"),
      merchant: "Acme Corp",
      amount: -999,
      category: Category.OTHER,
      accountName: "Checking",
    },
  ];

  afterEach(() => {
    vi.unstubAllGlobals();
  });

  it("joins anomalies with transaction details and sorts by score, unsliced", async () => {
    vi.stubGlobal(
      "fetch",
      vi.fn().mockResolvedValue({
        ok: true,
        json: async () => ({
          anomalies: [
            {
              transaction_id: "tx_1",
              score: 4.2,
              reason: "Unusually large charge",
              method: "statistical",
            },
            { transaction_id: "tx_2", score: 9.9, reason: "Never seen merchant", method: "arima" },
          ],
          transactions_scanned: 42,
        }),
      }),
    );

    const result = await detectAnomalies("http://localhost:8000", transactions);
    expect(result.available).toBe(true);
    expect(result.transactionsScanned).toBe(42);
    expect(result.anomalies).toHaveLength(2);
    expect(result.anomalies[0]).toMatchObject({ transactionId: "tx_2", merchant: null });
    expect(result.anomalies[1]).toMatchObject({
      transactionId: "tx_1",
      merchant: "Acme Corp",
      amount: -999,
    });
  });

  it("requests the given method as a query param", async () => {
    const fetchMock = vi
      .fn()
      .mockResolvedValue({
        ok: true,
        json: async () => ({ anomalies: [], transactions_scanned: 0 }),
      });
    vi.stubGlobal("fetch", fetchMock);

    await detectAnomalies("http://localhost:8000", transactions, "statistical");
    expect(fetchMock).toHaveBeenCalledWith(
      "http://localhost:8000/detect?method=statistical",
      expect.objectContaining({ method: "POST" }),
    );
  });

  it("degrades gracefully when the ML service is unreachable", async () => {
    vi.stubGlobal("fetch", vi.fn().mockRejectedValue(new Error("connection refused")));

    const result = await detectAnomalies("http://localhost:8000", transactions);
    expect(result).toEqual({ anomalies: [], available: false, transactionsScanned: 0 });
  });

  it("degrades gracefully on a non-2xx response", async () => {
    vi.stubGlobal("fetch", vi.fn().mockResolvedValue({ ok: false, json: async () => ({}) }));

    const result = await detectAnomalies("http://localhost:8000", transactions);
    expect(result).toEqual({ anomalies: [], available: false, transactionsScanned: 0 });
  });
});
