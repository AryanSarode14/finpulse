import {
  detectAnomalies,
  formatCurrency,
  listTransactions,
  type DetectMethod,
} from "@finpulse/core";
import type { PrismaClient } from "@prisma/client";
import type { McpServer } from "@modelcontextprotocol/sdk/server/mcp.js";
import { z } from "zod";
import { logToolInvocation } from "../logger.js";

const TOOL_NAME = "find_anomalies";
const DEFAULT_LIMIT = 10;
// Comfortably above the synthetic seed size -- large enough that every
// flagged transaction_id resolves to a real merchant/date for display.
const ANOMALY_LOOKUP_POOL_SIZE = 1000;

export const findAnomaliesInputSchema = {
  method: z
    .enum(["statistical", "arima", "both"])
    .optional()
    .describe("Detection method to use (default both)."),
  limit: z
    .number()
    .int()
    .positive()
    .max(50)
    .optional()
    .describe("Max anomalies to return (default 10)."),
};

type FindAnomaliesInput = {
  method?: DetectMethod | undefined;
  limit?: number | undefined;
};

export function makeFindAnomaliesHandler(prisma: PrismaClient) {
  return async ({ method, limit }: FindAnomaliesInput) => {
    logToolInvocation(TOOL_NAME, { method, limit });
    const mlServiceUrl = process.env.ML_SERVICE_URL ?? "http://localhost:8000";
    const pool = await listTransactions(prisma, { limit: ANOMALY_LOOKUP_POOL_SIZE });
    const result = await detectAnomalies(mlServiceUrl, pool, method ?? "both");

    if (!result.available) {
      return {
        content: [
          {
            type: "text" as const,
            text:
              "Anomaly detection is currently unavailable: could not reach the ML service " +
              `at ${mlServiceUrl}. Try again once services/ml is running.`,
          },
        ],
      };
    }

    const top = result.anomalies.slice(0, limit ?? DEFAULT_LIMIT);
    if (top.length === 0) {
      return {
        content: [
          {
            type: "text" as const,
            text: `No anomalies detected across ${result.transactionsScanned} scanned transactions.`,
          },
        ],
      };
    }

    const lines = top.map(
      (a) =>
        `- ${a.date ?? "unknown date"} ${a.merchant ?? a.transactionId} ` +
        `${a.amount !== null ? formatCurrency(a.amount) : ""} — ${a.reason} (score ${a.score.toFixed(2)}, ${a.method})`,
    );
    const text = [
      `Found ${top.length} anomal${top.length === 1 ? "y" : "ies"} ` +
        `(of ${result.anomalies.length} flagged across ${result.transactionsScanned} scanned transactions):`,
      ...lines,
    ].join("\n");
    return { content: [{ type: "text" as const, text }] };
  };
}

export function registerFindAnomalies(server: McpServer, prisma: PrismaClient): void {
  server.registerTool(
    TOOL_NAME,
    {
      title: "Find anomalies",
      description:
        "Read-only. Calls the FinPulse ML anomaly-detection service and returns flagged " +
        "transactions with reasons. Degrades gracefully with a clear message if the ML " +
        "service is unreachable.",
      inputSchema: findAnomaliesInputSchema,
    },
    makeFindAnomaliesHandler(prisma),
  );
}
