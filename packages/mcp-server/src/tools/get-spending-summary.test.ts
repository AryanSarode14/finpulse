import { describe, expect, it, vi } from "vitest";
import { makeGetSpendingSummaryHandler } from "./get-spending-summary";

vi.mock("@finpulse/core", () => ({
  getSummaryStats: vi.fn(),
  formatCurrency: (n: number) => `$${n.toFixed(2)}`,
}));

import { getSummaryStats } from "@finpulse/core";

describe("get_spending_summary handler", () => {
  it("formats the summary stats as readable text", async () => {
    vi.mocked(getSummaryStats).mockResolvedValue({
      totalSpend: 100,
      totalIncome: 200,
      net: 100,
      transactionCount: 5,
    });
    const handler = makeGetSpendingSummaryHandler({} as never);
    const result = await handler({ months: 6 });

    expect(getSummaryStats).toHaveBeenCalledWith({}, 6);
    expect(result.content[0]?.text).toContain("$100.00");
    expect(result.content[0]?.text).toContain("$200.00");
    expect(result.content[0]?.text).toContain("last 6 months");
    expect(result.content[0]?.text).toContain("Transactions: 5");
  });

  it("defaults to 12 months when omitted", async () => {
    vi.mocked(getSummaryStats).mockResolvedValue({
      totalSpend: 0,
      totalIncome: 0,
      net: 0,
      transactionCount: 0,
    });
    const handler = makeGetSpendingSummaryHandler({} as never);
    const result = await handler({});

    expect(getSummaryStats).toHaveBeenCalledWith({}, 12);
    expect(result.content[0]?.text).toContain("last 12 months");
  });

  it("uses singular phrasing for a 1-month period", async () => {
    vi.mocked(getSummaryStats).mockResolvedValue({
      totalSpend: 0,
      totalIncome: 0,
      net: 0,
      transactionCount: 0,
    });
    const handler = makeGetSpendingSummaryHandler({} as never);
    const result = await handler({ months: 1 });

    expect(result.content[0]?.text).toContain("last 1 month):");
  });
});
