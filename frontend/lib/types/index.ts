// Core event from Polymarket (matches backend schema)
export interface PolymarketEvent {
  id: string;
  title: string;
  description: string;
  probability: number; // 0-1

  // Volume metrics
  volume24hr: number;
  volume1wk: number;
  volume1mo: number;
  volume1yr: number;

  // Price change metrics
  oneHourPriceChange: number | null;
  oneDayPriceChange: number | null;
  oneWeekPriceChange: number | null;

  // Market state
  active: boolean;
  closed: boolean;
  archived: boolean;

  // Price data
  lastTradePrice: number | null;
  bestBid: number | null;
  bestAsk: number | null;

  // Liquidity
  liquidityNum: number;

  // Metadata
  slug: string;
  marketUrl: string;
  endDate: string | null; // ISO timestamp

  // CLOB token IDs for price history
  clobTokenIds?: string[];

  // Outcomes (candidate names, Yes/No, etc.) - maps 1:1 with clobTokenIds
  outcomes?: string[];

  // Derived fields
  category: string;
  tags: string[];
  detectedAt: string; // ISO timestamp
  locked: boolean;

  // Volume spike indicator
  volumeSpike: number | null;
}

// Ticker suggestion from GPT
export interface TickerSuggestion {
  symbol: string; // "NVDA"
  name: string; // "NVIDIA Corporation"
  rationale: string; // Why this ticker is relevant
  confidence: number; // 0-1
  direction: "bullish" | "bearish" | "neutral";
  relatedTags: string[];
}

// Historical price data point from CLOB API
export interface PriceHistoryPoint {
  t: number; // Unix timestamp
  p: number; // Price/probability (0-1)
}

// Price history response from backend
export interface PriceHistoryResponse {
  history: PriceHistoryPoint[];
  interval: string;
  market: string; // CLOB token ID
}

// Historical price data point (legacy - for stock data)
export interface PriceDataPoint {
  timestamp: string; // ISO timestamp
  price: number;
  volume: number;
}

// Stock data with history
export interface StockData {
  symbol: string;
  currentPrice: number;
  priceHistory: PriceDataPoint[]; // Last 30 days
  change24h: number;
  changePercent24h: number;
  eventTimestamp: string; // When user clicked event
}

// News card
export interface NewsCard {
  id: string;
  title: string;
  snippet: string; // 2-3 sentence summary
  source: string; // "Bloomberg", "Reuters"
  publishedAt: string; // ISO timestamp
  url: string;
  relevanceScore: number; // 0-1
  sentiment: "positive" | "negative" | "neutral";
}

// Orchestrator status
export type OrchestratorStatus =
  | "idle"
  | "fetching_tickers" // Calling GPT
  | "fetching_prices" // Calling stock API
  | "fetching_news" // Calling news sources
  | "complete"
  | "error";

// Event detail data
export interface EventDetailData {
  event: PolymarketEvent;
  status: OrchestratorStatus;
  tickers: TickerSuggestion[];
  stockData: Record<string, StockData>; // Keyed by symbol
  news: NewsCard[];
  error?: string;
}
