# @finpulse/mcp-server

A read-only [Model Context Protocol](https://modelcontextprotocol.io) server
that exposes FinPulse's spending data as tools an AI agent (Claude Desktop,
Claude Code, or any MCP client) can call directly — the same Prisma queries
and anomaly detector that power the web dashboard, reused via
[`@finpulse/core`](../core), not reimplemented.

No tool can write, modify, or delete data. Every tool is a plain read.

## Tools

| Tool                       | Description                                                                                                                                                        | Key inputs                                                                                  |
| -------------------------- | ------------------------------------------------------------------------------------------------------------------------------------------------------------------ | ------------------------------------------------------------------------------------------- |
| `get_spending_summary`     | Total spend, income, net, and transaction count over a period.                                                                                                     | `months` (default 12, max 60)                                                               |
| `get_spending_by_category` | Category breakdown of spend, sorted descending.                                                                                                                    | `months` (default 12, max 60)                                                               |
| `get_monthly_trend`        | Spend vs income per calendar month, oldest to newest.                                                                                                              | `months` (default 12, max 60)                                                               |
| `list_transactions`        | Recent transactions, filterable by category / date range / amount range.                                                                                           | `category`, `startDate`, `endDate`, `minAmount`, `maxAmount`, `limit` (default 25, max 200) |
| `find_anomalies`           | Calls the `services/ml` anomaly detector and returns flagged transactions with reasons. Degrades gracefully with a clear message if the ML service is unreachable. | `method` (`statistical`\|`arima`\|`both`, default `both`), `limit` (default 10, max 50)     |

All amounts and categories are rendered as formatted, human-readable text
(e.g. `$1,234.50`, `Dining`). `list_transactions` never surfaces the
`isAnomaly` ground-truth flag — that only ever comes from `find_anomalies`'
detector output, never from the raw transaction data.

## Prerequisites

- Postgres running: `docker compose up -d` (from the repo root).
- Dependencies installed and `@finpulse/core` built:
  ```sh
  pnpm install
  pnpm --filter @finpulse/core build
  ```
- (Optional, for `find_anomalies`) the ML service running:
  ```sh
  cd services/ml && uv run uvicorn finpulse_ml.main:app --reload
  ```
  If it's not running, `find_anomalies` still responds — with a clear
  "currently unavailable" message instead of an error.

## Environment variables

| Variable         | Required | Default                 | Notes                                                                                                                                     |
| ---------------- | -------- | ----------------------- | ----------------------------------------------------------------------------------------------------------------------------------------- |
| `DATABASE_URL`   | Yes      | —                       | Same Postgres connection string used by the rest of the repo, e.g. `postgresql://finpulse:finpulse@localhost:5433/finpulse?schema=public` |
| `ML_SERVICE_URL` | No       | `http://localhost:8000` | Base URL of the `services/ml` FastAPI service                                                                                             |

No secrets are hardcoded anywhere in this package — both are read from
`process.env` only.

## Run it standalone (for manual testing)

From the repo root, using [`tsx`](https://github.com/privatenumber/tsx) — no
build step required to run it, since `tsx` transpiles the entry point on the
fly and `@finpulse/core` is already plain compiled JS by the time it's
imported:

```sh
DATABASE_URL="postgresql://finpulse:finpulse@localhost:5433/finpulse?schema=public" \
  pnpm --filter @finpulse/mcp-server start
```

The server logs `connected over stdio` to **stderr** and then waits for
JSON-RPC messages on stdin — this is expected; it's not meant to print
anything to your terminal on its own.

### Inspecting it interactively

The [MCP Inspector](https://github.com/modelcontextprotocol/inspector) is the
standard way to poke at a stdio MCP server by hand — it opens a local web UI
where you can list tools, fill in a form, and call them:

```sh
npx @modelcontextprotocol/inspector \
  tsx packages/mcp-server/src/index.ts
```

(Run this from the repo root, with `DATABASE_URL` exported in your shell
first.)

## Connect it to Claude Desktop

Add this to your Claude Desktop config
(`~/Library/Application Support/Claude/claude_desktop_config.json` on macOS,
`%APPDATA%\Claude\claude_desktop_config.json` on Windows). **Claude Desktop
spawns the server with a clean environment — it does not inherit your shell
or read `.env` files — so `DATABASE_URL`/`ML_SERVICE_URL` must be spelled out
explicitly in `env` below, and the path in `args` must be absolute** (replace
`/absolute/path/to/finpulse` with wherever you cloned this repo):

```json
{
  "mcpServers": {
    "finpulse": {
      "command": "npx",
      "args": ["tsx", "/absolute/path/to/finpulse/packages/mcp-server/src/index.ts"],
      "env": {
        "DATABASE_URL": "postgresql://finpulse:finpulse@localhost:5433/finpulse?schema=public",
        "ML_SERVICE_URL": "http://localhost:8000"
      }
    }
  }
}
```

Restart Claude Desktop, then ask it something like _"What did I spend on
dining last month?"_ — it should call `get_spending_by_category` (or
`list_transactions`) on its own and answer from the real numbers.

## Development

```sh
pnpm --filter @finpulse/core build      # @finpulse/core must be built first
pnpm --filter @finpulse/mcp-server typecheck
pnpm --filter @finpulse/mcp-server lint
pnpm --filter @finpulse/mcp-server test   # mocked data layer + detector, no live DB/network
pnpm --filter @finpulse/mcp-server build  # optional: compiles to dist/ for a `node dist/index.js`-style run
```

Each tool lives in `src/tools/<name>.ts` as a pair: `make<Name>Handler(prisma)`
(a plain, independently-testable function) and `register<Name>(server, prisma)`
(wires it into the `McpServer`). `src/tools/index.ts` registers all five.

All logging (`src/logger.ts`) goes to **stderr only** — the stdio transport
uses stdout exclusively for the JSON-RPC protocol, so anything else written
there would corrupt the stream.
