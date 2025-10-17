import {
  PolymarketEvent,
  EventDetailData,
  OrchestratorStatus,
  NewsCard,
  StockData,
  PriceDataPoint,
} from "@/lib/types";
import { getMockTickers } from "@/lib/data/mockTickers";

/**
 * Simulates backend orchestration flow with realistic delays
 * Generates tickers, stock data, and news for an event
 */
export async function orchestrateEventDetail(
  event: PolymarketEvent,
  onStatusUpdate: (status: OrchestratorStatus) => void
): Promise<EventDetailData> {
  // Step 1: Fetch ticker suggestions
  onStatusUpdate("fetching_tickers");
  await delay(1500, 2500);

  const tickers = getMockTickers(event);

  // Step 2: Fetch stock prices for each ticker
  onStatusUpdate("fetching_prices");
  await delay(2000, 3000);

  const stockData: Record<string, StockData> = {};
  const eventTimestamp = new Date().toISOString();

  for (const ticker of tickers) {
    stockData[ticker.symbol] = generateMockStockData(ticker.symbol, eventTimestamp);
  }

  // Step 3: Fetch news
  onStatusUpdate("fetching_news");
  await delay(1500, 2000);

  const news = generateMockNews(event);

  // Complete!
  onStatusUpdate("complete");

  return {
    event,
    status: "complete",
    tickers,
    stockData,
    news,
  };
}

/**
 * Generate mock stock data with 30-day price history
 */
function generateMockStockData(symbol: string, eventTimestamp: string): StockData {
  // Starting price based on symbol (for consistency)
  const basePrices: Record<string, number> = {
    AAPL: 185.0,
    MSFT: 420.0,
    GOOGL: 145.0,
    AMZN: 175.0,
    TSLA: 250.0,
    NVDA: 880.0,
    META: 480.0,
    COIN: 185.0,
    MSTR: 1450.0,
    JPM: 195.0,
    BAC: 38.0,
    LMT: 475.0,
    BA: 185.0,
    XOM: 112.0,
    CVX: 158.0,
    DKNG: 42.0,
    NKE: 108.0,
    DIS: 112.0,
    SPY: 500.0,
    QQQ: 450.0,
    VTI: 260.0,
    RIOT: 14.5,
    MARA: 18.2,
    AMD: 182.0,
    COP: 124.0,
    GD: 285.0,
    NOC: 490.0,
    PENN: 28.5,
  };

  const basePrice = basePrices[symbol] || 100.0;

  // Generate 30 days of price history using random walk
  const priceHistory: PriceDataPoint[] = [];
  let currentPrice = basePrice;

  const now = new Date();
  for (let i = 29; i >= 0; i--) {
    const date = new Date(now);
    date.setDate(date.getDate() - i);

    // Random walk: ±2% per day
    const changePercent = (Math.random() - 0.5) * 0.04; // -2% to +2%
    currentPrice = currentPrice * (1 + changePercent);

    // Generate volume (in millions)
    const volume = Math.floor(Math.random() * 50_000_000 + 10_000_000);

    priceHistory.push({
      timestamp: date.toISOString(),
      price: parseFloat(currentPrice.toFixed(2)),
      volume,
    });
  }

  const latestPrice = priceHistory[priceHistory.length - 1].price;
  const yesterdayPrice = priceHistory[priceHistory.length - 2].price;
  const change24h = latestPrice - yesterdayPrice;
  const changePercent24h = (change24h / yesterdayPrice) * 100;

  return {
    symbol,
    currentPrice: latestPrice,
    priceHistory,
    change24h: parseFloat(change24h.toFixed(2)),
    changePercent24h: parseFloat(changePercent24h.toFixed(2)),
    eventTimestamp,
  };
}

/**
 * Generate 4-6 mock news cards based on event
 */
