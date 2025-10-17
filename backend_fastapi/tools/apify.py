from __future__ import annotations

from datetime import datetime, timezone
from typing import Any, Dict, List, Optional

from ..config import settings
from ..models import NewsItem, NewsToolInput, NewsToolOutput
from ..services.apify_client import ApifyClient


class ApifyTool:
    name = "apify"

    def run(self, tool_input: NewsToolInput) -> NewsToolOutput:
        # If APIFY config is present, call a real actor/task; else return stubs.
        token = settings.APIFY_TOKEN
        # Always prefer the hardcoded default actor if none provided
        actor_id = settings.APIFY_ACTOR_ID or settings.DEFAULT_ACTOR_ID
        task_id = settings.APIFY_TASK_ID  # optional, but we won't require it
        diagnostics: Dict[str, Any] = {}

        if token and actor_id:
            try:
                client = ApifyClient(token=token)
                # Generic input shape; adapt to your actor/task contract.
                input_payload: Dict[str, Any] = {
                    # Provide both singular and array form for better compatibility
                    "query": tool_input.query,
                    "queries": [tool_input.query],
                    "event": {"id": tool_input.event.id, "title": tool_input.event.title, "category": tool_input.event.category},
                    "maxItems": tool_input.max_items,
                }
                run = client.run_actor(actor_id, input_payload)
                run_id = run.get("id") or run.get("_id")
                finished = client.wait_for_run(run_id)
                dataset_id = finished.get("defaultDatasetId") or finished.get("defaultDatasetId")
                raw_items: List[Dict[str, Any]] = []
                if dataset_id:
                    raw_items = client.get_dataset_items(dataset_id, limit=tool_input.max_items)
                items = [self._map_item(x, idx) for idx, x in enumerate(raw_items)]
                diagnostics = {"run": finished, "dataset_items": len(raw_items)}
                return NewsToolOutput(items=items, tool_name=self.name, diagnostics=diagnostics)
            except Exception as e:
                # Fall back to stubs if real call fails
                diagnostics = {"error": str(e)}
        else:
            reasons: List[str] = []
            if not token:
                reasons.append("missing_apify_token")
            if not actor_id:
                reasons.append("missing_actor_id")
            diagnostics = {"reason": reasons}

        # Stubbed items
        items: List[NewsItem] = []
        if settings.ALLOW_STUB_RESULTS:
            now = datetime.now(timezone.utc)
            base = "https://news.example"
            for i in range(min(tool_input.max_items, 6)):
                items.append(
                    NewsItem(
                        id=f"apify_stub_{i}",
                        source="apify-stub",
                        title=f"{tool_input.event.title}: related update {i+1}",
                        summary=f"Stubbed summary for query '{tool_input.query}'.",
                        url=f"{base}/{i+1}",
                        published_at=now,
                        raw={"stub": True},
                    )
                )
        if not items and not settings.ALLOW_STUB_RESULTS:
            # Surface failure if stubs are disabled
            raise RuntimeError(f"Apify call failed and stubs disabled. Diagnostics: {diagnostics}")

        diagnostics.update({"note": "apify stub"})
        return NewsToolOutput(items=items, tool_name=self.name, diagnostics=diagnostics)

    def _parse_dt(self, value: Optional[str]) -> Optional[datetime]:
        if not value:
            return None
        try:
            # Try ISO8601
            return datetime.fromisoformat(value.replace("Z", "+00:00"))
        except Exception:
            return None

    def _map_item(self, obj: Dict[str, Any], idx: int) -> NewsItem:
        # Best-effort mapping from typical Apify dataset items
        title = obj.get("title") or obj.get("headline") or obj.get("name") or "Untitled"
        url = obj.get("url") or obj.get("link") or obj.get("sourceUrl") or "https://example.com"
        summary = obj.get("summary") or obj.get("description") or obj.get("snippet")
        source = obj.get("source") or obj.get("site") or obj.get("domain")
        published = (
            obj.get("publishedAt") or obj.get("published_at") or obj.get("date") or obj.get("time")
        )
        published_at = self._parse_dt(published) if isinstance(published, str) else None
        return NewsItem(
            id=str(obj.get("id") or obj.get("_id") or obj.get("itemId") or f"apify_{idx}"),
            source=source,
            title=title,
            summary=summary,
            url=url,  # Pydantic will validate it's a real URL
            published_at=published_at,
            raw=obj,
        )
