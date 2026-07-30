#!/usr/bin/env node
import { PrismaClient } from "@prisma/client";
import { McpServer } from "@modelcontextprotocol/sdk/server/mcp.js";
import { StdioServerTransport } from "@modelcontextprotocol/sdk/server/stdio.js";
import { registerTools } from "./tools/index.js";

const prisma = new PrismaClient();

const server = new McpServer({ name: "finpulse-mcp-server", version: "0.1.0" });

registerTools(server, prisma);

async function shutdown(): Promise<void> {
  await prisma.$disconnect();
  process.exit(0);
}

process.on("SIGINT", () => void shutdown());
process.on("SIGTERM", () => void shutdown());

async function main(): Promise<void> {
  const transport = new StdioServerTransport();
  await server.connect(transport);
  console.error("[finpulse-mcp-server] connected over stdio");
}

main().catch((error: unknown) => {
  console.error("[finpulse-mcp-server] fatal error", error);
  process.exit(1);
});
