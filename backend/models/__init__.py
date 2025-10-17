"""Data models for frontier events, news cards, and ticker suggestions."""

from typing import List, Optional, Literal
from datetime import datetime, timezone
from pydantic import BaseModel, Field


class PolymarketEvent(BaseModel):
    """Core event from Polymarket Gamma API"""
    id: str
    title: str = Field(alias="question")
    description: str
    probability: float = Field(ge=0, le=1)

    # Volume metrics
    volume24hr: float = Field(default=0, alias="volume24hr")
    volume1wk: float = Field(default=0, alias="volume1wk")
    volume1mo: float = Field(default=0, alias="volume1mo")
    volume1yr: float = Field(default=0, alias="volume1yr")

    # Price change metrics
    oneHourPriceChange: Optional[float] = Field(default=None, alias="oneHourPriceChange")
    oneDayPriceChange: Optional[float] = Field(default=None, alias="oneDayPriceChange")
    oneWeekPriceChange: Optional[float] = Field(default=None, alias="oneWeekPriceChange")

    # Market state
    active: bool = True
    closed: bool = False
    archived: bool = False

    # Price data
    lastTradePrice: Optional[float] = Field(default=None, alias="lastTradePrice")
    bestBid: Optional[float] = Field(default=None, alias="bestBid")
    bestAsk: Optional[float] = Field(default=None, alias="bestAsk")

    # Liquidity
    liquidityNum: float = Field(default=0, alias="liquidityNum")

    # Metadata
    slug: str = Field(default="")
    marketUrl: str = Field(default="")
    endDate: Optional[datetime] = Field(default=None, alias="end_date_iso")

    # Derived fields
    category: str = Field(default="other")
    tags: List[str] = Field(default_factory=list)
    detectedAt: datetime = Field(default_factory=lambda: datetime.now(timezone.utc))
    locked: bool = False

    # Volume spike indicator (calculated)
    volumeSpike: Optional[float] = None

    class Config:
        populate_by_name = True
        json_encoders = {
            datetime: lambda v: v.isoformat()
        }

    def model_dump(self, **kwargs):
        """Override to always use field names (title) instead of aliases (question) in output"""
        kwargs.setdefault('by_alias', False)
        return super().model_dump(**kwargs)


class EventListResponse(BaseModel):
    """Response for listing frontier events"""
    events: List[PolymarketEvent]
    total: int
    hasVolumeSpike: int = Field(description="Number of events with volume spikes")


class TickerSuggestion(BaseModel):
    """Stock ticker suggestion from GPT"""
    symbol: str
    name: str
    rationale: str
    confidence: float = Field(ge=0, le=1)
    direction: Literal["bullish", "bearish", "neutral"]
    relatedTags: List[str]


class NewsCard(BaseModel):
    """News article related to an event"""
    id: str
    title: str
    snippet: str
    source: str
    publishedAt: datetime
    url: str
    relevanceScore: float = Field(ge=0, le=1)
    sentiment: Literal["positive", "negative", "neutral"]


class EventChange(BaseModel):
    """Represents a change detected in an event"""
    eventId: str
    eventTitle: str
    changeType: Literal["new_spike", "spike_increased", "spike_decreased", "spike_removed"]
    timestamp: datetime
    oldSpikeRatio: Optional[float] = None
    newSpikeRatio: Optional[float] = None
    volume24hr: float
    probability: float

    class Config:
        json_encoders = {
            datetime: lambda v: v.isoformat()
        }


class ChangesResponse(BaseModel):
    """Response for changes endpoint"""
    changes: List[EventChange]
    total: int
