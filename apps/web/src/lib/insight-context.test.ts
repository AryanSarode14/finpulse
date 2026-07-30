import { Category } from "@prisma/client";
import { afterEach, describe, expect, it, vi } from "vitest";
import { buildPrompt, computeMonthOverMonth, getTopAnomalies } from "./insight-context";
import type { RecentTransaction } from "./queries";

describe("computeMonthOverMonth", () => {
  it("computes the change between the last two months", () => {
    const result = computeMonthOverMonth([
      { month: "2025-12", spend: 100, income: 0 },
      { month: "2026-01", spend: 150, income: 0 },
      { month: "2026-02", spend: 200, income: 0 },
    ]);
    expect(result).toEqual({
      currentMonth: "2026-02",
      previousMonth: "2026-01",
      currentSpend: 200,
      previousSpend: 150,
      changePct: expect.closeTo(33.33, 1),
    });
  });

  it("returns null with fewer than two months of data", () => {
    expect(computeMonthOverMonth([{ month: "2026-02", spend: 200, income: 0 }])).toBeNull();
    expect(computeMonthOverMonth([])).toBeNull();
  });

  it("returns null changePct when the previous month had zero spend", () => {
    const result = computeMonthOverMonth([
      { month: "2026-01", spend: 0, income: 0 },
      { month: "2026-02", spend: 50, income: 0 },
    ]);
    expect(result?.changePct).toBeNull();
  });
});

describe("buildPrompt", () => {
  it("cites real figures from the context in the system prompt", () => {
    const { system, question } = buildPrompt("Why was last month expensive?", {
      summary: { totalSpend: 1234.5, totalIncome: 5000, net: 3765.5, transactionCount: 42 },
      spendByCategory: [{ category: Category.DINING, total: 300.25 }],
      monthOverMonth: {
        currentMonth: "2026-02",
        previousMonth: "2026-01",
        currentSpend: 200,
        previousSpend: 150,
        changePct: 33.3,
      },
      anomalies: [
        {
          transactionId: "tx_1",
          score: 4.2,
          reason: "Unusually large charge",
          method: "statistical",
          merchant: "Acme Corp",
          amount: -999,
          date: "2026-02-01",
        },
      ],
      anomalyServiceAvailable: true,
    });

    expect(question).toBe("Why was last month expensive?");
    expect(system).toContain("$1,234.50");
    expect(system).toContain("Dining");
    expect(system).toContain("$300.25");
    expect(system).toContain("Acme Corp");
    expect(system).toContain("Unusually large charge");
    expect(system).toContain("ONLY the figures given below");
  });

  it("degrades gracefully when the anomaly service was unavailable", () => {
    const { system } = buildPrompt("Any unusual spending?", {
      summary: { totalSpend: 0, totalIncome: 0, net: 0, transactionCount: 0 },
      spendByCategory: [],
      monthOverMonth: null,
      anomalies: [],
      anomalyServiceAvailable: false,
    });

    expect(system).toContain("Anomaly detection service was unavailable");
    expect(system).toContain("Not enough months of data");
  });
});

describe("getTopAnomalies", () => {
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

  it("joins anomalies with transaction details and sorts by score", async () => {
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
        }),
      }),
    );

    const result = await getTopAnomalies(transactions, "http://localhost:8000");
    expect(result.available).toBe(true);
    expect(result.anomalies).toHaveLength(2);
    expect(result.anomalies[0]).toMatchObject({ transactionId: "tx_2", merchant: null });
    expect(result.anomalies[1]).toMatchObject({
      transactionId: "tx_1",
      merchant: "Acme Corp",
      amount: -999,
    });
  });

  it("degrades gracefully when the ML service is unreachable", async () => {
    vi.stubGlobal("fetch", vi.fn().mockRejectedValue(new Error("connection refused")));

    const result = await getTopAnomalies(transactions, "http://localhost:8000");
    expect(result).toEqual({ anomalies: [], available: false });
  });

  it("degrades gracefully on a non-2xx response", async () => {
    vi.stubGlobal("fetch", vi.fn().mockResolvedValue({ ok: false, json: async () => ({}) }));

    const result = await getTopAnomalies(transactions, "http://localhost:8000");
    expect(result).toEqual({ anomalies: [], available: false });
  });
});
