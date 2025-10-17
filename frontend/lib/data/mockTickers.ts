import { TickerSuggestion, PolymarketEvent } from "@/lib/types";

// Maps event categories and tags to relevant ticker suggestions
export const TICKER_MAPPINGS: Record<string, TickerSuggestion[]> = {
  crypto: [
    {
      symbol: "COIN",
      name: "Coinbase Global Inc.",
      rationale: "Leading cryptocurrency exchange directly benefits from increased crypto market activity and trading volumes.",
      confidence: 0.88,
      direction: "bullish",
      relatedTags: ["crypto", "bitcoin", "ethereum"],
    },
    {
      symbol: "MSTR",
      name: "MicroStrategy Inc.",
      rationale: "Holds significant Bitcoin reserves on balance sheet, stock price highly correlated with BTC movements.",
      confidence: 0.85,
      direction: "bullish",
      relatedTags: ["bitcoin", "crypto"],
    },
    {
      symbol: "RIOT",
      name: "Riot Platforms Inc.",
      rationale: "Bitcoin mining company with revenue directly tied to Bitcoin price and network activity.",
      confidence: 0.79,
      direction: "bullish",
      relatedTags: ["bitcoin", "crypto", "mining"],
    },
    {
      symbol: "MARA",
      name: "Marathon Digital Holdings",
      rationale: "One of the largest Bitcoin mining operations in North America, scales with BTC demand.",
      confidence: 0.77,
      direction: "bullish",
      relatedTags: ["bitcoin", "crypto", "mining"],
    },
    {
      symbol: "NVDA",
      name: "NVIDIA Corporation",
      rationale: "GPUs essential for crypto mining and blockchain operations, benefits from crypto bull markets.",
      confidence: 0.71,
      direction: "bullish",
      relatedTags: ["crypto", "ai", "semiconductors"],
    },
  ],
  politics: [
    {
      symbol: "LMT",
      name: "Lockheed Martin Corp.",
      rationale: "Defense contractor benefits from geopolitical tensions and increased defense spending.",
      confidence: 0.74,
      direction: "neutral",
      relatedTags: ["defense", "politics", "government"],
    },
    {
      symbol: "BA",
      name: "Boeing Company",
      rationale: "Major defense contractor and aerospace manufacturer affected by government contracts and policy.",
      confidence: 0.68,
      direction: "neutral",
      relatedTags: ["defense", "aerospace", "politics"],
    },
    {
      symbol: "GD",
      name: "General Dynamics Corp.",
      rationale: "Defense and aerospace contractor with significant government exposure.",
      confidence: 0.70,
      direction: "neutral",
      relatedTags: ["defense", "politics"],
    },
    {
      symbol: "NOC",
      name: "Northrop Grumman Corp.",
      rationale: "Defense technology company dependent on government spending and policy decisions.",
      confidence: 0.69,
      direction: "neutral",
      relatedTags: ["defense", "technology"],
    },
    {
      symbol: "JPM",
      name: "JPMorgan Chase & Co.",
      rationale: "Major bank highly sensitive to Federal Reserve policy and interest rate decisions.",
      confidence: 0.76,
      direction: "neutral",
      relatedTags: ["banking", "interest-rates", "economics"],
    },
    {
      symbol: "BAC",
      name: "Bank of America Corp.",
      rationale: "Banking sector performance closely tied to Fed policy and economic conditions.",
      confidence: 0.73,
      direction: "neutral",
      relatedTags: ["banking", "interest-rates", "economics"],
    },
  ],
  business: [
    {
      symbol: "TSLA",
      name: "Tesla Inc.",
      rationale: "Leading electric vehicle manufacturer with high volatility and market impact.",
      confidence: 0.90,
      direction: "bullish",
      relatedTags: ["ev", "tesla", "automotive"],
    },
    {
      symbol: "NVDA",
      name: "NVIDIA Corporation",
      rationale: "AI chip leader benefiting from exploding demand in machine learning and data centers.",
      confidence: 0.87,
      direction: "bullish",
      relatedTags: ["ai", "semiconductors", "nvidia"],
    },
    {
      symbol: "AAPL",
      name: "Apple Inc.",
      rationale: "Tech giant with major influence on consumer electronics and services markets.",
      confidence: 0.82,
      direction: "neutral",
      relatedTags: ["tech", "apple", "consumer"],
    },
    {
      symbol: "MSFT",
      name: "Microsoft Corporation",
      rationale: "Leading cloud and AI company, major OpenAI investor driving AI revolution.",
      confidence: 0.84,
      direction: "bullish",
      relatedTags: ["tech", "microsoft", "ai", "cloud"],
    },
    {
      symbol: "AMZN",
      name: "Amazon.com Inc.",
      rationale: "E-commerce and cloud computing giant with diverse business exposure.",
      confidence: 0.80,
      direction: "neutral",
      relatedTags: ["tech", "amazon", "cloud", "retail"],
    },
  ],
  tech: [
    {
      symbol: "NVDA",
      name: "NVIDIA Corporation",
      rationale: "Dominant AI chip manufacturer powering the machine learning revolution.",
      confidence: 0.92,
      direction: "bullish",
      relatedTags: ["ai", "semiconductors", "nvidia"],
    },
    {
      symbol: "MSFT",
      name: "Microsoft Corporation",
      rationale: "Major AI investor through OpenAI partnership, leading enterprise AI adoption.",
      confidence: 0.86,
      direction: "bullish",
      relatedTags: ["ai", "microsoft", "openai"],
    },
    {
      symbol: "GOOGL",
      name: "Alphabet Inc.",
      rationale: "Google parent company developing advanced AI models and competing in AI race.",
      confidence: 0.83,
      direction: "bullish",
      relatedTags: ["ai", "google", "search"],
    },
    {
      symbol: "AAPL",
      name: "Apple Inc.",
      rationale: "Consumer tech leader with potential to disrupt hardware market with innovations.",
      confidence: 0.85,
      direction: "neutral",
      relatedTags: ["apple", "iphone", "hardware"],
    },
    {
      symbol: "META",
      name: "Meta Platforms Inc.",
      rationale: "Social media giant investing heavily in AI and virtual reality technologies.",
      confidence: 0.78,
      direction: "neutral",
      relatedTags: ["social-media", "ai", "vr"],
    },
    {
      symbol: "AMD",
      name: "Advanced Micro Devices",
      rationale: "Semiconductor company competing in AI chip market with NVIDIA.",
      confidence: 0.80,
      direction: "bullish",
      relatedTags: ["semiconductors", "ai", "hardware"],
    },
  ],
  sports: [
    {
      symbol: "DIS",
      name: "Walt Disney Company",
      rationale: "Owns ESPN and major sports broadcasting rights, revenue tied to sports viewership.",
      confidence: 0.68,
      direction: "neutral",
      relatedTags: ["sports", "media", "entertainment"],
    },
    {
      symbol: "DKNG",
      name: "DraftKings Inc.",
      rationale: "Sports betting platform benefits from increased sports engagement and betting activity.",
      confidence: 0.82,
      direction: "bullish",
      relatedTags: ["sports", "betting", "gambling"],
    },
    {
      symbol: "PENN",
      name: "PENN Entertainment",
      rationale: "Gaming and sports betting company with exposure to sports outcomes.",
      confidence: 0.75,
      direction: "neutral",
      relatedTags: ["sports", "betting", "gambling"],
    },
    {
      symbol: "NKE",
      name: "Nike Inc.",
      rationale: "Leading sports apparel and footwear brand benefiting from major sports events.",
      confidence: 0.70,
      direction: "neutral",
      relatedTags: ["sports", "apparel", "retail"],
    },
  ],
  // Tag-specific mappings
  bitcoin: [
    {
      symbol: "COIN",
      name: "Coinbase Global Inc.",
      rationale: "Largest U.S. crypto exchange, Bitcoin trading makes up significant revenue.",
      confidence: 0.90,
      direction: "bullish",
      relatedTags: ["bitcoin", "crypto"],
    },
    {
      symbol: "MSTR",
      name: "MicroStrategy Inc.",
      rationale: "Corporate Bitcoin treasury holder with ~150K+ BTC, essentially a Bitcoin proxy.",
      confidence: 0.88,
      direction: "bullish",
      relatedTags: ["bitcoin"],
    },
  ],
  ethereum: [
    {
      symbol: "COIN",
      name: "Coinbase Global Inc.",
      rationale: "Benefits from Ethereum trading volumes and ETH staking services.",
      confidence: 0.85,
      direction: "bullish",
      relatedTags: ["ethereum", "crypto"],
    },
  ],
  tesla: [
    {
      symbol: "TSLA",
      name: "Tesla Inc.",
      rationale: "Direct exposure to company performance and stock price movements.",
      confidence: 0.95,
      direction: "bullish",
      relatedTags: ["tesla", "ev"],
    },
  ],
  apple: [
    {
      symbol: "AAPL",
      name: "Apple Inc.",
      rationale: "Direct exposure to Apple product announcements and innovation.",
      confidence: 0.95,
      direction: "bullish",
      relatedTags: ["apple", "iphone"],
    },
  ],
  openai: [
    {
      symbol: "MSFT",
      name: "Microsoft Corporation",
      rationale: "Major OpenAI investor and exclusive cloud provider, benefits from OpenAI success.",
      confidence: 0.91,
      direction: "bullish",
      relatedTags: ["openai", "ai"],
    },
  ],
  ai: [
    {
      symbol: "NVDA",
      name: "NVIDIA Corporation",
      rationale: "Provides GPUs essential for AI training and inference workloads.",
      confidence: 0.93,
      direction: "bullish",
      relatedTags: ["ai", "semiconductors"],
    },
    {
      symbol: "MSFT",
      name: "Microsoft Corporation",
      rationale: "Leading enterprise AI adoption through Azure and Copilot products.",
      confidence: 0.87,
      direction: "bullish",
      relatedTags: ["ai", "cloud"],
    },
  ],
  "federal-reserve": [
    {
      symbol: "JPM",
      name: "JPMorgan Chase & Co.",
      rationale: "Bank profitability highly sensitive to interest rate environment.",
      confidence: 0.80,
      direction: "neutral",
      relatedTags: ["banking", "interest-rates"],
    },
    {
      symbol: "BAC",
      name: "Bank of America Corp.",
      rationale: "Regional and consumer banking affected by Fed policy decisions.",
      confidence: 0.77,
      direction: "neutral",
      relatedTags: ["banking", "interest-rates"],
    },
  ],
  oil: [
    {
      symbol: "XOM",
      name: "Exxon Mobil Corp.",
      rationale: "Major oil producer with revenue directly tied to crude oil prices.",
      confidence: 0.89,
      direction: "bullish",
      relatedTags: ["oil", "energy"],
    },
    {
      symbol: "CVX",
      name: "Chevron Corporation",
      rationale: "Integrated energy company with significant oil production operations.",
      confidence: 0.86,
      direction: "bullish",
      relatedTags: ["oil", "energy"],
    },
    {
      symbol: "COP",
      name: "ConocoPhillips",
      rationale: "Pure-play oil and gas exploration company sensitive to oil price movements.",
      confidence: 0.83,
      direction: "bullish",
      relatedTags: ["oil", "energy"],
    },
  ],
};