function generateMockNews(event: PolymarketEvent): NewsCard[] {
  const sources = ["Bloomberg", "Reuters", "CNBC", "Wall Street Journal", "Financial Times", "The Economist"];
  const newsCount = Math.floor(Math.random() * 3) + 4; // 4-6 news items

  const newsTitles = generateNewsTitles(event);
  const news: NewsCard[] = [];

  for (let i = 0; i < newsCount && i < newsTitles.length; i++) {
    const hoursAgo = Math.floor(Math.random() * 48) + 1; // 1-48 hours ago
    const publishedAt = new Date(Date.now() - hoursAgo * 60 * 60 * 1000);

    const sentiment = ["positive", "negative", "neutral"][Math.floor(Math.random() * 3)] as
      | "positive"
      | "negative"
      | "neutral";

    news.push({
      id: `news_${event.id}_${i}`,
      title: newsTitles[i],
      snippet: generateSnippet(event, sentiment),
      source: sources[i % sources.length],
      publishedAt: publishedAt.toISOString(),
      url: `https://example.com/news/${event.id}_${i}`,
      relevanceScore: parseFloat((Math.random() * 0.3 + 0.7).toFixed(2)), // 0.7-1.0
      sentiment,
    });
  }

  // Sort by relevance score descending
  return news.sort((a, b) => b.relevanceScore - a.relevanceScore);
}

/**
 * Generate relevant news titles based on event
 */
function generateNewsTitles(event: PolymarketEvent): string[] {
  const category = event.category;
  const mainTag = event.tags[0] || category;

  const titleTemplates = {
    crypto: [
      `${mainTag.toUpperCase()} surges amid renewed institutional interest`,
      `Analysts predict major moves in ${mainTag} markets ahead`,
      `Regulatory clarity could reshape ${mainTag} landscape`,
      `Major institutions increase ${mainTag} exposure`,
      `Market volatility creates opportunities in ${mainTag} sector`,
      `Expert analysis: What's driving ${mainTag} momentum`,
    ],
    politics: [
      `Political analysts weigh in on ${mainTag} developments`,
      `Latest polls show shifting sentiment on ${event.tags[0]}`,
      `Policy implications of ${mainTag} could reshape markets`,
      `Economists debate impact of ${mainTag} decisions`,
      `Washington insiders predict ${mainTag} outcome`,
      `Global markets react to ${mainTag} uncertainty`,
    ],
    business: [
      `${mainTag} sector sees increased investor activity`,
      `Quarterly earnings beat expectations for ${mainTag} companies`,
      `Market outlook: ${mainTag} stocks positioned for growth`,
      `Industry leaders discuss future of ${mainTag} market`,
      `Supply chain improvements boost ${mainTag} sector`,
      `${mainTag} companies announce major strategic initiatives`,
    ],
    tech: [
      `Tech giants race to dominate ${mainTag} space`,
      `Innovation in ${mainTag} accelerates across industry`,
      `Investors pour billions into ${mainTag} startups`,
      `${mainTag} breakthrough could transform computing`,
      `Major ${mainTag} announcement expected this quarter`,
      `Competition heats up in ${mainTag} market`,
    ],
    sports: [
      `${mainTag} season heats up as playoffs approach`,
      `Betting markets show strong interest in ${mainTag}`,
      `Sports analysts predict ${mainTag} outcomes`,
      `Fan engagement reaches new highs in ${mainTag}`,
      `Broadcasting deals reshape ${mainTag} economics`,
      `${mainTag} merchandise sales surge ahead of key events`,
    ],
  };

  return titleTemplates[category as keyof typeof titleTemplates] || titleTemplates.business;
}

/**
 * Generate realistic news snippet
 */
function generateSnippet(event: PolymarketEvent, sentiment: "positive" | "negative" | "neutral"): string {
  const sentimentWords = {
    positive: ["surge", "optimistic", "strong momentum", "bullish outlook", "increased confidence"],
    negative: ["concerns mount", "uncertainty", "bearish signals", "declining sentiment", "headwinds"],
    neutral: ["analysts divided", "mixed signals", "awaiting clarity", "market watches", "ongoing debate"],
  };

  const words = sentimentWords[sentiment];
  const word = words[Math.floor(Math.random() * words.length)];

  const snippets = [
    `Market watchers note ${word} as ${event.tags[0]} developments continue to unfold. Industry experts suggest this could have significant implications for related sectors.`,
    `Recent analysis shows ${word} surrounding ${event.category} sector trends. Investors are closely monitoring these developments for potential market impacts.`,
    `With ${word} evident in recent trading patterns, analysts are reassessing their outlook on ${event.tags[0]}-related assets and their broader market implications.`,
  ];

  return snippets[Math.floor(Math.random() * snippets.length)];
}

/**
 * Delay helper with random variance
 */
function delay(minMs: number, maxMs: number): Promise<void> {
  const ms = Math.floor(Math.random() * (maxMs - minMs) + minMs);
  return new Promise((resolve) => setTimeout(resolve, ms));
}
