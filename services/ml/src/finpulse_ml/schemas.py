from datetime import datetime

from pydantic import BaseModel


class Transaction(BaseModel):
    id: str
    account_id: str
    date: datetime
    amount: float
    merchant: str
    description: str
    category: str
    # Ground truth from the seed data. Detectors must never read this field
    # to make decisions -- it exists only so callers (e.g. validation tests)
    # can score detector output against known planted anomalies.
    is_anomaly: bool = False


class AnomalyResult(BaseModel):
    transaction_id: str
    score: float
    reason: str
    method: str


class DetectResponse(BaseModel):
    anomalies: list[AnomalyResult]
    transactions_scanned: int
