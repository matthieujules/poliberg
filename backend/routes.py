"""HTTP routes for frontier feed, event actions, and orchestrator triggers."""

from fastapi import APIRouter, HTTPException, Query
from typing import Optional, List, Dict, Any
from datetime import datetime
from pydantic import BaseModel

from models import EventListResponse, PolymarketEvent, ChangesResponse, TickerSuggestion
from services.ingestion import ingestion_service
from services.asset_mapper import asset_mapper_service
from services.apify_service import apify_service
from services.orchestrator import orchestrator_service

router = APIRouter()


@router.get("/events", response_model=EventListResponse)
async def get_frontier_events(
    limit: int = Query(20, ge=1, le=100, description="Maximum number of events to return"),
    spike_only: bool = Query(False, description="Only return events with volume spikes"),
):
    """
    Get frontier events (most interesting markets)

    Returns events sorted by volume spike ratio, then by 24hr volume.
    If spike_only=true, only returns markets with detected volume spikes.
    """
    events = ingestion_service.get_frontier_events(
        limit=limit,
        spike_only=spike_only
    )

    spike_count = sum(1 for e in events if e.volumeSpike is not None)

    return EventListResponse(
        events=events,
        total=len(events),
        hasVolumeSpike=spike_count
    )


# IMPORTANT: Specific routes must come BEFORE dynamic {event_id} routes
@router.get("/events/spikes/summary")
async def get_spike_summary():
    """
    Get summary statistics about volume spikes
    """
    all_events = list(ingestion_service.events.values())
    spike_events = [e for e in all_events if e.volumeSpike is not None]

    if not spike_events:
        return {
            "total_events": len(all_events),
            "spike_events": 0,
            "average_spike_ratio": 0,
            "max_spike_ratio": 0,
            "top_spike_event": None
        }

    spike_ratios = [e.volumeSpike for e in spike_events if e.volumeSpike]
    avg_ratio = sum(spike_ratios) / len(spike_ratios) if spike_ratios else 0
    max_ratio = max(spike_ratios) if spike_ratios else 0

    # Get event with highest spike
    top_spike = max(spike_events, key=lambda e: e.volumeSpike or 0)

    return {
        "total_events": len(all_events),
        "spike_events": len(spike_events),
        "average_spike_ratio": round(avg_ratio, 2),
        "max_spike_ratio": round(max_ratio, 2),
        "top_spike_event": {
            "id": top_spike.id,
            "title": top_spike.title,
            "spike_ratio": round(top_spike.volumeSpike, 2),
            "volume24hr": top_spike.volume24hr,
        }
    }


@router.get("/events/changes", response_model=ChangesResponse)
async def get_changes(
    limit: int = Query(50, ge=1, le=100, description="Maximum number of changes to return"),
    since: Optional[str] = Query(None, description="ISO timestamp to filter from (e.g., 2025-10-17T12:00:00Z)"),
):
    """
    Get recent changes detected in polling

    Returns changes in reverse chronological order (most recent first).
    Use 'since' parameter to get only changes after a specific timestamp.
    """
    if since:
        try:
            since_dt = datetime.fromisoformat(since.replace("Z", "+00:00"))
            changes = ingestion_service.get_changes_since(since_dt)
        except ValueError:
            raise HTTPException(status_code=400, detail="Invalid timestamp format. Use ISO format.")
    else:
        changes = ingestion_service.get_recent_changes(limit=limit)

    return ChangesResponse(
        changes=changes,
        total=len(changes)
    )


@router.post("/refresh")
async def force_refresh():
    """
    Force a refresh of market data from Polymarket API
    """
    events = await ingestion_service.fetch_and_process_markets()
    spike_count = sum(1 for e in events if e.volumeSpike is not None)

    return {
        "status": "success",
        "events_fetched": len(events),
        "spike_events": spike_count
    }


# News scraping models and endpoints
class NewsScrapeRequest(BaseModel):
    """Request model for news scraping."""
    query: str
    max_items: int = 10
    language: str = "US:en"
    time_range: str = "1h"
    fetch_article_details: bool = True


class NewsScrapeResponse(BaseModel):
    """Response model for news scraping."""
    status: str
    query: str
    item_count: int
    items: List[Dict[str, Any]]


