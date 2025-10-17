from __future__ import annotations

import os
from typing import Optional
from dotenv import load_dotenv

# Ensure .env is loaded before reading env vars
load_dotenv()


class Settings:
    # OpenRouter
    OPENROUTER_KEY: Optional[str] = os.getenv("OPENROUTER_KEY") or os.getenv("OPENROUTER_API_KEY")
    OPENROUTER_MODEL: str = os.getenv("OPENROUTER_MODEL", "openai/gpt-4o-mini")
    OPENROUTER_BASE_URL: str = os.getenv("OPENROUTER_BASE_URL", "https://openrouter.ai/api/v1")
    APP_TITLE: str = os.getenv("APP_TITLE", "Poliberg Orchestrator API")

    # Orchestrator defaults
    ORCH_MAX_ITEMS: int = int(os.getenv("ORCH_MAX_ITEMS", "6"))
    ORCH_TIMEOUT: float = float(os.getenv("ORCH_TIMEOUT", "20"))  # seconds

    # Behavior flags
    ALLOW_STUB_RESULTS: bool = os.getenv("ALLOW_STUB_RESULTS", "true").lower() == "true"

    # Apify
    APIFY_TOKEN: Optional[str] = os.getenv("APIFY_TOKEN")
    APIFY_BASE_URL: str = os.getenv("APIFY_BASE_URL", "https://api.apify.com/v2")
    # Hardcoded default actor so only APIFY_TOKEN is required
    DEFAULT_ACTOR_ID: str = os.getenv("APIFY_DEFAULT_ACTOR_ID", "lhotanova~google-news-scraper")
    APIFY_ACTOR_ID: Optional[str] = os.getenv("APIFY_ACTOR_ID")  # optional override
    APIFY_TASK_ID: Optional[str] = os.getenv("APIFY_TASK_ID")    # optional alternate path
    APIFY_POLL_INTERVAL: float = float(os.getenv("APIFY_POLL_INTERVAL", "1.0"))
    APIFY_MAX_WAIT: float = float(os.getenv("APIFY_MAX_WAIT", "25.0"))  # seconds


settings = Settings()
