"""HTTP routes for frontier feed, event actions, and orchestrator triggers."""

from fastapi import APIRouter, HTTPException, Query
from typing import Optional
from datetime import datetime
import os
import httpx
from pydantic import BaseModel

from models import EventListResponse, PolymarketEvent, ChangesResponse, TickerSuggestion, PriceHistoryResponse
from services.ingestion import ingestion_service
from services.asset_mapper import asset_mapper_service
from services.price_history import price_history_client
from services.apify_news import apify_news_service

router = APIRouter()

# Senso.ai configuration
SENSO_API_KEY = os.getenv("SENSO_API_KEY")
SENSO_ORG_ID = os.getenv("SENSO_ORG_ID")

class ChatRequest(BaseModel):
    message: str


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


# Dynamic routes with {event_id} must come AFTER specific routes
@router.get("/events/{event_id}/tickers", response_model=list[TickerSuggestion])
async def get_event_tickers(event_id: str):
    """
    Get GPT-mapped stock ticker suggestions for an event

    Uses GPT-5-mini to analyze the event and suggest 8 stock tickers
    that would be most affected if the event were to occur.

    Returns tickers ranked by impact score (confidence).
    """
    import logging
    logger = logging.getLogger(__name__)

    logger.info(f"[API] GET /api/events/{event_id}/tickers - Request received")

    # Get the event
    event = ingestion_service.events.get(event_id)

    if not event:
        logger.warning(f"[API] Event not found: {event_id}")
        raise HTTPException(status_code=404, detail=f"Event {event_id} not found")

    logger.info(f"[API] Event found: {event.title[:60]}")
    logger.info(f"[API] Calling GPT-5-mini for ticker suggestions...")

    # Get ticker suggestions from GPT
    tickers = await asset_mapper_service.get_tickers(event)

    logger.info(f"[API] Returning {len(tickers)} tickers")

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


@router.get("/events/{event_id}/price-history", response_model=PriceHistoryResponse)
async def get_event_price_history(
    event_id: str,
    interval: str = Query("1d", regex="^(1h|1d|1w|1m|max)$", description="Time interval for price history"),
    outcome_index: int = Query(0, ge=0, description="Index of outcome/candidate to fetch (0 = first outcome)")
):
    """
    Get price history for an event from Polymarket CLOB API

    Returns historical probability data (price = probability 0-1) for the market.
    For multi-outcome markets (elections, etc.), specify which outcome to fetch.

    Args:
        event_id: The event ID
        interval: Time interval - valid values: '1h', '1d', '1w', '1m', 'max'
        outcome_index: Which outcome to fetch (0 = first, 1 = second, etc.)

    Returns:
        Price history with timestamps and probabilities
    """
    import logging
    logger = logging.getLogger(__name__)

    logger.info(f"[API] GET /api/events/{event_id}/price-history?interval={interval}&outcome_index={outcome_index}")

    # Get the event
    event = ingestion_service.events.get(event_id)

    if not event:
        logger.warning(f"[API] Event not found: {event_id}")
        raise HTTPException(status_code=404, detail=f"Event {event_id} not found")

    # Check if event has CLOB token IDs
    if not event.clobTokenIds or len(event.clobTokenIds) == 0:
        logger.warning(f"[API] Event {event_id} has no CLOB token IDs")
        raise HTTPException(
            status_code=400,
            detail="This event does not have price history data available"
        )

    # Validate outcome index
    if outcome_index >= len(event.clobTokenIds):
        logger.warning(f"[API] Invalid outcome_index {outcome_index} for event with {len(event.clobTokenIds)} outcomes")
        raise HTTPException(
            status_code=400,
            detail=f"Invalid outcome index. Market has {len(event.clobTokenIds)} outcomes (0-{len(event.clobTokenIds)-1})"
        )

    # Use specified outcome's token ID
    clob_token_id = event.clobTokenIds[outcome_index]
    outcome_name = event.outcomes[outcome_index] if outcome_index < len(event.outcomes) else f"Outcome {outcome_index}"
    logger.info(f"[API] Fetching price history for '{outcome_name}' (token: {clob_token_id})")

    # Fetch price history from CLOB API
    price_history = await price_history_client.get_price_history(
        market=clob_token_id,
        interval=interval
    )

    if not price_history:
        logger.error(f"[API] Failed to fetch price history for token {clob_token_id}")
        raise HTTPException(
            status_code=502,
            detail="Failed to fetch price history from Polymarket"
        )

    logger.info(f"[API] Returning {len(price_history.history)} price points for '{outcome_name}'")
    return price_history


@router.post("/chat")
async def chat_with_senso(request: ChatRequest):
    """
    Simple AI chat endpoint powered by Senso.ai

    Sends user messages to Senso.ai and returns AI responses.
    """
    import logging
    logger = logging.getLogger(__name__)

    if not SENSO_API_KEY:
        raise HTTPException(status_code=500, detail="Senso API key not configured")

    try:
        async with httpx.AsyncClient() as client:
            response = await client.post(
                "https://sdk.senso.ai/api/v1/search",
                headers={
                    "X-API-Key": SENSO_API_KEY,
                    "Content-Type": "application/json"
                },
                json={
                    "query": request.message,
                    "max_results": 5
                },
                timeout=30.0
            )

            if response.status_code != 200:
                logger.error(f"Senso API error: {response.status_code} - {response.text}")
                raise HTTPException(status_code=502, detail="Failed to get response from Senso.ai")

            data = response.json()
            return {"answer": data.get("answer", "Sorry, I couldn't process that.")}

    except httpx.TimeoutException:
        raise HTTPException(status_code=504, detail="Request to Senso.ai timed out")
    except Exception as e:
        logger.error(f"Error calling Senso.ai: {str(e)}")
        raise HTTPException(status_code=500, detail="Internal server error")


# Apify News Scraping Routes
class NewsScrapeRequest(BaseModel):
    query: str = "Tesla"
    max_items: int = 10
    language: str = "US:en"
    time_range: str = "1h"
    fetch_details: bool = True
    actor_id: Optional[str] = None


@router.post("/apify/news")
async def scrape_news(request: NewsScrapeRequest):
    """
    Scrape news using Apify Google News scraper
    
    Scrapes Google News for the given query and returns news articles
    with optional full article details.
    """
    import logging
    logger = logging.getLogger(__name__)
    
    logger.info(f"[API] POST /api/apify/news - Query: {request.query}")
    
    try:
        result = await apify_news_service.scrape_news(
            query=request.query,
            max_items=request.max_items,
            language=request.language,
            time_range=request.time_range,
            fetch_details=request.fetch_details,
            actor_id=request.actor_id
        )
        
        logger.info(f"[API] News scrape completed - {result['itemCount']} items found")
        return result
        
    except Exception as e:
        logger.error(f"[API] News scrape failed: {str(e)}")
        raise HTTPException(status_code=500, detail=f"News scraping failed: {str(e)}")


@router.get("/apify/news/health")
async def apify_health():
    """
    Health check for Apify news service
    """
    try:
        # Simple health check - just verify we can get the token
        token = os.getenv('APIFY_TOKEN')
        if not token:
            return {"status": "error", "message": "APIFY_TOKEN not configured"}
        
        return {"status": "ok", "message": "Apify news service ready"}
    except Exception as e:
        return {"status": "error", "message": str(e)}
