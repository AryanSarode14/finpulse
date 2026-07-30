"""Validates StatisticalDetector against the 5 planted anomalies in prisma/seed.ts.

`Transaction.is_anomaly` is ground truth from the seed data and is used ONLY
here, for scoring -- the detector itself never reads it.
"""

from finpulse_ml.db import fetch_transactions
from finpulse_ml.detectors.statistical import StatisticalDetector


def test_catches_all_planted_anomalies():
    transactions = fetch_transactions()
    by_id = {tx.id: tx for tx in transactions}

    results = StatisticalDetector().detect(transactions)
    flagged_ids = {r.transaction_id for r in results}
    reason_by_id = {r.transaction_id: r.reason for r in results}

    planted_ids = {tx.id for tx in transactions if tx.is_anomaly}

    caught = planted_ids & flagged_ids
    missed = planted_ids - flagged_ids
    false_positives = flagged_ids - planted_ids

    precision = len(caught) / len(flagged_ids) if flagged_ids else 0.0
    recall = len(caught) / len(planted_ids) if planted_ids else 0.0

    def describe(tx_id: str) -> str:
        tx = by_id[tx_id]
        return f"{tx.date.date()} {tx.merchant:<15} ${tx.amount:>10,.2f} {tx.category}"

    print(f"\nScanned {len(transactions)} transactions, {len(planted_ids)} planted anomalies.")
    print(f"Caught {len(caught)}/{len(planted_ids)} planted anomalies:")
    for tx_id in sorted(caught, key=lambda i: by_id[i].date):
        print(f"  OK   {describe(tx_id)} -- {reason_by_id[tx_id]}")
    if missed:
        print(f"Missed {len(missed)} planted anomalies:")
        for tx_id in sorted(missed, key=lambda i: by_id[i].date):
            print(f"  MISS {describe(tx_id)}")
    print(f"False positives: {len(false_positives)}")
    for tx_id in sorted(false_positives, key=lambda i: by_id[i].date):
        print(f"  FP   {describe(tx_id)} -- {reason_by_id[tx_id]}")
    print(f"Precision: {precision:.2f}  Recall: {recall:.2f}")

    # 5 planted anomaly *events*, but the duplicate Amazon charge plants
    # isAnomaly=True on both of its rows, so there are 6 flagged rows total.
    assert len(planted_ids) == 6, "expected 6 isAnomaly=True rows (5 events) in seed data"
    assert not missed, f"Missed planted anomalies: {sorted(missed)}"
