from fastapi import FastAPI

from finpulse_ml.db import fetch_transactions
from finpulse_ml.detectors.statistical import StatisticalDetector
from finpulse_ml.schemas import DetectResponse

app = FastAPI(title="FinPulse ML")


@app.get("/health")
def health() -> dict[str, str]:
    return {"status": "ok"}


@app.post("/detect", response_model=DetectResponse)
def detect() -> DetectResponse:
    transactions = fetch_transactions()
    anomalies = StatisticalDetector().detect(transactions)
    return DetectResponse(anomalies=anomalies, transactions_scanned=len(transactions))
