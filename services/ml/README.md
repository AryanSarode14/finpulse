# finpulse-ml

Python/FastAPI microservice for categorization, anomaly detection, and
forecasting. Managed with [uv](https://docs.astral.sh/uv/), Python 3.12. Not
part of the pnpm workspace.

## Setup

```sh
cd services/ml
uv sync
```

## Environment

Reads `DATABASE_URL` from the environment — the same variable Prisma uses
(see `.env.example`). The `?schema=public` query param is a Prisma-only
extension; it's safely ignored (Postgres defaults to the `public` schema
anyway).

```sh
export DATABASE_URL='postgresql://finpulse:finpulse@localhost:5433/finpulse?schema=public'
# or, from repo root: set -a && source .env && set +a
```

## Run

```sh
uv run uvicorn finpulse_ml.main:app --reload
```

- `GET /health` → `{"status": "ok"}`
- `POST /detect` → pulls transactions from Postgres, runs `StatisticalDetector`, returns flagged anomalies

## Test & lint

```sh
uv run pytest
uv run ruff check
```

`tests/test_validation.py` pulls the real seeded transactions and checks that
every planted anomaly (`isAnomaly=true` in `prisma/seed.ts`) is caught,
printing a precision/recall report — requires Postgres up (`docker compose up -d`)
and seeded (`pnpm db:seed`) with `DATABASE_URL` set.

## Detectors

Detectors implement the `Detector` interface (`src/finpulse_ml/detectors/base.py`):
`detect(transactions) -> list[AnomalyResult]`. This lets future detectors
(e.g. a time-series model) be swapped in without touching the API layer.

`StatisticalDetector` flags transactions whose amount deviates strongly from
a robust per-category baseline (median + MAD), falling back to a baseline
across all categories when a category has too little history, plus an
exact-duplicate rule (same merchant, amount, and calendar day).
