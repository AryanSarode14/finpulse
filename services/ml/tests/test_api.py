from datetime import datetime

import pytest
from fastapi.testclient import TestClient

import finpulse_ml.main as main_module
from finpulse_ml.schemas import Transaction


@pytest.fixture
def client() -> TestClient:
    return TestClient(main_module.app)


def test_health(client: TestClient):
    response = client.get("/health")

    assert response.status_code == 200
    assert response.json() == {"status": "ok"}


def test_detect_returns_flagged_anomalies(client: TestClient, monkeypatch: pytest.MonkeyPatch):
    transactions = [
        Transaction(
            id="tx-1",
            account_id="acct-1",
            date=datetime(2026, 1, 1),
            amount=-20.0,
            merchant="Diner",
            description="lunch",
            category="DINING",
        ),
        Transaction(
            id="tx-2",
            account_id="acct-1",
            date=datetime(2026, 1, 2),
            amount=-89.99,
            merchant="Amazon",
            description="order",
            category="OTHER",
        ),
        Transaction(
            id="tx-3",
            account_id="acct-1",
            date=datetime(2026, 1, 2),
            amount=-89.99,
            merchant="Amazon",
            description="order",
            category="OTHER",
        ),
    ]
    monkeypatch.setattr(main_module, "fetch_transactions", lambda: transactions)

    response = client.post("/detect")

    assert response.status_code == 200
    body = response.json()
    assert body["transactions_scanned"] == 3
    assert {a["transaction_id"] for a in body["anomalies"]} == {"tx-2", "tx-3"}
