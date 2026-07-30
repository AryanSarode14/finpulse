import { NextRequest } from "next/server";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";

const buildInsightContext = vi.fn();
const buildPrompt = vi.fn();
const generateInsight = vi.fn();

vi.mock("@/lib/insight-context", () => ({
  buildInsightContext,
  buildPrompt,
}));

vi.mock("@/lib/llm", () => ({
  createLlmClient: () => ({ generateInsight }),
}));

function makeRequest(body: unknown, ip = "1.2.3.4"): NextRequest {
  return new NextRequest("http://localhost/api/insights", {
    method: "POST",
    headers: { "content-type": "application/json", "x-forwarded-for": ip },
    body: JSON.stringify(body),
  });
}

describe("POST /api/insights", () => {
  beforeEach(() => {
    buildInsightContext.mockReset().mockResolvedValue({ summary: "fake context" });
    buildPrompt.mockReset().mockReturnValue({ system: "sys", question: "q" });
    generateInsight.mockReset().mockResolvedValue("a mocked insight");
  });

  afterEach(() => {
    vi.resetModules();
  });

  it("returns the insight and contextUsed for a valid question", async () => {
    const { POST } = await import("./route");
    const response = await POST(makeRequest({ question: "Why was last month expensive?" }, "10.0.0.1"));

    expect(response.status).toBe(200);
    const body = await response.json();
    expect(body).toEqual({ insight: "a mocked insight", contextUsed: { summary: "fake context" } });
    expect(buildPrompt).toHaveBeenCalledWith("Why was last month expensive?", { summary: "fake context" });
    expect(generateInsight).toHaveBeenCalledWith({ system: "sys", question: "q" });
  });

  it("rejects an empty question with 400", async () => {
    const { POST } = await import("./route");
    const response = await POST(makeRequest({ question: "" }, "10.0.0.2"));
    expect(response.status).toBe(400);
    expect(generateInsight).not.toHaveBeenCalled();
  });

  it("rejects a question over the length cap with 400", async () => {
    const { POST } = await import("./route");
    const response = await POST(makeRequest({ question: "a".repeat(501) }, "10.0.0.3"));
    expect(response.status).toBe(400);
  });

  it("rejects a malformed body with 400", async () => {
    const { POST } = await import("./route");
    const response = await POST(makeRequest({ notQuestion: "hi" }, "10.0.0.4"));
    expect(response.status).toBe(400);
  });

  it("rate-limits an IP after too many requests in the window", async () => {
    const { POST } = await import("./route");
    const ip = "10.0.0.5";
    for (let i = 0; i < 10; i++) {
      const response = await POST(makeRequest({ question: "How's my spending?" }, ip));
      expect(response.status).toBe(200);
    }
    const limited = await POST(makeRequest({ question: "One more?" }, ip));
    expect(limited.status).toBe(429);
  });
});
