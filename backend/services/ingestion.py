"""Polymarket poller and frontier scoring loop with volume spike detection."""

import asyncio
import httpx
from typing import List, Dict, Optional
from datetime import datetime, timezone
from collections import deque
import logging

from models import PolymarketEvent, EventChange

logging.basicConfig(level=logging.INFO)
logger = logging.getLogger(__name__)


class GammaMarketClient:
    """Client for Polymarket Gamma Markets API"""

    BASE_URL = "https://gamma-api.polymarket.com"

    def __init__(self):
        self.client = httpx.AsyncClient(timeout=30.0)

    async def get_markets(
        self,
        limit: int = 100,
        active: bool = True,
        closed: bool = False,
        archived: bool = False,
        order: str = "volume24hr",
        ascending: bool = False,
    ) -> List[Dict]:
        """
        Fetch markets from Gamma API

        Args:
            limit: Number of markets to fetch
            active: Filter for active markets
            closed: Filter for closed markets
            archived: Filter for archived markets
            order: Field to order by (e.g., 'volume24hr', 'liquidityNum')
            ascending: Sort order (False = descending)

        Returns:
            List of market dictionaries
        """
        url = f"{self.BASE_URL}/markets"
        params = {
            "limit": limit,
            "active": active,
            "closed": closed,
            "archived": archived,
            "order": order,
            "ascending": str(ascending).lower(),
        }

        try:
            response = await self.client.get(url, params=params)
            response.raise_for_status()
            markets = response.json()
            logger.info(f"Fetched {len(markets)} markets from Gamma API")
            return markets
        except httpx.HTTPError as e:
            logger.error(f"Error fetching markets: {e}")
            return []

    async def close(self):
        """Close the HTTP client"""
        await self.client.aclose()


