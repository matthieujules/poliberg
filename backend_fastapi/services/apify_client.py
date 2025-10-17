from __future__ import annotations

import time
from typing import Any, Dict, List, Optional

import httpx

from ..config import settings


class ApifyClient:
    def __init__(self, token: Optional[str] = None, base_url: Optional[str] = None):
        self.token = (token or settings.APIFY_TOKEN or "").strip()
        self.base_url = (base_url or settings.APIFY_BASE_URL).rstrip("/")
        if not self.token:
            raise RuntimeError("APIFY_TOKEN not set")

    def _headers(self) -> Dict[str, str]:
        return {"Content-Type": "application/json"}

    def _client(self) -> httpx.Client:
        return httpx.Client(timeout=settings.ORCH_TIMEOUT)

    def run_actor(self, actor_id: str, input_payload: Dict[str, Any]) -> Dict[str, Any]:
        url = f"{self.base_url}/actors/{actor_id}/runs?token={self.token}"
        with self._client() as c:
            r = c.post(url, json={"input": input_payload})
            r.raise_for_status()
            return r.json().get("data", {})

    def run_task(self, task_id: str, input_payload: Dict[str, Any]) -> Dict[str, Any]:
        url = f"{self.base_url}/actor-tasks/{task_id}/runs?token={self.token}"
        with self._client() as c:
            r = c.post(url, json={"input": input_payload})
            r.raise_for_status()
            return r.json().get("data", {})

    def get_run(self, run_id: str) -> Dict[str, Any]:
        url = f"{self.base_url}/actor-runs/{run_id}?token={self.token}"
        with self._client() as c:
            r = c.get(url)
            r.raise_for_status()
            return r.json().get("data", {})

    def wait_for_run(self, run_id: str, *, max_wait: Optional[float] = None, poll_interval: Optional[float] = None) -> Dict[str, Any]:
        max_wait = max_wait or settings.APIFY_MAX_WAIT
        poll_interval = poll_interval or settings.APIFY_POLL_INTERVAL
        start = time.time()
        while True:
            run = self.get_run(run_id)
            status = run.get("status")
            if status in {"SUCCEEDED", "FAILED", "ABORTED", "TIMED-OUT"}:
                return run
            if time.time() - start > max_wait:
                return run
            time.sleep(poll_interval)

    def get_dataset_items(self, dataset_id: str, *, limit: int = 50) -> List[Dict[str, Any]]:
        # New datasets API: /v2/datasets/{datasetId}/items
        url = f"{self.base_url}/datasets/{dataset_id}/items?token={self.token}&format=json&clean=true&limit={limit}"
        with self._client() as c:
            r = c.get(url)
            r.raise_for_status()
            data = r.json()
            if isinstance(data, list):
                return data
            return []