/**
 * Generate mock ticker suggestions based on event tags and category
 * Returns 8-12 relevant tickers with confidence scores
 */
export function getMockTickers(event: PolymarketEvent): TickerSuggestion[] {
  const tickersMap = new Map<string, TickerSuggestion>();

  // Start with category-based tickers
  const categoryTickers = TICKER_MAPPINGS[event.category] || [];
  categoryTickers.forEach((ticker) => {
    const key = ticker.symbol;
    if (!tickersMap.has(key)) {
      tickersMap.set(key, ticker);
    }
  });

  // Add tag-based tickers
  event.tags.forEach((tag) => {
    const tagTickers = TICKER_MAPPINGS[tag] || [];
    tagTickers.forEach((ticker) => {
      const key = ticker.symbol;
      if (!tickersMap.has(key)) {
        tickersMap.set(key, ticker);
      } else {
        // Boost confidence if ticker appears multiple times
        const existing = tickersMap.get(key)!;
        existing.confidence = Math.min(0.98, existing.confidence + 0.05);
      }
    });
  });

  // Convert to array and sort by confidence
  let tickers = Array.from(tickersMap.values()).sort((a, b) => b.confidence - a.confidence);

  // Ensure we have 8-12 tickers
  if (tickers.length < 8) {
    // Add some generic tech/market tickers as fallback
    const fallbackTickers: TickerSuggestion[] = [
      {
        symbol: "SPY",
        name: "SPDR S&P 500 ETF",
        rationale: "Broad market exposure to overall market sentiment.",
        confidence: 0.60,
        direction: "neutral",
        relatedTags: ["market", "etf"],
      },
      {
        symbol: "QQQ",
        name: "Invesco QQQ Trust",
        rationale: "Tech-heavy ETF sensitive to technology sector movements.",
        confidence: 0.58,
        direction: "neutral",
        relatedTags: ["tech", "etf"],
      },
      {
        symbol: "VTI",
        name: "Vanguard Total Stock Market ETF",
        rationale: "Total U.S. stock market exposure.",
        confidence: 0.55,
        direction: "neutral",
        relatedTags: ["market", "etf"],
      },
    ];

    fallbackTickers.forEach((ticker) => {
      if (!tickersMap.has(ticker.symbol)) {
        tickers.push(ticker);
      }
    });
  }

  // Return top 8-12 tickers
  return tickers.slice(0, Math.min(12, Math.max(8, tickers.length)));
}

/**
 * Get tickers filtered by direction
 */
export function getTickersByDirection(
  tickers: TickerSuggestion[],
  direction: "bullish" | "bearish" | "neutral"
): TickerSuggestion[] {
  return tickers.filter((t) => t.direction === direction);
}

/**
 * Get top N tickers by confidence
 */
export function getTopTickers(tickers: TickerSuggestion[], n: number = 5): TickerSuggestion[] {
  return [...tickers].sort((a, b) => b.confidence - a.confidence).slice(0, n);
}
