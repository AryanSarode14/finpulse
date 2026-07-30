import { describe, expect, it } from "vitest";
import { formatCategory, formatCurrency } from "./format";

describe("formatCurrency", () => {
  it("formats a positive amount", () => {
    expect(formatCurrency(1234.5)).toBe("$1,234.50");
  });
  it("formats a negative amount", () => {
    expect(formatCurrency(-42.99)).toBe("-$42.99");
  });
  it("formats zero", () => {
    expect(formatCurrency(0)).toBe("$0.00");
  });
});

describe("formatCategory", () => {
  it("title-cases an uppercase category name", () => {
    expect(formatCategory("GROCERIES")).toBe("Groceries");
  });
});
