from datetime import datetime, timedelta

from finpulse_ml.detectors.statistical import StatisticalDetector
from finpulse_ml.schemas import Transaction

BASE_DATE = datetime(2026, 1, 1)


def _tx(
    idx: int,
    amount: float,
    category: str,
    merchant: str = "Merchant",
    days: int = 0,
    is_anomaly: bool = False,
) -> Transaction:
    return Transaction(
        id=f"tx-{idx}",
        account_id="acct-1",
        date=BASE_DATE + timedelta(days=days),
        amount=amount,
        merchant=merchant,
        description="tx",
        category=category,
        is_anomaly=is_anomaly,
    )


def test_normal_transactions_are_not_flagged():
    txs = [_tx(i, -(20 + i % 5), "DINING", merchant=f"Diner{i % 3}", days=i) for i in range(30)]
    assert StatisticalDetector().detect(txs) == []


def test_large_outlier_is_flagged():
    txs = [_tx(i, -(20 + i % 5), "DINING", merchant=f"Diner{i % 3}", days=i) for i in range(30)]
    txs.append(_tx(999, -400, "DINING", merchant="Nobu", days=31))

    flagged_ids = {r.transaction_id for r in StatisticalDetector().detect(txs)}

    assert "tx-999" in flagged_ids


def test_exact_duplicate_is_flagged_even_with_sparse_category():
    txs = [
        _tx(1, -89.99, "OTHER", merchant="Amazon", days=5),
        _tx(2, -89.99, "OTHER", merchant="Amazon", days=5),
    ]

    results = StatisticalDetector().detect(txs)

    assert {r.transaction_id for r in results} == {"tx-1", "tx-2"}
    assert all(r.method == "statistical" for r in results)
    assert all("duplicate" in r.reason for r in results)


def test_sparse_category_outlier_caught_via_global_fallback():
    txs = [_tx(i, -(20 + i % 5), "DINING", merchant=f"Diner{i % 3}", days=i) for i in range(30)]
    txs += [
        _tx(i + 30, -(15 + i % 4), "TRANSPORT", merchant=f"Cab{i % 3}", days=i) for i in range(30)
    ]
    # ENTERTAINMENT has exactly one transaction ever -- its own baseline is
    # undefined (n=1), so this must be caught via the global fallback.
    txs.append(_tx(998, -650, "ENTERTAINMENT", merchant="Ticketmaster", days=15))

    flagged_ids = {r.transaction_id for r in StatisticalDetector().detect(txs)}

    assert "tx-998" in flagged_ids


def test_constant_category_is_not_falsely_flagged():
    # Rent-like category: identical amount every month -> MAD is 0.
    txs = [_tx(i, -1850, "RENT", merchant="Landlord", days=i * 30) for i in range(12)]

    assert StatisticalDetector().detect(txs) == []


def test_income_is_excluded_from_amount_scoring():
    txs = [_tx(i, 2800, "INCOME", merchant="Employer", days=i * 14) for i in range(10)]
    txs.append(_tx(998, 50000, "INCOME", merchant="Employer", days=200))

    assert StatisticalDetector().detect(txs) == []
