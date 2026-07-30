import type { PrismaClient } from "@prisma/client";
import type { McpServer } from "@modelcontextprotocol/sdk/server/mcp.js";
import { registerFindAnomalies } from "./find-anomalies.js";
import { registerGetMonthlyTrend } from "./get-monthly-trend.js";
import { registerGetSpendingByCategory } from "./get-spending-by-category.js";
import { registerGetSpendingSummary } from "./get-spending-summary.js";
import { registerListTransactions } from "./list-transactions.js";

export function registerTools(server: McpServer, prisma: PrismaClient): void {
  registerGetSpendingSummary(server, prisma);
  registerGetSpendingByCategory(server, prisma);
  registerGetMonthlyTrend(server, prisma);
  registerListTransactions(server, prisma);
  registerFindAnomalies(server, prisma);
}
