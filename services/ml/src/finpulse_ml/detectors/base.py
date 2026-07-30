from abc import ABC, abstractmethod

from finpulse_ml.schemas import AnomalyResult, Transaction


class Detector(ABC):
    """Strategy interface for anomaly detectors.

    Implementations must decide purely from observable transaction fields
    (amount, category, date, merchant, description) -- never from
    `Transaction.is_anomaly`, which is ground-truth reserved for scoring.
    """

    method: str

    @abstractmethod
    def detect(self, transactions: list[Transaction]) -> list[AnomalyResult]:
        raise NotImplementedError
