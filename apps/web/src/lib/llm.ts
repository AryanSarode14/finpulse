import Anthropic from "@anthropic-ai/sdk";
import { DEMO_FALLBACK_MESSAGE, findDemoInsight } from "./demo-insights";

export type GenerateInsightInput = {
  system: string;
  question: string;
};

export interface LlmClient {
  generateInsight(input: GenerateInsightInput): Promise<string>;
}

const DEFAULT_MODEL = "claude-haiku-4-5";
const MAX_TOKENS = 1024;

export class MockLlmClient implements LlmClient {
  async generateInsight({ question }: GenerateInsightInput): Promise<string> {
    return findDemoInsight(question) ?? DEMO_FALLBACK_MESSAGE;
  }
}

export class AnthropicClient implements LlmClient {
  private readonly client: Anthropic;
  private readonly model: string;

  constructor(apiKey: string, model: string = DEFAULT_MODEL) {
    this.client = new Anthropic({ apiKey });
    this.model = model;
  }

  async generateInsight({ system, question }: GenerateInsightInput): Promise<string> {
    try {
      const response = await this.client.messages.create({
        model: this.model,
        max_tokens: MAX_TOKENS,
        system,
        messages: [{ role: "user", content: question }],
      });
      const textBlock = response.content.find((block) => block.type === "text");
      return textBlock?.type === "text" ? textBlock.text : "";
    } catch (error) {
      if (error instanceof Anthropic.APIError) {
        console.error(`[llm] Anthropic API error: ${error.message}`);
        return "Insights temporarily unavailable — the Anthropic API returned an error.";
      }
      throw error;
    }
  }
}

export function createLlmClient(): LlmClient {
  const apiKey = process.env.ANTHROPIC_API_KEY;
  if (!apiKey) {
    console.log("[llm] ANTHROPIC_API_KEY not set — using MockLlmClient");
    return new MockLlmClient();
  }
  const model = process.env.ANTHROPIC_MODEL ?? DEFAULT_MODEL;
  console.log(`[llm] Using AnthropicClient (model=${model})`);
  return new AnthropicClient(apiKey, model);
}
