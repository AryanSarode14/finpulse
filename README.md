# FinPulse

Spending insights, from raw transactions to natural-language answers.

## What it does

FinPulse imports transactions, categorizes them, detects anomalies, forecasts
spend, and generates natural-language insights via Claude — then exposes all
of it to AI agents through an MCP server.

## Tech stack

Next.js 15, TypeScript, Postgres/Prisma, Python/FastAPI, MCP.

## Services

- `apps/web` — Next.js app (`pnpm dev`)
- `services/ml` — Python/FastAPI anomaly-detection service, see [services/ml/README.md](services/ml/README.md)

## Status

In-progress portfolio project. Runs on synthetic data only.
