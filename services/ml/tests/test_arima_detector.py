from datetime import datetime, timedelta

from finpulse_ml.detectors.arima import MIN_SERIES_LENGTH, ArimaDetector
from finpulse_ml.schemas import Transaction

BASE_DATE = datetime(2026, 1, 1)
N_DAYS = 60
SPIKE_DAY = 45
SPIKE_AMOUNT = -500.0


def _tx(
    idx: int | str,
    amount: float,
    category: str,
    merchant: str = "Merchant",
    days: int = 0,
) -> Transaction:
    return Transaction(
        id=f"tx-{idx}",
        account_id="acct-1",
        date=BASE_DATE + timedelta(days=days),
        amount=amount,
        merchant=merchant,
        description="tx",
        category=category,
    )


def _baseline_transactions() -> list[Transaction]:
    # Deterministic (no randomness) small daily dining charge, repeating on a
    # 7-day cycle -- gives ARIMA a clean, learnable pattern to forecast.
    return [
        _tx(day, -(15 + (day % 7) * 3), "DINING", merchant=f"Diner{day % 4}", days=day)
        for day in range(N_DAYS)
    ]


def test_injected_spike_is_flagged_and_maps_to_the_driving_transaction():
    txs = _baseline_transactions()
    txs.append(
        Transaction(
            id="tx-spike",
            account_id="acct-1",
            date=BASE_DATE + timedelta(days=SPIKE_DAY),
            amount=SPIKE_AMOUNT,
            merchant="BigTicket",
            description="one-off splurge",
            category="ENTERTAINMENT",
        )
    )

    results = ArimaDetector().detect(txs)
    flagged_ids = {r.transaction_id for r in results}

    assert "tx-spike" in flagged_ids
    spike_result = next(r for r in results if r.transaction_id == "tx-spike")
    assert spike_result.method == "arima"
    assert "BigTicket" in spike_result.reason
    assert "sigma" in spike_result.reason

    # Days other than the spike day should not be flagged. (The spike day's
    # own small baseline dining charge may also be swept into the "driving"
    # set alongside tx-spike, since it's part of that day's excess spend too.)
    other_baseline_ids = {f"tx-{i}" for i in range(N_DAYS) if i != SPIKE_DAY}
    assert not flagged_ids & other_baseline_ids, "non-spike days should not be flagged"


def test_excludes_rent_and_income_from_aggregate_and_from_output():
    txs = _baseline_transactions()
    txs.append(_tx(9000, -1850, "RENT", merchant="Landlord", days=10))
    txs.append(_tx(9001, 2800, "INCOME", merchant="Employer", days=20))
    txs.append(
        Transaction(
            id="tx-spike",
            account_id="acct-1",
            date=BASE_DATE + timedelta(days=SPIKE_DAY),
            amount=SPIKE_AMOUNT,
            merchant="BigTicket",
            description="one-off splurge",
            category="ENTERTAINMENT",
        )
    )

    flagged_ids = {r.transaction_id for r in ArimaDetector().detect(txs)}

    assert "tx-9000" not in flagged_ids
    assert "tx-9001" not in flagged_ids
    assert "tx-spike" in flagged_ids


def test_short_series_returns_empty_without_raising():
    txs = [_tx(i, -20, "DINING", days=i) for i in range(MIN_SERIES_LENGTH - 5)]

    assert ArimaDetector().detect(txs) == []


def test_empty_transactions_returns_empty():
    assert ArimaDetector().detect([]) == []
