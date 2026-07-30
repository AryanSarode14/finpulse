from typing import Literal

from fastapi import FastAPI

from finpulse_ml.db import fetch_transactions
from finpulse_ml.detectors.arima import ArimaDetector
from finpulse_ml.detectors.statistical import StatisticalDetector
from finpulse_ml.schemas import DetectResponse

app = FastAPI(title="FinPulse ML")

DetectMethod = Literal["statistical", "arima", "both"]


@app.get("/health")
def health() -> dict[str, str]:
    return {"status": "ok"}


@app.post("/detect", response_model=DetectResponse)
def detect(method: DetectMethod = "statistical") -> DetectResponse:
    transactions = fetch_transactions()

    anomalies = []
    if method in ("statistical", "both"):
        anomalies += StatisticalDetector().detect(transactions)
    if method in ("arima", "both"):
        anomalies += ArimaDetector().detect(transactions)

    return DetectResponse(anomalies=anomalies, transactions_scanned=len(transactions))
