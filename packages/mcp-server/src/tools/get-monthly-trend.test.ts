import { describe, expect, it, vi } from "vitest";
import { makeGetMonthlyTrendHandler } from "./get-monthly-trend";

vi.mock("@finpulse/core", () => ({
  getMonthlySpend: vi.fn(),
  formatCurrency: (n: number) => `$${n.toFixed(2)}`,
}));

import { getMonthlySpend } from "@finpulse/core";

describe("get_monthly_trend handler", () => {
  it("formats each month as spend vs income", async () => {
    vi.mocked(getMonthlySpend).mockResolvedValue([
      { month: "2026-01", spend: 100, income: 3000 },
      { month: "2026-02", spend: 200, income: 3000 },
    ]);
    const handler = makeGetMonthlyTrendHandler({} as never);
    const result = await handler({ months: 2 });

    expect(getMonthlySpend).toHaveBeenCalledWith({}, 2);
    expect(result.content[0]?.text).toContain("2026-01: spend $100.00, income $3000.00");
    expect(result.content[0]?.text).toContain("2026-02: spend $200.00, income $3000.00");
  });

  it("returns a clear message when there is no monthly data", async () => {
    vi.mocked(getMonthlySpend).mockResolvedValue([]);
    const handler = makeGetMonthlyTrendHandler({} as never);
    const result = await handler({});

    expect(result.content[0]?.text).toContain("No monthly data in this period.");
  });
});
