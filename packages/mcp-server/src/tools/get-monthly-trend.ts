import { formatCurrency, getMonthlySpend } from "@finpulse/core";
import type { PrismaClient } from "@prisma/client";
import type { McpServer } from "@modelcontextprotocol/sdk/server/mcp.js";
import { z } from "zod";
import { logToolInvocation } from "../logger.js";

const TOOL_NAME = "get_monthly_trend";
const DEFAULT_MONTHS = 12;

export const getMonthlyTrendInputSchema = {
  months: z
    .number()
    .int()
    .positive()
    .max(60)
    .optional()
    .describe("Number of months to look back (default 12, max 60)."),
};

export function makeGetMonthlyTrendHandler(prisma: PrismaClient) {
  return async ({ months }: { months?: number | undefined }) => {
    logToolInvocation(TOOL_NAME, { months });
    const period = months ?? DEFAULT_MONTHS;
    const rows = await getMonthlySpend(prisma, period);
    const lines =
      rows.length > 0
        ? rows.map(
            (row) =>
              `- ${row.month}: spend ${formatCurrency(row.spend)}, income ${formatCurrency(row.income)}`,
          )
        : ["No monthly data in this period."];
    const text = [
      `Monthly spend vs income (last ${period} month${period === 1 ? "" : "s"}):`,
      ...lines,
    ].join("\n");
    return { content: [{ type: "text" as const, text }] };
  };
}

export function registerGetMonthlyTrend(server: McpServer, prisma: PrismaClient): void {
  server.registerTool(
    TOOL_NAME,
    {
      title: "Get monthly spend trend",
      description:
        "Read-only. Returns spend vs income per calendar month over a period (defaults to the " +
        "last 12 months), oldest to newest.",
      inputSchema: getMonthlyTrendInputSchema,
    },
    makeGetMonthlyTrendHandler(prisma),
  );
}
