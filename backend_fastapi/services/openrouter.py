from __future__ import annotations

import os
from typing import Any, Dict, List, Optional

import httpx

from ..config import settings


class OpenRouterClient:
    def __init__(self, api_key: Optional[str] = None, base_url: Optional[str] = None, model: Optional[str] = None):
        self.api_key = api_key or settings.OPENROUTER_KEY or ""
        self.base_url = (base_url or settings.OPENROUTER_BASE_URL).rstrip("/")
        self.model = model or settings.OPENROUTER_MODEL
        self._chat_url = f"{self.base_url}/chat/completions"

    async def chat(self, messages: List[Dict[str, Any]], *, model: Optional[str] = None, temperature: float = 0.2,
                   response_format: Optional[str] = None, extra: Optional[Dict[str, Any]] = None) -> Dict[str, Any]:
        if not self.api_key:
            raise RuntimeError("OPENROUTER_KEY is not set; cannot call OpenRouter.")

        payload: Dict[str, Any] = {
            "model": model or self.model,
            "messages": messages,
            "temperature": temperature,
        }
        if response_format:
            payload["response_format"] = {"type": response_format}
        if extra:
            payload.update(extra)

        headers = {
            "Authorization": f"Bearer {self.api_key}",
            "Content-Type": "application/json",
        }
        # Optional best-practice headers (OpenRouter recommends):
        referer = os.getenv("OPENROUTER_REFERER")
        title = os.getenv("OPENROUTER_APP_TITLE", settings.APP_TITLE)
        if referer:
            headers["HTTP-Referer"] = referer
        if title:
            headers["X-Title"] = title

        async with httpx.AsyncClient(timeout=settings.ORCH_TIMEOUT) as client:
            resp = await client.post(self._chat_url, headers=headers, json=payload)
            resp.raise_for_status()
            data = resp.json()
            return data

