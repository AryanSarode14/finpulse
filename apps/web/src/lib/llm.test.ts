import { afterEach, describe, expect, it, vi } from "vitest";
import { AnthropicClient, MockLlmClient, createLlmClient } from "./llm";

describe("MockLlmClient", () => {
  it("returns the pre-generated insight for a matching demo question", async () => {
    const client = new MockLlmClient();
    const result = await client.generateInsight({
      system: "some grounding context",
      question: "Which month was my most expensive?",
    });
    expect(result).toContain("April 2026");
  });

  it("returns the honest fallback message for a non-demo question", async () => {
    const client = new MockLlmClient();
    const result = await client.generateInsight({
      system: "some grounding context",
      question: "Why was last month expensive?",
    });
    expect(result).toContain("pre-generated");
    expect(result).toContain("ANTHROPIC_API_KEY");
  });

  it("is deterministic across calls with the same input", async () => {
    const client = new MockLlmClient();
    const input = { system: "ctx", question: "How has my dining spending changed?" };
    expect(await client.generateInsight(input)).toBe(await client.generateInsight(input));
  });
});

describe("createLlmClient", () => {
  afterEach(() => {
    vi.unstubAllEnvs();
  });

  it("returns a MockLlmClient when ANTHROPIC_API_KEY is unset", () => {
    vi.stubEnv("ANTHROPIC_API_KEY", "");
    expect(createLlmClient()).toBeInstanceOf(MockLlmClient);
  });

  it("returns an AnthropicClient when ANTHROPIC_API_KEY is set", () => {
    vi.stubEnv("ANTHROPIC_API_KEY", "sk-ant-test-key");
    expect(createLlmClient()).toBeInstanceOf(AnthropicClient);
  });
});
