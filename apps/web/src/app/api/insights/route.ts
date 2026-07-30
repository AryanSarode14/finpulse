import { NextRequest, NextResponse } from "next/server";
import { z } from "zod";
import { buildInsightContext, buildPrompt } from "@/lib/insight-context";
import { createLlmClient } from "@/lib/llm";

const requestSchema = z.object({
  question: z.string().min(1).max(500),
});

// Guardrails for a future public demo: a simple in-memory, per-IP rate limit
// caps how often anyone can trigger an Anthropic API call, so a public
// deployment can't run up API cost. This is intentionally not
// production-grade — it resets on restart/redeploy and only works for a
// single server instance, which is fine for this portfolio demo.
const RATE_LIMIT_WINDOW_MS = 60_000;
const RATE_LIMIT_MAX_REQUESTS = 10;
const requestTimestampsByIp = new Map<string, number[]>();

function isRateLimited(ip: string): boolean {
  const now = Date.now();
  const recent = (requestTimestampsByIp.get(ip) ?? []).filter(
    (timestamp) => now - timestamp < RATE_LIMIT_WINDOW_MS,
  );
  recent.push(now);
  requestTimestampsByIp.set(ip, recent);
  return recent.length > RATE_LIMIT_MAX_REQUESTS;
}

export async function POST(request: NextRequest) {
  const ip = request.headers.get("x-forwarded-for") ?? "unknown";
  if (isRateLimited(ip)) {
    return NextResponse.json(
      { error: "Too many requests. Please try again in a minute." },
      { status: 429 },
    );
  }

  const body = await request.json().catch(() => null);
  const parsed = requestSchema.safeParse(body);
  if (!parsed.success) {
    return NextResponse.json({ error: "Invalid request: expected a non-empty question." }, { status: 400 });
  }

  const context = await buildInsightContext();
  const prompt = buildPrompt(parsed.data.question, context);
  const llm = createLlmClient();
  const insight = await llm.generateInsight(prompt);

  return NextResponse.json({ insight, contextUsed: context });
}
