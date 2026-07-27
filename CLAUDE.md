# FinPulse

A spending-insights platform: import transactions, categorize them, detect
anomalies, forecast spend, generate natural-language insights, and expose it all
to AI agents via an MCP server. Portfolio project — runs on synthetic data only.

## Architecture

- `apps/web` — Next.js 15 (App Router), TypeScript, Tailwind. UI + API route handlers (the BFF).
- `services/ml` — Python 3.12 + FastAPI. Categorization + anomaly detection + time-series forecast.
- `packages/mcp-server` — TypeScript MCP server exposing FinPulse data as agent tools.
- `prisma/` — Postgres schema and migrations (source of truth for the DB).
- Postgres runs via `docker-compose`.

## Tech & conventions

- TypeScript strict mode everywhere. No `any` without a `// reason:` comment.
- Node 22, pnpm workspaces. Python deps via `uv`.
- DB changes go through Prisma migrations only — never hand-edit the DB or write raw ALTERs.
- Naming: `camelCase` vars, `PascalCase` types/components, `kebab-case` files.
- Commits: Conventional Commits (`feat:`, `fix:`, `chore:`, `test:`).
- Every feature ships with tests. Prefer small, pure, testable functions.

## Key commands

- `pnpm dev` — run web app locally
- `pnpm typecheck` — type-check all packages plus root-level scripts (e.g. `prisma/seed.ts`)
- `pnpm -r lint` / `pnpm -r test`
- `docker compose up -d` — start Postgres
- `pnpm prisma migrate dev` — apply a migration

## Rules for the agent

- Before declaring a task done, run `pnpm typecheck` and the relevant tests.
- When adding a DB field, update the Prisma schema, generate a migration, and update seed data.
- Keep secrets in `.env` (git-ignored); never hardcode keys.
- If a change touches more than 3 files, propose a plan before editing.
