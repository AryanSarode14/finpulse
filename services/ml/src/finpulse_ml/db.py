from urllib.parse import unquote, urlparse

import psycopg

from finpulse_ml.config import get_settings
from finpulse_ml.schemas import Transaction

_SELECT_TRANSACTIONS = """
    SELECT "id", "accountId", "date", "amount", "merchant", "description",
           "category", "isAnomaly"
    FROM "Transaction"
    ORDER BY "date"
"""


def _connect() -> psycopg.Connection:
    # Prisma's DATABASE_URL carries a `?schema=public` query param that is a
    # Prisma-only extension -- libpq/psycopg rejects unknown connection
    # options, so connect from discrete parts instead of the raw URL. Postgres
    # already defaults to the `public` schema, so dropping the param is safe.
    parsed = urlparse(get_settings().database_url)
    return psycopg.connect(
        host=parsed.hostname,
        port=parsed.port or 5432,
        dbname=parsed.path.lstrip("/"),
        user=parsed.username and unquote(parsed.username),
        password=parsed.password and unquote(parsed.password),
    )


def fetch_transactions() -> list[Transaction]:
    """Read-only pull of every transaction, oldest first."""
    with _connect() as conn, conn.cursor() as cur:
        cur.execute(_SELECT_TRANSACTIONS)
        rows = cur.fetchall()

    return [
        Transaction(
            id=row[0],
            account_id=row[1],
            date=row[2],
            amount=float(row[3]),
            merchant=row[4],
            description=row[5],
            category=row[6],
            is_anomaly=row[7],
        )
        for row in rows
    ]
