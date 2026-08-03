import { describe, expect, it } from "vitest";
import { DEMO_FALLBACK_MESSAGE, findDemoInsight } from "./demo-insights";

describe("findDemoInsight", () => {
  it("returns the pre-written insight for an exact demo question", () => {
    const result = findDemoInsight("Which month was my most expensive?");
    expect(result).toContain("April 2026");
    expect(result).toContain("$3,516.12");
  });

  it("matches all four suggested demo questions", () => {
    expect(findDemoInsight("How has my dining spending changed?")).toContain("$331/month");
    expect(findDemoInsight("What are my biggest spending categories?")).toContain("Rent dominates");
    expect(findDemoInsight("Were there any unusual transactions?")).toContain("Nobu");
  });

  it("is tolerant of case, punctuation, and surrounding whitespace", () => {
    const canonical = findDemoInsight("Which month was my most expensive?");
    expect(findDemoInsight("  which month was my most expensive  ")).toBe(canonical);
    expect(findDemoInsight("WHICH MONTH WAS MY MOST EXPENSIVE?")).toBe(canonical);
    expect(findDemoInsight("which month was my most expensive")).toBe(canonical);
  });

  it("returns null for a question that isn't one of the demo questions", () => {
    expect(findDemoInsight("Why was last month expensive?")).toBeNull();
    expect(findDemoInsight("What's the weather today?")).toBeNull();
  });
});

describe("DEMO_FALLBACK_MESSAGE", () => {
  it("makes the demo nature clear and mentions ANTHROPIC_API_KEY", () => {
    expect(DEMO_FALLBACK_MESSAGE).toContain("pre-generated");
    expect(DEMO_FALLBACK_MESSAGE).toContain("ANTHROPIC_API_KEY");
  });
});
