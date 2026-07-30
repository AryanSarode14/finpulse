import { formatCategory, formatCurrency, getSpendByCategory } from "@finpulse/core";
import type { PrismaClient } from "@prisma/client";
import type { McpServer } from "@modelcontextprotocol/sdk/server/mcp.js";
import { z } from "zod";
import { logToolInvocation } from "../logger.js";

const TOOL_NAME = "get_spending_by_category";
const DEFAULT_MONTHS = 12;

export const getSpendingByCategoryInputSchema = {
  months: z
    .number()
    .int()
    .positive()
    .max(60)
    .optional()
    .describe("Number of months to look back (default 12, max 60)."),
};

export function makeGetSpendingByCategoryHandler(prisma: PrismaClient) {
  return async ({ months }: { months?: number | undefined }) => {
    logToolInvocation(TOOL_NAME, { months });
    const period = months ?? DEFAULT_MONTHS;
    const rows = await getSpendByCategory(prisma, period);
    const lines =
      rows.length > 0
        ? rows.map((row) => `- ${formatCategory(row.category)}: ${formatCurrency(row.total)}`)
        : ["No category spend in this period."];
    const text = [
      `Spend by category (last ${period} month${period === 1 ? "" : "s"}):`,
      ...lines,
    ].join("\n");
    return { content: [{ type: "text" as const, text }] };
  };
}

export function registerGetSpendingByCategory(server: McpServer, prisma: PrismaClient): void {
  server.registerTool(
    TOOL_NAME,
    {
      title: "Get spending by category",
      description:
        "Read-only. Returns a category breakdown of spend over a period (defaults to the last " +
        "12 months), sorted by amount descending.",
      inputSchema: getSpendingByCategoryInputSchema,
    },
    makeGetSpendingByCategoryHandler(prisma),
  );
}
