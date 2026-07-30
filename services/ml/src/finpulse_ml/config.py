import os
from dataclasses import dataclass
from functools import lru_cache


@dataclass(frozen=True)
class Settings:
    database_url: str


@lru_cache
def get_settings() -> Settings:
    database_url = os.environ.get("DATABASE_URL")
    if not database_url:
        raise RuntimeError(
            "DATABASE_URL is not set. Export it (see .env.example) before running "
            "the service or its DB-backed tests."
        )
    return Settings(database_url=database_url)