class IngestionService:
    """
    Service for ingesting Polymarket markets and detecting volume spikes

    Volume Spike Detection Logic:
    - Compares 24hr volume to average daily volume from weekly data
    - A spike is detected when 24hr volume > 1.3x average daily volume
    - This means today's volume is 30% higher than normal (more sensitive)
    """

    # Volume spike threshold: 30% increase over average (lowered for more dynamic feed)
    VOLUME_SPIKE_THRESHOLD = 1.3

    # Change detection threshold: 5% increase/decrease (more sensitive)
    SPIKE_CHANGE_THRESHOLD = 0.05

    # Maximum changes to keep in history
    MAX_CHANGES = 100

    def __init__(self):
        self.client = GammaMarketClient()
        self.events: Dict[str, PolymarketEvent] = {}
        self.previous_spikes: Dict[str, float] = {}  # event_id -> previous spike ratio
        self.changes: deque[EventChange] = deque(maxlen=self.MAX_CHANGES)  # Rolling log
        self.running = False

    def calculate_volume_spike(
        self,
        volume24hr: float,
        volume1wk: float
    ) -> Optional[float]:
        """
        Calculate if there's a volume spike

        Args:
            volume24hr: 24-hour trading volume
            volume1wk: 7-day trading volume

        Returns:
            Spike ratio if spike detected, None otherwise
            Example: 2.0 means today's volume is 2x the daily average
        """
        if volume1wk <= 0:
            return None

        # Calculate average daily volume from weekly volume
        avg_daily_volume = volume1wk / 7

        if avg_daily_volume <= 0:
            return None

        # Calculate ratio
        ratio = volume24hr / avg_daily_volume

        # Check if it's a spike
        if ratio >= self.VOLUME_SPIKE_THRESHOLD:
            return ratio

        return None

    def process_market(self, market_data: Dict) -> Optional[PolymarketEvent]:
        """
        Process a single market and detect volume spikes

        Args:
            market_data: Raw market data from Gamma API

        Returns:
            PolymarketEvent if market is valid and interesting, None otherwise
        """
        try:
            # Calculate volume spike
            volume_spike = self.calculate_volume_spike(
                market_data.get("volume24hr", 0),
                market_data.get("volume1wk", 0)
            )

            # Extract outcome prices to calculate probability
            import json
            outcome_prices = market_data.get("outcomePrices", "[]")

            # Parse JSON array string
            if isinstance(outcome_prices, str):
                try:
                    prices = json.loads(outcome_prices)
                except json.JSONDecodeError:
                    # Fallback to comma-separated parsing
                    prices = [float(p.strip()) for p in outcome_prices.split(",") if p.strip()]
            else:
                prices = outcome_prices

            # Use first outcome price as probability
            probability = float(prices[0]) if prices else 0.5

            # Create event object
            event_data = {
                "id": market_data.get("id", ""),
                "question": market_data.get("question", ""),
                "description": market_data.get("description", ""),
                "probability": probability,
                "volume24hr": market_data.get("volume24hr", 0),
                "volume1wk": market_data.get("volume1wk", 0),
                "volume1mo": market_data.get("volume1mo", 0),
                "volume1yr": market_data.get("volume1yr", 0),
                "oneHourPriceChange": market_data.get("oneHourPriceChange"),
                "oneDayPriceChange": market_data.get("oneDayPriceChange"),
                "oneWeekPriceChange": market_data.get("oneWeekPriceChange"),
                "active": market_data.get("active", True),
                "closed": market_data.get("closed", False),
                "archived": market_data.get("archived", False),
                "lastTradePrice": market_data.get("lastTradePrice"),
                "bestBid": market_data.get("bestBid"),
                "bestAsk": market_data.get("bestAsk"),
                "liquidityNum": market_data.get("liquidityNum", 0),
                "slug": market_data.get("slug", ""),
                "marketUrl": f"https://polymarket.com/event/{market_data.get('slug', '')}",
                "end_date_iso": market_data.get("end_date_iso"),
                "volumeSpike": volume_spike,
            }

            event = PolymarketEvent(**event_data)
            return event

        except Exception as e:
            logger.warning(f"Failed to process market: {e}")
            return None

    def detect_changes(self, new_events: List[PolymarketEvent]) -> List[EventChange]:
        """
        Detect changes between previous poll and current poll

        Args:
            new_events: Newly processed events

        Returns:
            List of EventChange objects describing what changed
        """
        changes = []
        now = datetime.now(timezone.utc)  # Use UTC timezone-aware datetime

        for event in new_events:
            event_id = event.id
            new_spike = event.volumeSpike
            old_spike = self.previous_spikes.get(event_id)

            # Determine change type
            change_type = None

            if old_spike is None and new_spike is not None:
                # NEW spike detected
                change_type = "new_spike"
                logger.info(f"🆕 NEW SPIKE: {event.title[:50]}... ({new_spike:.1f}x)")

            elif old_spike is not None and new_spike is not None:
                # Spike exists, check if it changed (using lower 5% threshold for more dynamic feed)
                if new_spike > old_spike * (1 + self.SPIKE_CHANGE_THRESHOLD):  # 5% increase threshold
                    change_type = "spike_increased"
                    logger.info(f"📈 SPIKE INCREASED: {event.title[:50]}... ({old_spike:.1f}x → {new_spike:.1f}x)")
                elif new_spike < old_spike * (1 - self.SPIKE_CHANGE_THRESHOLD):  # 5% decrease threshold
                    change_type = "spike_decreased"
                    logger.info(f"📉 SPIKE DECREASED: {event.title[:50]}... ({old_spike:.1f}x → {new_spike:.1f}x)")

            elif old_spike is not None and new_spike is None:
                # Spike was removed (fell below threshold)
                change_type = "spike_removed"
                logger.info(f"❌ SPIKE REMOVED: {event.title[:50]}... (was {old_spike:.1f}x)")

            # Record change if detected
            if change_type:
                change = EventChange(
                    eventId=event_id,
                    eventTitle=event.title,
                    changeType=change_type,
                    timestamp=now,
                    oldSpikeRatio=old_spike,
                    newSpikeRatio=new_spike,
                    volume24hr=event.volume24hr,
                    probability=event.probability
                )
                changes.append(change)
                self.changes.append(change)

                # ACTIVITY FEED LOGIC: Bump timestamp for new/increased spikes
                # This pushes the event to the top of the feed
                if change_type in ["new_spike", "spike_increased"]:
                    event.detectedAt = now
                    logger.info(f"   ⏰ Bumped timestamp for: {event.title[:50]}...")

            # Update previous state
            if new_spike is not None:
                self.previous_spikes[event_id] = new_spike
            elif event_id in self.previous_spikes:
                # Remove from tracking if spike is gone
                del self.previous_spikes[event_id]

        return changes

    async def fetch_and_process_markets(self) -> List[PolymarketEvent]:
        """
        Fetch markets from API and process them

        Returns:
            List of processed PolymarketEvent objects
        """
        # Fetch markets sorted by 24hr volume (highest first)
        # Monitoring top 500 most active markets
        markets = await self.client.get_markets(
            limit=500,
            active=True,
            closed=False,
            archived=False,
            order="volume24hr",
            ascending=False,
        )

        # Process each market
        events = []
        for market_data in markets:
            event = self.process_market(market_data)
            if event:
                events.append(event)
                self.events[event.id] = event

        # Detect changes from previous poll
        changes = self.detect_changes(events)

        logger.info(
            f"Processed {len(events)} events, "
            f"detected {len(changes)} changes"
        )

        return events

    def get_frontier_events(
        self,
        limit: int = 20,
        spike_only: bool = False
    ) -> List[PolymarketEvent]:
        """
        Get frontier events (most interesting markets)

        ACTIVITY FEED LOGIC:
        - Events are sorted by most recent spike activity (detectedAt)
        - When a market gets a new spike or spike increase, its timestamp is updated
        - This creates a chronological feed where new spikes bubble to the top
        - Old spikes naturally age down the list without new activity

        Args:
            limit: Maximum number of events to return
            spike_only: If True, only return events with volume spikes

        Returns:
            List of frontier events sorted by recent activity (most recent first)
        """
        events = list(self.events.values())

        if spike_only:
            events = [e for e in events if e.volumeSpike is not None]

        # Sort by activity recency (most recent spike activity first)
        # Tiebreaker: if same timestamp, sort by spike ratio then volume
        events.sort(
            key=lambda e: (
                e.detectedAt,                        # Primary: Most recent activity
                e.volumeSpike if e.volumeSpike else 0,  # Tiebreaker: Highest spike
                e.volume24hr                         # Tiebreaker: Highest volume
            ),
            reverse=True
        )

        return events[:limit]

    def get_recent_changes(self, limit: int = 50) -> List[EventChange]:
        """
        Get recent changes detected in polling

        Args:
            limit: Maximum number of changes to return

        Returns:
            List of EventChange objects (most recent first)
        """
        # Convert deque to list and reverse (most recent first)
        changes_list = list(self.changes)
        changes_list.reverse()
        return changes_list[:limit]

    def get_changes_since(self, since: datetime) -> List[EventChange]:
        """
        Get changes since a specific timestamp

        Args:
            since: Timestamp to filter from

        Returns:
            List of EventChange objects after the timestamp
        """
        changes_list = [
            change for change in self.changes
            if change.timestamp > since
        ]
        # Most recent first
        changes_list.reverse()
        return changes_list

    async def start_polling(self, interval: int = 60):
        """
        Start polling Polymarket API at regular intervals

        Args:
            interval: Seconds between polls (default: 60)
        """
        self.running = True
        logger.info(f"Starting Polymarket polling (interval: {interval}s)")

        while self.running:
            try:
                await self.fetch_and_process_markets()
                spike_count = sum(1 for e in self.events.values() if e.volumeSpike)
                logger.info(
                    f"Current events: {len(self.events)}, "
                    f"Volume spikes: {spike_count}"
                )
            except Exception as e:
                logger.error(f"Error in polling loop: {e}")

            await asyncio.sleep(interval)

    async def stop_polling(self):
        """Stop the polling loop"""
        self.running = False
        await self.client.close()
        logger.info("Polling stopped")


# Global instance
ingestion_service = IngestionService()
