# FinPulse

**A full-stack spending-insights platform — from raw transactions to grounded natural-language answers, queryable by AI agents.**

![TypeScript](https://img.shields.io/badge/TypeScript-5.7-3178C6?logo=typescript&logoColor=white)
![Next.js](https://img.shields.io/badge/Next.js-15-000000?logo=nextdotjs&logoColor=white)
![React](https://img.shields.io/badge/React-19-61DAFB?logo=react&logoColor=black)
![Prisma](https://img.shields.io/badge/Prisma-6-2D3748?logo=prisma&logoColor=white)
![PostgreSQL](https://img.shields.io/badge/PostgreSQL-16-4169E1?logo=postgresql&logoColor=white)
![Python](https://img.shields.io/badge/Python-3.12-3776AB?logo=python&logoColor=white)
![FastAPI](https://img.shields.io/badge/FastAPI-0.115-009688?logo=fastapi&logoColor=white)
![pnpm](https://img.shields.io/badge/pnpm-workspaces-F69220?logo=pnpm&logoColor=white)
![Vercel](https://img.shields.io/badge/Deployed%20on-Vercel-000000?logo=vercel&logoColor=white)
![Claude](https://img.shields.io/badge/Claude-Haiku%204.5-D97757)
![MCP](https://img.shields.io/badge/Model%20Context%20Protocol-5%20tools-4B5563)

## What it is

FinPulse ingests bank-style transactions, categorizes them, detects anomalies with two independently-implemented detection strategies, generates grounded natural-language insights, and exposes all of it to AI agents through a read-only MCP server — all on a deterministic, synthetic dataset (no real financial data, ever).

**Live demo:** **[finpulse-web-pi.vercel.app](https://finpulse-web-pi.vercel.app)**

The dashboard and AI insights panel are live. In the public deployment, insights run on **pre-generated, grounded responses** for the four suggested questions (no `ANTHROPIC_API_KEY` is configured there, by design — see [Notable engineering decisions](#notable-engineering-decisions)). Clone the repo and set `ANTHROPIC_API_KEY` to get live Claude-generated answers to _any_ question, grounded on the same real data.

## Demo

![Claude Desktop autonomously calling FinPulse's MCP tools to query spending and surface anomalies](docs/mcp-demo.gif)

![Dashboard](docs/dashboard.png)

![Insights panel](docs/insights.png)

## Features

- **Dashboard** — summary stats (spend / income / net / count), spend-by-category breakdown, a 12-month spend-vs-income trend chart, and a recent-transactions table. Server-rendered with Next.js App Router, charts via Recharts.
- **Anomaly detection, two ways** — a Python/FastAPI service runs a `StatisticalDetector` (robust per-category median/MAD outlier scoring + exact-duplicate-charge detection) and an `ArimaDetector` (daily-aggregate spend forecasting via `statsmodels`, flagging large residuals), both implementing a shared `Detector` strategy interface. A test suite empirically compares them against 5 planted anomalies in the seed data — see the [comparison table](#anomaly-detection-comparison) below.
- **Grounded natural-language insights** — ask a question, and the app assembles real aggregate figures from Postgres (plus live anomaly results) into a prompt, instructs Claude to answer _only_ from those figures, and returns the answer alongside the exact numbers it was grounded on. No key configured → falls back to pre-generated grounded answers for the suggested questions, with an honest fallback message for anything else (never a fabricated "AI is thinking" experience).
- **MCP server** — a standalone, read-only [Model Context Protocol](https://modelcontextprotocol.io) server (`@finpulse/mcp-server`) exposing 5 tools (`get_spending_summary`, `get_spending_by_category`, `get_monthly_trend`, `list_transactions`, `find_anomalies`) that any MCP client — Claude Desktop, Claude Code — can call directly against the same database and detector logic the dashboard uses.

## Architecture

```mermaid
flowchart LR
    Browser["Browser"]
    Agent["AI Agent<br/>(Claude Desktop / Claude Code)"]

    subgraph Web["apps/web — Next.js 15"]
        Dashboard["Dashboard pages"]
        InsightsAPI["/api/insights route"]
    end

    subgraph MCPServer["packages/mcp-server"]
        Tools["5 read-only MCP tools<br/>(stdio / JSON-RPC)"]
    end

    Core["@finpulse/core<br/>shared queries · anomaly client · formatters"]

    subgraph ML["services/ml — FastAPI"]
        Detect["POST /detect<br/>Statistical + ARIMA detectors"]
    end

    DB[("Postgres<br/>Account / Transaction")]
    Claude["Claude API<br/>(claude-haiku-4-5)"]

    Browser --> Dashboard
    Browser --> InsightsAPI
    Agent -->|stdio, JSON-RPC| Tools

    Dashboard --> Core
    InsightsAPI --> Core
    InsightsAPI -.->|only if ANTHROPIC_API_KEY set| Claude
    Tools --> Core

    Core -->|Prisma| DB
    Core -->|HTTP POST| Detect
    Detect -->|psycopg, read-only| DB
```

**`apps/web`** is the Next.js 15 App Router BFF — server-rendered dashboard pages plus the `/api/insights` route handler. It never talks to Postgres or the ML service directly; it goes through `@finpulse/core`.

**`packages/core`** (`@finpulse/core`) is the shared, framework-agnostic data layer: Prisma-backed query functions, the ML-service HTTP client (with graceful degradation baked in), and currency/category formatters. It's dependency-injected on a `PrismaClient` instance rather than owning a singleton, so both `apps/web` (which needs Next's hot-reload-safe client) and `packages/mcp-server` (a long-lived stdio process with its own plain client) can use it identically. This exists specifically so the web dashboard and the MCP server never implement the same Prisma query twice.

**`services/ml`** is an independent Python/FastAPI microservice — not part of the pnpm workspace — that owns categorization and anomaly detection. It connects to the _same_ Postgres database directly via `psycopg` (read-only), so it has no dependency on the TypeScript side at all.

**`packages/mcp-server`** is a separate, read-only surface onto the same data: it imports `@finpulse/core` for queries and the anomaly client, adds MCP tool schemas and text formatting on top, and speaks JSON-RPC over stdio to whatever agent spawns it.

**`prisma/`** at the repo root is the single source of truth for the schema and migrations, shared by the Next.js app (via Prisma Client) and the FastAPI service (via a raw `psycopg` connection reading the same tables).

It's a pnpm workspace monorepo (`apps/*`, `packages/*`, `services/*`) — `services/ml` is deliberately outside the pnpm graph since it's a different language runtime, connected only via the database and the `/detect` HTTP contract.

## Tech stack

**Frontend** — Next.js 15.5.22 (App Router), React 19.2, TypeScript 5.7 (strict mode, `noUncheckedIndexedAccess` + `exactOptionalPropertyTypes` on), Tailwind CSS 4.3, Recharts 2.15.

**Backend / API** — Next.js Route Handlers, Zod 4.4 for request validation, `@anthropic-ai/sdk` 0.115 for live insight generation, `@modelcontextprotocol/sdk` 1.30 for the MCP server.

**ML service** — Python 3.12, FastAPI ≥0.115, Pydantic ≥2.9, `statsmodels` ≥0.14.6 (ARIMA), NumPy/pandas, `psycopg[binary]` 3 for the direct Postgres connection. Managed with [uv](https://docs.astral.sh/uv/).

**Data** — PostgreSQL 16 (`postgres:16-alpine` via Docker Compose locally; Neon Postgres in production), Prisma ORM 6.1 as the schema/migration source of truth. `Transaction.amount` is `Decimal(12,2)` end to end — never a float.

**Tooling / CI** — pnpm workspaces, Node ≥22, Vitest 4.1, ESLint + Prettier, GitHub Actions (two jobs — see [Testing & CI](#testing--ci)), deployed on Vercel.

**AI** — Claude (`claude-haiku-4-5` by default, configurable via `ANTHROPIC_MODEL`) for live insight generation; the Model Context Protocol for agent-facing tool access.

## Notable engineering decisions

- **A shared `@finpulse/core` package, not two copies of the same queries.** The MCP server needs exactly the same aggregate queries and anomaly-detection client the dashboard uses. Rather than reimplementing them, both consume one package. Prisma-backed functions take a `PrismaClient` as their first argument (dependency injection) instead of the package owning a singleton — `apps/web` keeps its Next-specific hot-reload-safe client, `packages/mcp-server` constructs a plain one at startup, and every function is trivially testable with a fake client.

- **Money is `Decimal`, never `float`.** `Transaction.amount` is `Decimal(12,2)` in Postgres and stays a Prisma `Decimal` until explicitly converted with `.toNumber()` at the query boundary — avoiding floating-point drift on aggregated sums across hundreds of transactions.

- **A real Strategy pattern for anomaly detection, not a single hardcoded heuristic.** Both detectors implement one `Detector` interface (`detect(transactions) -> list[AnomalyResult]`), explicitly forbidden from reading the `is_anomaly` ground-truth field — they must decide from observable transaction fields only. That's what makes an honest before/after comparison possible instead of a single unfalsifiable claim.

- **The statistical-vs-ARIMA comparison is real and unflattering to ARIMA on purpose.** `StatisticalDetector` scores each transaction against a robust per-category median/MAD baseline plus an exact-duplicate-charge rule; `ArimaDetector` only ever sees a _daily aggregate_ spend total. The result — statistical 1.00/1.00 precision/recall, ARIMA 0.60/0.38 with 5 false positives — isn't a bug, it's the point: a duplicated $16 subscription or a duplicated $90 charge is invisible to anything that only looks at daily totals, while a few ordinary multi-purchase days spike the daily aggregate enough to look anomalous. Per-transaction, category-aware scoring structurally wins here; per-day aggregate forecasting doesn't. See the [full comparison](#anomaly-detection-comparison).

- **Insights are grounded, not free-generated.** The context builder assembles real aggregate figures (summary stats, category breakdown, month-over-month change, live anomaly results) into the system prompt and instructs Claude to answer _only_ from those figures — the API response includes the exact `contextUsed` data the model was grounded on, so the grounding is auditable, not just claimed. If the ML service is unreachable, the anomaly section says so explicitly instead of fabricating data — the same "degrade honestly, never invent" principle extends to the keyless demo path, which serves real pre-written analysis for the suggested questions and an honest "this is a demo" message for anything else, rather than a generic mock string.

- **MCP tools are read-only as a safety boundary, not an implementation accident.** All 5 tools are pure reads; `list_transactions` never surfaces the `isAnomaly` ground-truth flag — that only ever comes back through `find_anomalies`'s actual detector output. An agent connected to this server cannot mutate financial data, full stop.

- **A deterministic synthetic seed with 5 labeled anomalies, specifically so detection can be graded.** `prisma/seed.ts` runs on a fixed `faker` seed and plants exactly 5 known-anomalous events (6 rows — one is a duplicate-charge pair) with `isAnomaly: true`, which both detectors are structurally forbidden from reading. That ground-truth flag is what makes `services/ml/tests/test_comparison.py`'s precision/recall numbers real measurements instead of vibes.

- **`prisma generate` is explicit in every environment that needs it, not left to an implicit postinstall.** CI runs it explicitly before `@finpulse/core` builds. On Vercel, pnpm 10 blocks dependency lifecycle scripts by default (confirmed via the build log's "Ignored build scripts" warning) — `@finpulse/core`'s build step runs `prisma generate` explicitly with `--schema=../../prisma/schema.prisma`, and `@prisma/client`/`prisma` are allowlisted in `pnpm.onlyBuiltDependencies` so the client still generates correctly either way.

- **Explicit `.js` extensions on relative imports inside `@finpulse/core`.** The package is `"type": "module"`; Node's ESM loader requires the extension on relative specifiers even though the source is TypeScript (`export * from "./queries.js"`, resolved by the compiler to `queries.ts` and left as `.js` in the emitted output). This is what makes `node dist/index.js` — the exact way Claude Desktop launches `packages/mcp-server` — actually work.

## Anomaly-detection comparison

Both detectors were run against the same seeded database and scored against the 5 planted anomalies (`services/ml/tests/test_comparison.py`, executed live against the current seed):

| Planted anomaly                       | Month    | Amount          | Category      | Statistical | ARIMA     |
| ------------------------------------- | -------- | --------------- | ------------- | ----------- | --------- |
| Nobu — anniversary dinner             | Aug 2025 | $420.00         | DINING        | ✅ Caught   | ✅ Caught |
| Netflix — doubled subscription charge | Oct 2025 | $31.98          | SUBSCRIPTIONS | ✅ Caught   | ❌ Missed |
| Amazon — duplicate charge (×2)        | Dec 2025 | $89.99 + $89.99 | OTHER         | ✅ Caught   | ❌ Missed |
| Costco — bulk stock-up run            | Feb 2026 | $380.00         | GROCERIES     | ✅ Caught   | ✅ Caught |
| Ticketmaster — concert tickets        | Apr 2026 | $650.00         | ENTERTAINMENT | ✅ Caught   | ✅ Caught |

| Detector              | Precision | Recall | False positives |
| --------------------- | --------- | ------ | --------------- |
| `StatisticalDetector` | 1.00      | 1.00   | 0               |
| `ArimaDetector`       | 0.38      | 0.60   | 5               |

**Why:** `StatisticalDetector` scores every transaction against a robust per-category median/MAD baseline (with a pooled fallback for thin categories) plus a dedicated exact-duplicate-charge rule — so it catches anomalies regardless of how large the underlying dollar amount is, as long as it's unusual _for that category_ or duplicated. `ArimaDetector` only ever observes a _daily aggregate_ spend total (RENT and INCOME excluded), so a doubled $16 subscription or a duplicated $90 charge simply isn't big enough to move a daily total past a 3σ residual — those two events are structurally invisible to it. It also false-positives on ordinary days where two unrelated legitimate purchases (a grocery run and a utility bill, say) happen to land on the same date and jointly spike the daily total.

_Exact medians/false-positive transactions shift slightly across different `pnpm db:seed` runs (seed data uses `faker`); the pattern — statistical catches all 5, ARIMA structurally misses the two small/duplicate events — is deterministic given the detector logic._

## Project structure

```
finpulse/
├── apps/
│   └── web/                  # Next.js 15 dashboard + API routes (the BFF)
│       └── src/
│           ├── app/            # App Router pages + /api/insights route handler
│           ├── components/     # Dashboard UI: charts, tables, insights panel
│           └── lib/             # Prisma singleton, LLM client, insight context, demo insights
├── packages/
│   ├── core/                  # @finpulse/core — shared queries, anomaly client, formatters
│   └── mcp-server/             # @finpulse/mcp-server — 5 read-only MCP tools over stdio
├── services/
│   └── ml/                    # Python/FastAPI — statistical + ARIMA anomaly detectors
├── prisma/                     # Schema, migrations, deterministic synthetic seed (5 planted anomalies)
├── .github/workflows/          # CI: build (typecheck/lint/test) + ml (pytest/ruff against seeded DB)
├── .claude/                     # Slash commands + a format-on-save hook (see below)
├── docker-compose.yml           # Local Postgres 16
└── CLAUDE.md                    # Conventions and rules for AI-assisted development on this repo
```

## Local setup

**Prerequisites:** Node ≥22, pnpm, Docker, and [uv](https://docs.astral.sh/uv/) + Python 3.12 (only needed for `services/ml`).

```sh
git clone <this-repo>
cd finpulse
pnpm install
cp .env.example .env
```

Fill in `.env`:

| Variable            | Required | Notes                                                                                                |
| ------------------- | -------- | ---------------------------------------------------------------------------------------------------- |
| `DATABASE_URL`      | Yes      | Matches `docker-compose.yml`: `postgresql://finpulse:finpulse@localhost:5433/finpulse?schema=public` |
| `ANTHROPIC_API_KEY` | No       | Unset → falls back to pre-generated/mocked insights (zero cost, zero API calls)                      |
| `ANTHROPIC_MODEL`   | No       | Defaults to `claude-haiku-4-5`                                                                       |
| `ML_SERVICE_URL`    | No       | Defaults to `http://localhost:8000`                                                                  |

Start Postgres and set up the schema:

```sh
docker compose up -d
pnpm prisma migrate deploy   # or: pnpm prisma migrate dev, for local iteration
pnpm db:seed                 # deterministic synthetic data + 5 planted anomalies
```

Run the web app:

```sh
pnpm dev   # builds @finpulse/core, then starts Next.js at localhost:3000
```

Run the ML service (optional — without it, anomaly detection degrades gracefully in both the dashboard and the MCP server):

```sh
cd services/ml
uv sync
uv run uvicorn finpulse_ml.main:app --reload   # serves on :8000
```

**Connect the MCP server to Claude Desktop** — see [`packages/mcp-server/README.md`](packages/mcp-server/README.md) for full details. In short, add to `claude_desktop_config.json`:

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

Restart Claude Desktop, then ask it something like _"What did I spend on dining last month?"_ — it calls the tools and answers from the real data.

## Testing & CI

| Package               | Framework | Tests                                                                                                           |
| --------------------- | --------- | --------------------------------------------------------------------------------------------------------------- |
| `apps/web`            | Vitest    | 20                                                                                                              |
| `packages/core`       | Vitest    | 16                                                                                                              |
| `packages/mcp-server` | Vitest    | 14                                                                                                              |
| `services/ml`         | pytest    | 14 (12 pure unit tests + 2 that validate detector precision/recall against a running, seeded Postgres instance) |

**CI** (`.github/workflows/ci.yml`) runs two jobs on every push/PR to `main`:

- **`build`** — installs dependencies, generates the Prisma client, builds `@finpulse/core`, then runs `typecheck` / `lint` / `test` across every TypeScript package in the workspace.
- **`ml`** — spins up an ephemeral Postgres service container, applies migrations and the synthetic seed, then runs `uv sync`, `ruff check`, and `pytest` for `services/ml` — this is where the DB-dependent detector-validation tests (the precision/recall numbers above) actually run in CI, against a real seeded database, every time.

## Built with Claude Code

This project was built with an agentic development workflow, and that's part of the story, not an afterthought: [`CLAUDE.md`](CLAUDE.md) documents the repo's conventions and rules (strict TypeScript, Conventional Commits, "propose a plan before editing more than 3 files," etc.) that the agent works from directly. `.claude/commands/` holds project-specific slash commands (`typecheck`, `ml`, `mcp`) for running each package's checks with a fixed pass/fail contract, and a `PostToolUse` hook auto-formats every file the agent writes or edits with Prettier. The MCP server this repo ships (`packages/mcp-server`) is itself connectable to Claude Desktop or Claude Code — meaning the same agent that helped build FinPulse can also query it once it's running.
