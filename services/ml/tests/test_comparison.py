"""Compares StatisticalDetector and ArimaDetector against the 5 planted anomaly
events in prisma/seed.ts.

ArimaDetector operates on aggregate daily spend (see finpulse_ml.detectors.arima),
so it is *expected* to differ from StatisticalDetector's per-transaction view: it
should catch large one-off spikes (Nobu, Costco, Ticketmaster) but has no way to
catch a change too small to move a daily total (the doubled Netflix charge). This
test reports both detectors' results honestly -- it does not tune ArimaDetector to
force a perfect score.

`Transaction.is_anomaly` is ground truth from the seed data and is used ONLY here,
for scoring -- neither detector reads it.
"""

from collections import defaultdict
from datetime import date

from finpulse_ml.db import fetch_transactions
from finpulse_ml.detectors.arima import ArimaDetector
from finpulse_ml.detectors.statistical import StatisticalDetector
from finpulse_ml.schemas import AnomalyResult, Transaction


def _events(transactions: list[Transaction]) -> dict[date, list[Transaction]]:
    """Group planted anomaly transactions into events by date.

    The duplicate Amazon charge plants isAnomaly=True on 2 rows on the same
    day -- that's 1 event, not 2.
    """
    by_date: dict[date, list[Transaction]] = defaultdict(list)
    for tx in transactions:
        if tx.is_anomaly:
            by_date[tx.date.date()].append(tx)
    return dict(sorted(by_date.items()))


def _score(
    results: list[AnomalyResult], events: dict[date, list[Transaction]]
) -> dict[str, object]:
    flagged_ids = {r.transaction_id for r in results}
    planted_ids = {tx.id for txs in events.values() for tx in txs}

    caught = planted_ids & flagged_ids
    false_positives = flagged_ids - planted_ids
    events_caught = {day for day, txs in events.items() if flagged_ids & {tx.id for tx in txs}}

    precision = len(caught) / len(flagged_ids) if flagged_ids else 0.0
    recall = len(events_caught) / len(events) if events else 0.0
    return {
        "events_caught": events_caught,
        "false_positives": false_positives,
        "precision": precision,
        "recall": recall,
    }


def test_compare_statistical_vs_arima_on_seeded_data():
    transactions = fetch_transactions()
    by_id = {tx.id: tx for tx in transactions}
    events = _events(transactions)
    assert len(events) == 5, "expected 5 planted anomaly events in seed data"

    statistical_results = StatisticalDetector().detect(transactions)
    arima_results = ArimaDetector().detect(transactions)

    statistical_score = _score(statistical_results, events)
    arima_score = _score(arima_results, events)

    def describe_event(day: date, txs: list[Transaction]) -> str:
        amounts = "+".join(f"${abs(t.amount):,.2f}" for t in txs)
        return f"{day} {txs[0].merchant:<13} {amounts:<16} {txs[0].category}"

    print(f"\nScanned {len(transactions)} transactions, {len(events)} planted anomaly events.\n")
    print(f"{'Event':<55} {'Statistical':<12} {'ARIMA'}")
    for day, txs in events.items():
        stat_mark = "CAUGHT" if day in statistical_score["events_caught"] else "missed"
        arima_mark = "CAUGHT" if day in arima_score["events_caught"] else "missed"
        print(f"{describe_event(day, txs):<55} {stat_mark:<12} {arima_mark}")

    print()
    for name, score in [("statistical", statistical_score), ("arima", arima_score)]:
        fps = score["false_positives"]
        print(
            f"{name:<12} recall={score['recall']:.2f}  precision={score['precision']:.2f}  "
            f"false_positives={len(fps)}"
        )
        for tx_id in sorted(fps, key=lambda i: by_id[i].date):
            tx = by_id[tx_id]
            print(
                f"    FP  {tx.date.date()} {tx.merchant:<15} ${abs(tx.amount):>9,.2f} {tx.category}"
            )

    # StatisticalDetector's existing, unchanged behavior: catches every
    # planted event (mirrors test_validation.py).
    assert statistical_score["recall"] == 1.0

    # ArimaDetector is expected -- by design, not by tuning -- to catch the
    # large one-off spikes but miss changes too small to move a daily total.
    # We assert the honest floor observed against the real seed data.
    assert arima_score["recall"] >= 0.6
