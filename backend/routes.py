"""HTTP routes for frontier feed, event actions, and orchestrator triggers."""

from fastapi import APIRouter, HTTPException, Query
from typing import Optional

from models import EventListResponse, PolymarketEvent
from services.ingestion import ingestion_service

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
