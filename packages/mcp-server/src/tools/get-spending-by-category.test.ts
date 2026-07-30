import { Category } from "@prisma/client";
import { describe, expect, it, vi } from "vitest";
import { makeGetSpendingByCategoryHandler } from "./get-spending-by-category";

vi.mock("@finpulse/core", () => ({
  getSpendByCategory: vi.fn(),
  formatCurrency: (n: number) => `$${n.toFixed(2)}`,
  formatCategory: (c: string) => c.charAt(0) + c.slice(1).toLowerCase(),
}));

import { getSpendByCategory } from "@finpulse/core";

describe("get_spending_by_category handler", () => {
  it("formats each category as a bulleted, currency-formatted line", async () => {
    vi.mocked(getSpendByCategory).mockResolvedValue([
      { category: Category.RENT, total: 2000 },
      { category: Category.DINING, total: 450.5 },
    ]);
    const handler = makeGetSpendingByCategoryHandler({} as never);
    const result = await handler({ months: 3 });

    expect(getSpendByCategory).toHaveBeenCalledWith({}, 3);
    expect(result.content[0]?.text).toContain("Rent: $2000.00");
    expect(result.content[0]?.text).toContain("Dining: $450.50");
    expect(result.content[0]?.text).toContain("last 3 months");
  });

  it("returns a clear message when there is no category spend", async () => {
    vi.mocked(getSpendByCategory).mockResolvedValue([]);
    const handler = makeGetSpendingByCategoryHandler({} as never);
    const result = await handler({});

    expect(getSpendByCategory).toHaveBeenCalledWith({}, 12);
    expect(result.content[0]?.text).toContain("No category spend in this period.");
  });
});
