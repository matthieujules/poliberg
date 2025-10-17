"""GPT-powered mapping from frontier event context to relevant tickers."""

import os
import logging
from typing import List, Optional
from openai import AsyncOpenAI
import json

from models import PolymarketEvent, TickerSuggestion

logging.basicConfig(level=logging.INFO)
logger = logging.getLogger(__name__)


class AssetMapperService:
    """
    Maps Polymarket events to relevant stock tickers using GPT-4o-mini

    Uses structured outputs to ensure reliable JSON parsing with:
    - 8 stock tickers per event
    - Impact score (0-1) indicating strength of correlation
    - Direction (bullish/bearish/neutral)
    - Clear rationale for each ticker
    """

    def __init__(self):
        api_key = os.getenv("OPENROUTER_API_KEY")
        if not api_key:
            logger.warning("OPENROUTER_API_KEY not set - ticker mapping will be disabled")
            self.client = None
        else:
            # Use OpenRouter API endpoint
            self.client = AsyncOpenAI(
                api_key=api_key,
                base_url="https://openrouter.ai/api/v1"
            )
            logger.info("Asset mapper initialized with OpenRouter API")

        # Simple in-memory cache: event_id -> tickers
        self.cache: dict[str, List[TickerSuggestion]] = {}

    def _build_system_prompt(self) -> str:
        """Build the system prompt for GPT"""
        return """You are a financial analyst specializing in identifying market correlations between prediction market events and publicly traded stocks.

Your task is to analyze Polymarket prediction market events and identify exactly 8 publicly traded stocks that would be most affected if the event were to occur.

Guidelines:
- Focus on DIRECT correlations (e.g., "Fed rate cut" → banking stocks, "OpenAI releases GPT-5" → MSFT)
- Include INDIRECT effects (e.g., "Oil prices spike" → airlines bearish, oil companies bullish)
- Impact score (0-1) reflects strength of correlation, NOT probability of event occurring
- Direction is relative to the event resolving YES:
  * bullish = stock price would likely go UP if event happens
  * bearish = stock price would likely go DOWN if event happens
  * neutral = significant impact but direction unclear
- Prioritize liquid, well-known stocks (avoid penny stocks or obscure tickers)
- Return exactly 8 tickers, ranked by impact score (highest first)
- Keep rationale clear and concise (1-2 sentences max)

Output JSON format:
{
  "tickers": [
    {
      "symbol": "NVDA",
      "name": "NVIDIA Corporation",
      "rationale": "Brief explanation of impact",
      "impactScore": 0.85,
      "direction": "bullish",
      "relatedTags": ["ai", "semiconductors"]
    }
  ]
}"""

    def _build_user_prompt(self, event: PolymarketEvent) -> str:
        """Build the user prompt with event context"""
        return f"""Analyze this prediction market event and identify 8 stock tickers:

**Event Title:** {event.title}

**Description:** {event.description}

**Current Probability:** {event.probability:.0%} chance of YES

**Market Activity:**
- 24h Volume: ${event.volume24hr:,.0f}
- 24h Price Change: {(event.oneDayPriceChange or 0) * 100:+.1f}%
- Current Liquidity: ${event.liquidityNum:,.0f}

For each ticker, provide:
1. Stock symbol (e.g., "AAPL")
2. Company name
3. Rationale (why this stock is affected)
4. Impact score (0-1, how strongly this event affects the stock)
5. Direction (bullish/bearish/neutral if event resolves YES)
6. Related tags from the event context

Return exactly 8 tickers as JSON."""

    async def get_tickers(
        self,
        event: PolymarketEvent,
        use_cache: bool = True
    ) -> List[TickerSuggestion]:
        """
        Get stock ticker suggestions for a Polymarket event

        Args:
            event: The Polymarket event to analyze
            use_cache: Whether to use cached results (default: True)

        Returns:
            List of 8 TickerSuggestion objects, ranked by impact score
        """
        # Check cache first
        if use_cache and event.id in self.cache:
            logger.info(f"Using cached tickers for event: {event.id}")
            return self.cache[event.id]

        # Check if OpenAI is configured
        if not self.client:
            logger.warning("OpenAI not configured, returning empty ticker list")
            return []

        try:
            # Use environment variable for model selection, default to gpt-5-mini
            model = os.getenv("OPENROUTER_MODEL", "openai/gpt-5-mini")

            logger.info(f"Requesting ticker suggestions from {model} for: {event.title[:60]}...")

            # Call GPT with JSON mode
            response = await self.client.chat.completions.create(
                model=model,
                messages=[
                    {"role": "system", "content": self._build_system_prompt()},
                    {"role": "user", "content": self._build_user_prompt(event)}
                ],
                response_format={"type": "json_object"},
                temperature=0.7,  # Some creativity but mostly deterministic
                max_tokens=2000,
            )

            # Parse response
            content = response.choices[0].message.content
            if not content:
                raise ValueError("Empty response from GPT")

            data = json.loads(content)

            if "tickers" not in data:
                raise ValueError("Response missing 'tickers' field")

            # Convert to TickerSuggestion objects
            tickers = []
            for ticker_data in data["tickers"]:
                # Validate required fields
                if not all(k in ticker_data for k in ["symbol", "name", "rationale", "impactScore", "direction"]):
                    logger.warning(f"Skipping malformed ticker: {ticker_data}")
                    continue

                # Clamp impact score to [0, 1]
                impact_score = max(0.0, min(1.0, float(ticker_data["impactScore"])))

                # Validate direction
                direction = ticker_data["direction"].lower()
                if direction not in ["bullish", "bearish", "neutral"]:
                    logger.warning(f"Invalid direction '{direction}', defaulting to neutral")
                    direction = "neutral"

                ticker = TickerSuggestion(
                    symbol=ticker_data["symbol"].upper(),
                    name=ticker_data["name"],
                    rationale=ticker_data["rationale"],
                    confidence=impact_score,  # Map impactScore to confidence
                    direction=direction,
                    relatedTags=ticker_data.get("relatedTags", [])
                )
                tickers.append(ticker)

            # Ensure exactly 8 tickers (pad or trim if needed)
            if len(tickers) < 8:
                logger.warning(f"GPT returned only {len(tickers)} tickers, expected 8")
            elif len(tickers) > 8:
                tickers = tickers[:8]

            # Sort by confidence descending
            tickers.sort(key=lambda t: t.confidence, reverse=True)

            logger.info(
                f"Successfully mapped {len(tickers)} tickers for event {event.id}: " +
                ", ".join(f"{t.symbol} ({t.confidence:.2f})" for t in tickers[:3])
            )

            # Cache the result
            if use_cache:
                self.cache[event.id] = tickers

            return tickers

        except json.JSONDecodeError as e:
            logger.error(f"Failed to parse GPT JSON response: {e}")
            return []
        except Exception as e:
            logger.error(f"Error getting ticker suggestions: {e}")
            return []

    def clear_cache(self):
        """Clear the ticker cache"""
        self.cache.clear()
        logger.info("Ticker cache cleared")


# Global instance
asset_mapper_service = AssetMapperService()
