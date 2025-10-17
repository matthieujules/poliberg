from __future__ import annotations

from datetime import datetime, timezone
from typing import List

from ..config import settings
from ..models import NewsItem, NewsToolInput, NewsToolOutput


class InternalNewsTool:
    name = "internal"

    def run(self, tool_input: NewsToolInput) -> NewsToolOutput:
        # Placeholder internal tool; returns stubbed items if allowed
        items: List[NewsItem] = []
        if settings.ALLOW_STUB_RESULTS:
            now = datetime.now(timezone.utc)
            base = "https://internal.example"
            for i in range(min(tool_input.max_items, 6)):
                items.append(
                    NewsItem(
                        id=f"internal_stub_{i}",
                        source="internal-stub",
                        title=f"{tool_input.event.title}: internal signal {i+1}",
                        summary=f"Internal stub for query '{tool_input.query}'.",
                        url=f"{base}/{i+1}",
                        published_at=now,
                        raw={"stub": True},
                    )
                )
        return NewsToolOutput(items=items, tool_name=self.name, diagnostics={"note": "internal stub"})

