from collections import defaultdict
from statistics import median

from finpulse_ml.detectors.base import Detector
from finpulse_ml.schemas import AnomalyResult, Transaction

MIN_CATEGORY_SAMPLES = 5
Z_THRESHOLD = 3.5
INCOME_CATEGORY = "INCOME"


def _median_mad(values: list[float]) -> tuple[float, float]:
    center = median(values)
    mad = median(abs(v - center) for v in values)
    return center, mad


class StatisticalDetector(Detector):
    """Robust median/MAD outlier detection per category, plus an exact-duplicate rule.

    Categories with too little history to baseline on their own (fewer than
    `min_category_samples` transactions) fall back to a baseline computed
    across all expense categories combined.
    """

    method = "statistical"

    def __init__(
        self,
        min_category_samples: int = MIN_CATEGORY_SAMPLES,
        z_threshold: float = Z_THRESHOLD,
    ) -> None:
        self.min_category_samples = min_category_samples
        self.z_threshold = z_threshold

    def detect(self, transactions: list[Transaction]) -> list[AnomalyResult]:
        results: dict[str, AnomalyResult] = {}
        for result in self._detect_amount_outliers(transactions):
            results[result.transaction_id] = result
        for result in self._detect_duplicates(transactions):
            # Exact-duplicate is the stronger, unambiguous signal -- it wins
            # if a transaction was already flagged by the amount check.
            results[result.transaction_id] = result
        return list(results.values())

    def _detect_amount_outliers(self, transactions: list[Transaction]) -> list[AnomalyResult]:
        expense_by_category: dict[str, list[float]] = defaultdict(list)
        all_expenses: list[float] = []
        for tx in transactions:
            if tx.category == INCOME_CATEGORY:
                continue
            amount = abs(tx.amount)
            expense_by_category[tx.category].append(amount)
            all_expenses.append(amount)

        category_baseline = {
            category: _median_mad(values) for category, values in expense_by_category.items()
        }
        global_baseline = _median_mad(all_expenses) if all_expenses else (0.0, 0.0)

        flagged: list[AnomalyResult] = []
        for tx in transactions:
            if tx.category == INCOME_CATEGORY:
                continue
            amount = abs(tx.amount)
            n = len(expense_by_category[tx.category])

            if n >= self.min_category_samples:
                baseline_median, baseline_mad = category_baseline[tx.category]
                scope = f"{tx.category} charge"
            else:
                baseline_median, baseline_mad = global_baseline
                scope = "expense (category has too little history to baseline alone)"

            score, is_outlier = self._score(amount, baseline_median, baseline_mad)
            if not is_outlier:
                continue

            multiple = amount / baseline_median if baseline_median > 0 else float("inf")
            reason = (
                f"{multiple:.1f}x the median {scope} "
                f"(${amount:,.2f} vs median ${baseline_median:,.2f})"
            )
            flagged.append(
                AnomalyResult(transaction_id=tx.id, score=score, reason=reason, method=self.method)
            )
        return flagged

    def _score(
        self, amount: float, baseline_median: float, baseline_mad: float
    ) -> tuple[float, bool]:
        if baseline_mad == 0:
            # Degenerate baseline (e.g. rent is always exactly the same
            # amount): any deviation at all is meaningful, but sitting
            # exactly on the median must never divide by zero into a flag.
            if amount == baseline_median:
                return 0.0, False
            score = abs(amount - baseline_median) / max(baseline_median, 1.0) * self.z_threshold
            return score, score >= self.z_threshold

        z = 0.6745 * (amount - baseline_median) / baseline_mad
        return abs(z), abs(z) >= self.z_threshold

    def _detect_duplicates(self, transactions: list[Transaction]) -> list[AnomalyResult]:
        groups: dict[tuple[str, float, str], list[Transaction]] = defaultdict(list)
        for tx in transactions:
            key = (tx.merchant, round(tx.amount, 2), tx.date.date().isoformat())
            groups[key].append(tx)

        flagged: list[AnomalyResult] = []
        for (merchant, amount, day), group in groups.items():
            if len(group) < 2:
                continue
            reason = (
                f"duplicate charge: {len(group)} identical {merchant} transactions "
                f"of ${abs(amount):,.2f} on {day}"
            )
            for tx in group:
                flagged.append(
                    AnomalyResult(
                        transaction_id=tx.id,
                        score=float(len(group)),
                        reason=reason,
                        method=self.method,
                    )
                )
        return flagged
