import { afterEach, describe, expect, it, vi } from "vitest";
import { AnthropicClient, MockLlmClient, createLlmClient } from "./llm";

describe("MockLlmClient", () => {
  it("returns a deterministic string that echoes the question", async () => {
    const client = new MockLlmClient();
    const result = await client.generateInsight({
      system: "some grounding context",
      question: "Why was last month expensive?",
    });
    expect(result).toContain("Why was last month expensive?");
    expect(result).toContain("ANTHROPIC_API_KEY");
  });

  it("is deterministic across calls with the same input", async () => {
    const client = new MockLlmClient();
    const input = { system: "ctx", question: "How has dining changed?" };
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
