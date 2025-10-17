import { PriceDataPoint, StockData } from "@/lib/types";

// In-memory cache with TTL
interface CacheEntry {
  data: PriceDataPoint[];
  expiry: number;
}

const cache = new Map<string, CacheEntry>();
const CACHE_TTL = 60 * 60 * 1000; // 1 hour

/**
 * Fetch historical stock prices from Finnhub
 * Falls back to mock data if API key is not configured or request fails
 */
export async function fetchStockHistory(
  symbol: string,
  days: number = 30
): Promise<PriceDataPoint[]> {
  // Check cache first
  const cacheKey = `${symbol}_${days}`;
  const cached = cache.get(cacheKey);
  if (cached && cached.expiry > Date.now()) {
    return cached.data;
  }

  // Check if API key is configured
  const apiKey = process.env.NEXT_PUBLIC_FINNHUB_API_KEY;

  if (!apiKey) {
    // No API key, use mock data
    return generateMockPriceHistory(symbol, days);
  }

  try {
    // Calculate timestamps
    const to = Math.floor(Date.now() / 1000);
    const from = Math.floor((Date.now() - days * 24 * 60 * 60 * 1000) / 1000);

    // Call Finnhub API
    const url = `https://finnhub.io/api/v1/stock/candle?symbol=${symbol}&resolution=D&from=${from}&to=${to}&token=${apiKey}`;
    const response = await fetch(url);

    if (!response.ok) {
      throw new Error(`Finnhub API error: ${response.status}`);
    }

    const data = await response.json();

    if (data.s !== "ok") {
      throw new Error(`Finnhub returned status: ${data.s}`);
    }

    // Transform response to PriceDataPoint[]
    const priceHistory: PriceDataPoint[] = data.t.map((timestamp: number, index: number) => ({
      timestamp: new Date(timestamp * 1000).toISOString(),
      price: parseFloat(data.c[index].toFixed(2)),
      volume: data.v[index],
    }));

    // Cache the result
    cache.set(cacheKey, {
      data: priceHistory,
      expiry: Date.now() + CACHE_TTL,
    });

    return priceHistory;
  } catch (error) {
    console.warn(`Failed to fetch real data for ${symbol}, using mock data:`, error);
    return generateMockPriceHistory(symbol, days);
  }
}

/**
 * Fetch stock data for multiple symbols
 * Includes rate limiting to respect API constraints (60 calls/min)
 */
export async function fetchMultipleStocks(symbols: string[]): Promise<Record<string, StockData>> {
  const results: Record<string, StockData> = {};
  const eventTimestamp = new Date().toISOString();

  for (let i = 0; i < symbols.length; i++) {
    const symbol = symbols[i];

    try {
      const priceHistory = await fetchStockHistory(symbol);

      if (priceHistory.length >= 2) {
        const currentPrice = priceHistory[priceHistory.length - 1].price;
        const yesterdayPrice = priceHistory[priceHistory.length - 2].price;
        const change24h = currentPrice - yesterdayPrice;
        const changePercent24h = (change24h / yesterdayPrice) * 100;

        results[symbol] = {
          symbol,
          currentPrice,
          priceHistory,
          change24h: parseFloat(change24h.toFixed(2)),
          changePercent24h: parseFloat(changePercent24h.toFixed(2)),
          eventTimestamp,
        };
      }

      // Rate limit: 1 request per second (conservative for 60/min limit)
      if (i < symbols.length - 1) {
        await new Promise((resolve) => setTimeout(resolve, 1000));
      }
    } catch (error) {
      console.error(`Failed to fetch data for ${symbol}:`, error);
      // Skip failed symbols
    }
  }

  return results;
}

/**
 * Generate mock price history for development/fallback
 */
function generateMockPriceHistory(symbol: string, days: number): PriceDataPoint[] {
  // Base prices for consistency
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
  const priceHistory: PriceDataPoint[] = [];
  let currentPrice = basePrice;

  const now = new Date();
  for (let i = days - 1; i >= 0; i--) {
    const date = new Date(now);
    date.setDate(date.getDate() - i);

    // Random walk: ±2% per day
    const changePercent = (Math.random() - 0.5) * 0.04;
    currentPrice = currentPrice * (1 + changePercent);

    const volume = Math.floor(Math.random() * 50_000_000 + 10_000_000);

    priceHistory.push({
      timestamp: date.toISOString(),
      price: parseFloat(currentPrice.toFixed(2)),
      volume,
    });
  }

  return priceHistory;
}

/**
 * Clear the cache (useful for testing)
 */
export function clearCache(): void {
  cache.clear();
}
