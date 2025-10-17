"""Quick test script to verify GPT ticker mapping works"""

import asyncio
import os
from dotenv import load_dotenv

# Load .env
load_dotenv()

from services.asset_mapper import asset_mapper_service
from models import PolymarketEvent

async def test_ticker_mapping():
    # Create a sample event
    test_event = PolymarketEvent(
        id="test_001",
        title="Will Bitcoin reach $100,000 by end of 2025?",
        description="This market resolves YES if Bitcoin (BTC) trades at or above $100,000 USD on any major exchange before December 31, 2025.",
        probability=0.62,
        volume24hr=2_400_000,
        oneDayPriceChange=0.08,
        liquidityNum=8_500_000,
    )

    print(f"\n{'='*80}")
    print(f"Testing GPT-5 mini ticker mapping")
    print(f"{'='*80}")
    print(f"\nEvent: {test_event.title}")
    print(f"Probability: {test_event.probability:.0%}")
    print(f"24h Volume: ${test_event.volume24hr:,.0f}")
    print(f"\nCalling GPT-5 mini via OpenRouter...\n")

    # Get ticker suggestions
    tickers = await asset_mapper_service.get_tickers(test_event, use_cache=False)

    if not tickers:
        print("❌ No tickers returned - check API key and logs")
        return

    print(f"✅ Successfully received {len(tickers)} tickers:\n")

    for i, ticker in enumerate(tickers, 1):
        print(f"{i}. {ticker.symbol} ({ticker.name})")
        print(f"   Impact: {ticker.confidence:.0%} | Direction: {ticker.direction}")
        print(f"   Rationale: {ticker.rationale}")
        print()

    print(f"{'='*80}")
    print("✅ Ticker mapping test complete!")
    print(f"{'='*80}\n")

if __name__ == "__main__":
    asyncio.run(test_ticker_mapping())
