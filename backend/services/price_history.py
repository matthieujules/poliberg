"""Service for fetching price history from Polymarket CLOB API."""

import httpx
from typing import List, Optional
import logging

from models import PriceHistoryPoint, PriceHistoryResponse

logging.basicConfig(level=logging.INFO)
logger = logging.getLogger(__name__)


class PriceHistoryClient:
    """Client for Polymarket CLOB Price History API"""

    BASE_URL = "https://clob.polymarket.com"

    def __init__(self):
        self.client = httpx.AsyncClient(timeout=30.0)

    async def get_price_history(
        self,
        market: str,
        interval: str = "1d"
    ) -> Optional[PriceHistoryResponse]:
        """
        Fetch price history for a specific CLOB token

        Args:
            market: CLOB token ID (from clobTokenIds array)
            interval: Time interval - valid values: '1h', '1d', '1w', '1m', 'max'

        Returns:
            PriceHistoryResponse with history data, or None if error
        """
        url = f"{self.BASE_URL}/prices-history"
        params = {
            "market": market,
            "interval": interval
        }

        try:
            logger.info(f"Fetching price history for market {market} (interval: {interval})")
            response = await self.client.get(url, params=params)
            response.raise_for_status()

            data = response.json()
            history_data = data.get("history", [])

            # Convert to PriceHistoryPoint objects
            history = [
                PriceHistoryPoint(t=point["t"], p=point["p"])
                for point in history_data
            ]

            logger.info(f"Fetched {len(history)} price points for market {market}")

            return PriceHistoryResponse(
                history=history,
                interval=interval,
                market=market
            )

        except httpx.HTTPStatusError as e:
            logger.error(f"HTTP error fetching price history: {e.response.status_code} - {e.response.text}")
            return None
        except httpx.HTTPError as e:
            logger.error(f"Error fetching price history: {e}")
            return None
        except Exception as e:
            logger.error(f"Unexpected error fetching price history: {e}")
            return None

    async def close(self):
        """Close the HTTP client"""
        await self.client.aclose()


# Global instance
price_history_client = PriceHistoryClient()
