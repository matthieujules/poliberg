from __future__ import annotations

from typing import Protocol

from ..models import NewsToolInput, NewsToolOutput


class NewsSourceTool(Protocol):
    name: str

    def run(self, tool_input: NewsToolInput) -> NewsToolOutput:  # sync for simplicity
        ...

