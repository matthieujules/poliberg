from __future__ import annotations

from datetime import datetime
from typing import Any, Dict, List, Literal, Optional

from pydantic import BaseModel, HttpUrl, Field


class PolymarketEvent(BaseModel):
    id: str
    title: str
    description: Optional[str] = None
    category: Optional[str] = None
    start_time: Optional[datetime] = None
    end_time: Optional[datetime] = None
    metadata: Optional[Dict[str, Any]] = None


class OrchestrateRequest(BaseModel):
    event: PolymarketEvent
    news_query: Optional[str] = None
    preferred_tool: Optional[Literal["exa", "apify", "internal"]] = None
    max_items: int = Field(default=6, ge=1, le=50)


class NewsItem(BaseModel):
    id: str
    source: Optional[str] = None
    title: str
    summary: Optional[str] = None
    url: HttpUrl
    published_at: Optional[datetime] = None
    raw: Optional[Dict[str, Any]] = None


class NewsToolInput(BaseModel):
    query: str
    event: PolymarketEvent
    max_items: int = 6


class NewsToolOutput(BaseModel):
    items: List[NewsItem]
    tool_name: str
    diagnostics: Optional[Dict[str, Any]] = None


class ArticleResult(BaseModel):
    title: str
    url: HttpUrl
    source: Optional[str] = None
    published_at: Optional[datetime] = None
    summary: Optional[str] = None


class OrchestrateResponse(BaseModel):
    run_id: str
    event_id: str
    tool_used: str
    news_count: int
    articles: List[ArticleResult]
    next_actions: List[str] = ["render_graphs"]
    diagnostics: Optional[Dict[str, Any]] = None
