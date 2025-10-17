"""Polymarket poller and frontier scoring loop with volume spike detection."""

import asyncio
import httpx
from typing import List, Dict, Optional
from datetime import datetime
import logging

from models import PolymarketEvent

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
    - A spike is detected when 24hr volume > 1.5x average daily volume
    - This means today's volume is 50% higher than normal
    """

    # Volume spike threshold: 50% increase over average
    VOLUME_SPIKE_THRESHOLD = 1.5

    def __init__(self):
        self.client = GammaMarketClient()
        self.events: Dict[str, PolymarketEvent] = {}
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
            outcome_prices = market_data.get("outcomePrices", "0,0")
            if isinstance(outcome_prices, str):
                prices = [float(p) for p in outcome_prices.split(",")]
            else:
                prices = outcome_prices

            # Use first outcome price as probability
            probability = prices[0] if prices else 0.5

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

    async def fetch_and_process_markets(self) -> List[PolymarketEvent]:
        """
        Fetch markets from API and process them

        Returns:
            List of processed PolymarketEvent objects
        """
        # Fetch markets sorted by 24hr volume (highest first)
        markets = await self.client.get_markets(
            limit=100,
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

        logger.info(f"Processed {len(events)} events")
        return events

    def get_frontier_events(
        self,
        limit: int = 20,
        spike_only: bool = False
    ) -> List[PolymarketEvent]:
        """
        Get frontier events (most interesting markets)

        Args:
            limit: Maximum number of events to return
            spike_only: If True, only return events with volume spikes

        Returns:
            List of frontier events sorted by interest score
        """
        events = list(self.events.values())

        if spike_only:
            events = [e for e in events if e.volumeSpike is not None]

        # Sort by volume spike ratio (highest first), then by volume
        events.sort(
            key=lambda e: (
                e.volumeSpike if e.volumeSpike else 0,
                e.volume24hr
            ),
            reverse=True
        )

        return events[:limit]

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
