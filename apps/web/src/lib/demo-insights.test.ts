import { describe, expect, it } from "vitest";
import { DEMO_FALLBACK_MESSAGE, findDemoInsight } from "./demo-insights";

describe("findDemoInsight", () => {
  it("returns the pre-written insight for an exact demo question", () => {
    const result = findDemoInsight("Which month was my most expensive?");
    expect(result).toContain("April 2026");
    expect(result).toContain("$3,516.12");
  });

  it("matches all four original suggested demo questions", () => {
    expect(findDemoInsight("How has my dining spending changed?")).toContain("$331/month");
    expect(findDemoInsight("What are my biggest spending categories?")).toContain("Rent dominates");
    expect(findDemoInsight("Were there any unusual transactions?")).toContain("Nobu");
  });

  it("matches alias phrasings of the original four questions", () => {
    const canonical = findDemoInsight("Which month was my most expensive?");
    expect(findDemoInsight("What was my most expensive month?")).toBe(canonical);
    expect(findDemoInsight("What do I spend the most on?")).toBe(
      findDemoInsight("What are my biggest spending categories?"),
    );
    expect(findDemoInsight("Any unusual transactions?")).toBe(
      findDemoInsight("Were there any unusual transactions?"),
    );
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

  describe("grounded finance questions", () => {
    it("answers a subscriptions question with real figures", () => {
      const result = findDemoInsight("How much do I spend on subscriptions?");
      expect(result).toContain("Netflix");
      expect(result).toContain("Spotify");
      expect(result).toContain("$351.75");
      expect(result).toContain("$33,084.56");
    });

    it("answers an average monthly spending question with real figures", () => {
      const result = findDemoInsight("What's my average monthly spending?");
      expect(result).toContain("$2,757.05");
      expect(result).toContain("$33,084.56");
    });

    it("answers a groceries question with real figures", () => {
      const result = findDemoInsight("How much do I spend on groceries?");
      expect(result).toContain("$4,548.06");
      expect(result).toContain("Trader Joe's");
    });

    it("answers a recurring bills question with real figures", () => {
      const result = findDemoInsight("What are my recurring bills?");
      expect(result).toContain("$1,850");
      expect(result).toContain("$20,350");
      expect(result).toContain("Netflix");
      expect(result).toContain("Spotify");
    });

    it("answers a dining out question with real figures, consistent with the dining trend insight", () => {
      const result = findDemoInsight("How much did I spend on dining out?");
      expect(result).toContain("$3,976.38");
      expect(result).toContain("150 transactions");
      // Same trailing-12-month total the existing dining-trend insight cites ($3,976).
      expect(findDemoInsight("How has my dining spending changed?")).toContain("$3,976 total");
    });

    it("answers a biggest single expense question with real figures", () => {
      const result = findDemoInsight("What's my biggest single expense?");
      expect(result).toContain("Ticketmaster");
      expect(result).toContain("$650");
      expect(result).toContain("$380");
    });

    it("keeps the recurring-bills rent total consistent with the biggest-spending-categories insight", () => {
      const recurring = findDemoInsight("What are my recurring bills?");
      const categories = findDemoInsight("What are my biggest spending categories?");
      expect(recurring).toContain("$20,350");
      expect(categories).toContain("$20,350");
    });

    it("matches alias phrasings of the new finance questions", () => {
      expect(findDemoInsight("What do I spend on subscriptions?")).toBe(
        findDemoInsight("How much do I spend on subscriptions?"),
      );
      expect(findDemoInsight("What is my average monthly spending?")).toBe(
        findDemoInsight("What's my average monthly spending?"),
      );
      expect(findDemoInsight("What recurring bills do I have?")).toBe(
        findDemoInsight("What are my recurring bills?"),
      );
    });
  });

  describe("greetings and meta questions", () => {
    it("responds to greetings with a warm, orienting message", () => {
      for (const greeting of ["hi", "hello", "hey", "Hi there!", "HEY", "  hello  "]) {
        const result = findDemoInsight(greeting);
        expect(result).toContain("spending");
      }
    });

    it("responds to help/meta questions with example questions", () => {
      for (const meta of ["what can you do?", "help", "What can I ask?"]) {
        const result = findDemoInsight(meta);
        expect(result).toContain("What are my biggest spending categories?");
      }
    });

    it("responds to thanks with a brief acknowledgment", () => {
      for (const thanks of ["thanks", "Thank you!", "thanks!"]) {
        const result = findDemoInsight(thanks);
        expect(result).toContain("welcome");
      }
    });

    it("does not confuse a greeting with an unmatched question", () => {
      expect(findDemoInsight("hi")).not.toBeNull();
      expect(findDemoInsight("hi, what's the weather like")).toBeNull();
    });
  });
});

describe("DEMO_FALLBACK_MESSAGE", () => {
  it("makes the demo nature clear and mentions ANTHROPIC_API_KEY", () => {
    expect(DEMO_FALLBACK_MESSAGE).toContain("pre-generated");
    expect(DEMO_FALLBACK_MESSAGE).toContain("ANTHROPIC_API_KEY");
  });
});