@router.post("/news/scrape", response_model=NewsScrapeResponse)
async def scrape_news(request: NewsScrapeRequest):
    """
    Scrape Google News using Apify's Google News scraper
    
    This endpoint allows you to search for news articles related to specific topics,
    which can be useful for getting context around Polymarket events.
    """
    try:
        items = await apify_service.scrape_google_news(
            query=request.query,
            max_items=request.max_items,
            language=request.language,
            time_range=request.time_range,
            fetch_article_details=request.fetch_article_details
        )
        
        return NewsScrapeResponse(
            status="success",
            query=request.query,
            item_count=len(items),
            items=items
        )
        
    except Exception as e:
        raise HTTPException(
            status_code=500,
            detail=f"Failed to scrape news: {str(e)}"
        )


@router.get("/news/scrape")
async def scrape_news_get(
    query: str = Query(..., description="Search query for news"),
    max_items: int = Query(10, ge=1, le=50, description="Maximum number of articles"),
    language: str = Query("US:en", description="Language and region"),
    time_range: str = Query("1h", description="Time range (1h, 1d, 1w)"),
    fetch_article_details: bool = Query(True, description="Fetch full article content")
):
    """
    Scrape Google News using GET method (alternative to POST)
    """
    try:
        items = await apify_service.scrape_google_news(
            query=query,
            max_items=max_items,
            language=language,
            time_range=time_range,
            fetch_article_details=fetch_article_details
        )
        
        return {
            "status": "success",
            "query": query,
            "item_count": len(items),
            "items": items
        }
        
    except Exception as e:
        raise HTTPException(
            status_code=500,
            detail=f"Failed to scrape news: {str(e)}"
        )


# Dynamic routes with {event_id} must come AFTER specific routes
@router.get("/events/{event_id}/tickers", response_model=list[TickerSuggestion])
async def get_event_tickers(event_id: str):
    """
    Get GPT-mapped stock ticker suggestions for an event

    Uses GPT-4o-mini to analyze the event and suggest 8 stock tickers
    that would be most affected if the event were to occur.

    Returns tickers ranked by impact score (confidence).
    """
    # Get the event
    event = ingestion_service.events.get(event_id)

    if not event:
        raise HTTPException(status_code=404, detail=f"Event {event_id} not found")

    # Get ticker suggestions from GPT
    tickers = await asset_mapper_service.get_tickers(event)

    return tickers


@router.get("/events/{event_id}", response_model=PolymarketEvent)
async def get_event(event_id: str):
    """
    Get a specific event by ID
    """
    event = ingestion_service.events.get(event_id)

    if not event:
        raise HTTPException(status_code=404, detail=f"Event {event_id} not found")

    return event


@router.post("/events/{event_id}/lock")
async def toggle_event_lock(event_id: str):
    """
    Toggle lock state for an event
    """
    event = ingestion_service.events.get(event_id)

    if not event:
        raise HTTPException(status_code=404, detail=f"Event {event_id} not found")

    event.locked = not event.locked

    return {"id": event_id, "locked": event.locked}


@router.get("/events/{event_id}/detail")
async def get_event_detail(
    event_id: str,
    include_news: bool = Query(True, description="Include news articles"),
    news_max_items: int = Query(6, ge=1, le=20, description="Maximum news articles"),
    news_time_range: str = Query("1d", description="News time range (1h, 1d, 1w)")
):
    """
    Get detailed analysis for a specific event including news articles.
    
    This endpoint triggers the orchestrator to fetch news articles and other
    analysis for the specified Polymarket event.
    """
    # Get the event
    event = ingestion_service.events.get(event_id)
    
    if not event:
        raise HTTPException(status_code=404, detail=f"Event {event_id} not found")
    
    try:
        # Trigger orchestration
        result = await orchestrator_service.orchestrate_event_detail(
            event=event,
            include_news=include_news,
            news_max_items=news_max_items,
            news_time_range=news_time_range
        )
        
        return result
        
    except Exception as e:
        raise HTTPException(
            status_code=500,
            detail=f"Failed to analyze event: {str(e)}"
        )


@router.get("/events/{event_id}/news")
async def get_event_news(
    event_id: str,
    max_items: int = Query(6, ge=1, le=20, description="Maximum news articles"),
    time_range: str = Query("1d", description="Time range (1h, 1d, 1w)")
):
    """
    Get news articles for a specific event.
    """
    # Get the event
    event = ingestion_service.events.get(event_id)
    
    if not event:
        raise HTTPException(status_code=404, detail=f"Event {event_id} not found")
    
    try:
        # Get news for the event
        news = await orchestrator_service.get_event_news(
            event=event,
            max_items=max_items,
            time_range=time_range
        )
        
        return {
            "event_id": event_id,
            "event_title": event.title,
            "news_count": len(news),
            "news": news
        }
        
    except Exception as e:
        raise HTTPException(
            status_code=500,
            detail=f"Failed to fetch news: {str(e)}"
        )