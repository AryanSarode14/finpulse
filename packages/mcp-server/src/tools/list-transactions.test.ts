import { Category } from "@prisma/client";
import { describe, expect, it, vi } from "vitest";
import { makeListTransactionsHandler } from "./list-transactions";

vi.mock("@finpulse/core", () => ({
  listTransactions: vi.fn(),
  formatCurrency: (n: number) => (n < 0 ? `-$${Math.abs(n).toFixed(2)}` : `$${n.toFixed(2)}`),
  formatCategory: (c: string) => c.charAt(0) + c.slice(1).toLowerCase(),
}));

import { listTransactions } from "@finpulse/core";

describe("list_transactions handler", () => {
  it("formats each transaction as one line and passes filters through, never surfacing isAnomaly", async () => {
    vi.mocked(listTransactions).mockResolvedValue([
      {
        id: "tx_1",
        date: new Date("2026-02-01"),
        merchant: "Acme Corp",
        amount: -45,
        category: Category.DINING,
        accountName: "Checking",
      },
      {
        id: "tx_2",
        date: new Date("2026-01-28"),
        merchant: "Employer Payroll",
        amount: 2800,
        category: Category.INCOME,
        accountName: "Checking",
      },
    ]);
    const handler = makeListTransactionsHandler({} as never);
    const result = await handler({
      category: "DINING",
      startDate: "2026-01-01",
      endDate: "2026-02-28",
      minAmount: -1000,
      maxAmount: 1000,
      limit: 10,
    });

    expect(listTransactions).toHaveBeenCalledWith(
      {},
      {
        category: "DINING",
        startDate: new Date("2026-01-01"),
        endDate: new Date("2026-02-28"),
        minAmount: -1000,
        maxAmount: 1000,
        limit: 10,
      },
    );
    const text = result.content[0]?.text ?? "";
    expect(text).toContain("Acme Corp");
    expect(text).toContain("-$45.00");
    expect(text).toContain("+$2800.00");
    expect(text).toContain("Dining");
    expect(text).not.toMatch(/isAnomaly/i);
  });

  it("defaults limit to 25 when omitted", async () => {
    vi.mocked(listTransactions).mockResolvedValue([]);
    const handler = makeListTransactionsHandler({} as never);
    await handler({});

    expect(listTransactions).toHaveBeenCalledWith({}, expect.objectContaining({ limit: 25 }));
  });

  it("returns a clear message when no transactions match", async () => {
    vi.mocked(listTransactions).mockResolvedValue([]);
    const handler = makeListTransactionsHandler({} as never);
    const result = await handler({});

    expect(result.content[0]?.text).toBe("No transactions matched those filters.");
  });
});
