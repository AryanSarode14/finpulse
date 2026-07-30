import { Category } from "@prisma/client";
import { describe, expect, it } from "vitest";
import {
  aggregateMonthlySpend,
  aggregateSpendByCategory,
  aggregateSummaryStats,
  monthsAgo,
  twelveMonthsAgo,
} from "./queries";

describe("aggregateSpendByCategory", () => {
  it("sums absolute spend per category, sorted descending", () => {
    const result = aggregateSpendByCategory([
      { category: Category.DINING, amount: -20 },
      { category: Category.GROCERIES, amount: -100 },
      { category: Category.DINING, amount: -30 },
    ]);
    expect(result).toEqual([
      { category: Category.GROCERIES, total: 100 },
      { category: Category.DINING, total: 50 },
    ]);
  });

  it("returns an empty array for no transactions", () => {
    expect(aggregateSpendByCategory([])).toEqual([]);
  });
});

describe("aggregateMonthlySpend", () => {
  it("buckets spend and income by calendar month, sorted ascending", () => {
    const result = aggregateMonthlySpend([
      { date: new Date("2026-02-05"), amount: -50 },
      { date: new Date("2026-02-15"), amount: 2800 },
      { date: new Date("2026-01-10"), amount: -20 },
    ]);
    expect(result).toEqual([
      { month: "2026-01", spend: 20, income: 0 },
      { month: "2026-02", spend: 50, income: 2800 },
    ]);
  });
});

describe("aggregateSummaryStats", () => {
  it("computes totals, net, and count", () => {
    const result = aggregateSummaryStats([{ amount: -50 }, { amount: 2800 }, { amount: -1850 }]);
    expect(result).toEqual({
      totalSpend: 1900,
      totalIncome: 2800,
      net: 900,
      transactionCount: 3,
    });
  });

  it("handles an empty list", () => {
    expect(aggregateSummaryStats([])).toEqual({
      totalSpend: 0,
      totalIncome: 0,
      net: 0,
      transactionCount: 0,
    });
  });
});

describe("twelveMonthsAgo", () => {
  it("subtracts 12 months from the given date", () => {
    expect(twelveMonthsAgo(new Date("2026-07-27"))).toEqual(new Date("2025-07-27"));
  });
});

describe("monthsAgo", () => {
  it("subtracts an arbitrary number of months from the given date", () => {
    expect(monthsAgo(3, new Date("2026-07-27"))).toEqual(new Date("2026-04-27"));
  });

  it("matches twelveMonthsAgo when called with 12", () => {
    const now = new Date("2026-07-27");
    expect(monthsAgo(12, now)).toEqual(twelveMonthsAgo(now));
  });
});
