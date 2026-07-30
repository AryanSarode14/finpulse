import { formatCurrency, getSummaryStats } from "@finpulse/core";
import type { PrismaClient } from "@prisma/client";
import type { McpServer } from "@modelcontextprotocol/sdk/server/mcp.js";
import { z } from "zod";
import { logToolInvocation } from "../logger.js";

const TOOL_NAME = "get_spending_summary";
const DEFAULT_MONTHS = 12;

export const getSpendingSummaryInputSchema = {
  months: z
    .number()
    .int()
    .positive()
    .max(60)
    .optional()
    .describe("Number of months to look back (default 12, max 60)."),
};

export function makeGetSpendingSummaryHandler(prisma: PrismaClient) {
  return async ({ months }: { months?: number | undefined }) => {
    logToolInvocation(TOOL_NAME, { months });
    const period = months ?? DEFAULT_MONTHS;
    const stats = await getSummaryStats(prisma, period);
    const text = [
      `Spending summary (last ${period} month${period === 1 ? "" : "s"}):`,
      `- Total spend: ${formatCurrency(stats.totalSpend)}`,
      `- Total income: ${formatCurrency(stats.totalIncome)}`,
      `- Net: ${formatCurrency(stats.net)}`,
      `- Transactions: ${stats.transactionCount}`,
    ].join("\n");
    return { content: [{ type: "text" as const, text }] };
  };
}

export function registerGetSpendingSummary(server: McpServer, prisma: PrismaClient): void {
  server.registerTool(
    TOOL_NAME,
    {
      title: "Get spending summary",
      description:
        "Read-only. Returns total spend, income, net, and transaction count over a period " +
        "(defaults to the last 12 months).",
      inputSchema: getSpendingSummaryInputSchema,
    },
    makeGetSpendingSummaryHandler(prisma),
  );
}
