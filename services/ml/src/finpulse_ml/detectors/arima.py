import warnings
from itertools import product

import pandas as pd
from statsmodels.tsa.arima.model import ARIMA

from finpulse_ml.detectors.base import Detector
from finpulse_ml.schemas import AnomalyResult, Transaction

# RENT and INCOME are both fixed, non-discretionary, calendar-scheduled cash
# flows -- RENT in particular recurs monthly at ~the same amount (~$1850-2300
# in the seed data), which would otherwise dwarf every real spending anomaly:
# a plain daily-total model would either flag it 13x/year as a "surprise", or
# (by inflating the residual std) hide genuine spikes like Nobu ($420) and
# Costco ($380) below the noise floor. Neither is spend *behavior* an
# anomaly detector should be modeling -- same reasoning as excluding INCOME.
EXCLUDED_CATEGORIES = {"INCOME", "RENT"}

# Below this many days of history, ARIMA can't fit a meaningful model --
# fail gracefully (return no anomalies) rather than force a fit.
MIN_SERIES_LENGTH = 20

# 3-sigma on ARIMA residuals: the standard rule of thumb for residual-based
# anomaly flagging. This is independent of StatisticalDetector.Z_THRESHOLD,
# which scores a different signal (per-category MAD) on a different scale.
RESIDUAL_Z_THRESHOLD = 3.0

# Small AIC search grid -- enough for a ~1yr daily series, small enough to
# stay fast in CI.
_P_RANGE = range(0, 3)
_D_RANGE = range(0, 2)
_Q_RANGE = range(0, 3)


def _daily_spend_series(transactions: list[Transaction]) -> pd.Series:
    """Aggregate to a continuous daily total-spend series.

    Excludes INCOME and RENT (see EXCLUDED_CATEGORIES); everything else is
    summed by abs(amount) per calendar day, with no-spend days filled at 0 so
    the series has no gaps for ARIMA to trip over.
    """
    by_day: dict[pd.Timestamp, float] = {}
    for tx in transactions:
        if tx.category in EXCLUDED_CATEGORIES:
            continue
        day = pd.Timestamp(tx.date.date())
        by_day[day] = by_day.get(day, 0.0) + abs(tx.amount)

    if not by_day:
        return pd.Series(dtype=float)

    series = pd.Series(by_day).sort_index()
    full_index = pd.date_range(series.index.min(), series.index.max(), freq="D")
    return series.reindex(full_index, fill_value=0.0)


def _fit_best_arima(series: pd.Series):
    """Grid-search (p, d, q) by AIC, skipping orders that fail to converge."""
    best_fit = None
    best_aic = float("inf")
    for p, d, q in product(_P_RANGE, _D_RANGE, _Q_RANGE):
        if p == 0 and q == 0:
            continue
        try:
            with warnings.catch_warnings():
                warnings.simplefilter("ignore")
                fit = ARIMA(series, order=(p, d, q)).fit()
        except Exception:
            # statsmodels can raise a variety of fit/convergence errors here --
            # just skip this candidate order and keep searching the grid.
            continue
        if fit.aic < best_aic:
            best_aic = fit.aic
            best_fit = fit
    return best_fit


class ArimaDetector(Detector):
    """Aggregate-spend time-series strategy.

    Fits ARIMA on daily total spend (see `_daily_spend_series`) and flags
    days whose actual spend overshoots the forecast by more than
    `z_threshold` residual sigmas, then maps each flagged day back to the
    transaction(s) whose amount explains the overshoot.

    Complementary to StatisticalDetector's per-transaction approach: this
    catches spikes at the daily-total level (a single big purchase, or
    several purchases landing on the same day) but has no visibility into a
    transaction that's merely large relative to its own category, and no
    chance of catching a change too small to move a daily total (e.g. one
    subscription charge doubling for a month).
    """

    method = "arima"

    def __init__(
        self,
        min_series_length: int = MIN_SERIES_LENGTH,
        z_threshold: float = RESIDUAL_Z_THRESHOLD,
    ) -> None:
        self.min_series_length = min_series_length
        self.z_threshold = z_threshold

    def detect(self, transactions: list[Transaction]) -> list[AnomalyResult]:
        series = _daily_spend_series(transactions)
        if len(series) < self.min_series_length:
            return []

        fit = _fit_best_arima(series)
        if fit is None:
            return []

        residuals = series - fit.fittedvalues
        std = residuals.std()
        if not std or pd.isna(std):
            return []

        # Only overspending is attributable to a transaction -- a day
        # spending less than forecast has no "driving transaction" to blame.
        flagged_days = residuals[residuals > self.z_threshold * std]

        by_day: dict[pd.Timestamp, list[Transaction]] = {}
        for tx in transactions:
            if tx.category in EXCLUDED_CATEGORIES:
                continue
            by_day.setdefault(pd.Timestamp(tx.date.date()), []).append(tx)

        results: list[AnomalyResult] = []
        for day, residual in flagged_days.items():
            day_txs = sorted(by_day.get(day, []), key=lambda tx: abs(tx.amount), reverse=True)
            if not day_txs:
                continue

            actual = series.loc[day]
            forecast = fit.fittedvalues.loc[day]
            z = residual / std

            # Attribute the excess to the smallest set of largest same-day
            # transactions whose combined amount covers it -- handles both a
            # single big purchase and same-day duplicate/multi charges.
            driving: list[Transaction] = []
            running_total = 0.0
            for tx in day_txs:
                if driving and running_total >= residual:
                    break
                driving.append(tx)
                running_total += abs(tx.amount)

            reason = (
                f"daily spend ${actual:,.2f} vs forecast ${forecast:,.2f} "
                f"(residual {z:.1f} sigma) -- driven by "
                + ", ".join(f"{tx.merchant} ${abs(tx.amount):,.2f}" for tx in driving)
                + f" on {day.date()}"
            )
            for tx in driving:
                results.append(
                    AnomalyResult(
                        transaction_id=tx.id, score=float(z), reason=reason, method=self.method
                    )
                )
        return results
