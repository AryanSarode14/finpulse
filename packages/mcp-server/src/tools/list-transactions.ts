import {
  formatCategory,
  formatCurrency,
  listTransactions,
  type RecentTransaction,
} from "@finpulse/core";
import type { PrismaClient } from "@prisma/client";
import type { McpServer } from "@modelcontextprotocol/sdk/server/mcp.js";
import { z } from "zod";
import { logToolInvocation } from "../logger.js";

const TOOL_NAME = "list_transactions";
const DEFAULT_LIMIT = 25;
const DATE_REGEX = /^\d{4}-\d{2}-\d{2}$/;

const CATEGORY_VALUES = [
  "GROCERIES",
  "DINING",
  "RENT",
  "SUBSCRIPTIONS",
  "TRANSPORT",
  "UTILITIES",
  "ENTERTAINMENT",
  "INCOME",
  "OTHER",
] as const;

export const listTransactionsInputSchema = {
  category: z.enum(CATEGORY_VALUES).optional().describe("Filter by category."),
  startDate: z
    .string()
    .regex(DATE_REGEX, "Expected YYYY-MM-DD")
    .optional()
    .describe("Inclusive lower bound date (YYYY-MM-DD)."),
  endDate: z
    .string()
    .regex(DATE_REGEX, "Expected YYYY-MM-DD")
    .optional()
    .describe("Inclusive upper bound date (YYYY-MM-DD)."),
  minAmount: z
    .number()
    .optional()
    .describe("Minimum signed amount (negative = spend, positive = income)."),
  maxAmount: z.number().optional().describe("Maximum signed amount."),
  limit: z
    .number()
    .int()
    .positive()
    .max(200)
    .optional()
    .describe("Max results (default 25, max 200)."),
};

type ListTransactionsInput = {
  category?: (typeof CATEGORY_VALUES)[number] | undefined;
  startDate?: string | undefined;
  endDate?: string | undefined;
  minAmount?: number | undefined;
  maxAmount?: number | undefined;
  limit?: number | undefined;
};

function formatTransactionLine(tx: RecentTransaction): string {
  const dateStr = tx.date.toISOString().slice(0, 10);
  const signed = tx.amount >= 0 ? `+${formatCurrency(tx.amount)}` : formatCurrency(tx.amount);
  return `- ${dateStr}  ${tx.merchant}  ${signed}  ${formatCategory(tx.category)}  (${tx.accountName})`;
}

export function makeListTransactionsHandler(prisma: PrismaClient) {
  return async ({
    category,
    startDate,
    endDate,
    minAmount,
    maxAmount,
    limit,
  }: ListTransactionsInput) => {
    logToolInvocation(TOOL_NAME, { category, startDate, endDate, minAmount, maxAmount, limit });
    const transactions = await listTransactions(prisma, {
      category,
      startDate: startDate ? new Date(startDate) : undefined,
      endDate: endDate ? new Date(endDate) : undefined,
      minAmount,
      maxAmount,
      limit: limit ?? DEFAULT_LIMIT,
    });
    const text =
      transactions.length > 0
        ? [
            `Transactions (${transactions.length} found):`,
            ...transactions.map(formatTransactionLine),
          ].join("\n")
        : "No transactions matched those filters.";
    return { content: [{ type: "text" as const, text }] };
  };
}

export function registerListTransactions(server: McpServer, prisma: PrismaClient): void {
  server.registerTool(
    TOOL_NAME,
    {
      title: "List transactions",
      description:
        "Read-only. Lists recent transactions, optionally filtered by category, date range, or " +
        "amount range (default: most recent 25, max 200).",
      inputSchema: listTransactionsInputSchema,
    },
    makeListTransactionsHandler(prisma),
  );
}
