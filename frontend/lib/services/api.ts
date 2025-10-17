/**
 * API service for connecting to the Polymarket backend
 */

import { PolymarketEvent } from "@/lib/types";

const API_BASE = process.env.NEXT_PUBLIC_API_URL || "http://localhost:8000";

console.log("[API] Initialized with base URL:", API_BASE);

export interface EventListResponse {
  events: PolymarketEvent[];
  total: number;
  hasVolumeSpike: number;
}

export interface SpikeSummary {
  total_events: number;
  spike_events: number;
  average_spike_ratio: number;
  max_spike_ratio: number;
  top_spike_event: {
    id: string;
    title: string;
    spike_ratio: number;
    volume24hr: number;
  } | null;
}

export interface EventChange {
  eventId: string;
  eventTitle: string;
  changeType: "new_spike" | "spike_increased" | "spike_decreased" | "spike_removed";
  timestamp: string;
  oldSpikeRatio: number | null;
  newSpikeRatio: number | null;
  volume24hr: number;
  probability: number;
}

export interface ChangesResponse {
  changes: EventChange[];
  total: number;
}

/**
 * Fetch frontier events from the backend
 */
export async function fetchFrontierEvents(
  limit: number = 20,
  spikeOnly: boolean = false
): Promise<EventListResponse> {
  console.log(`[API] Fetching frontier events (limit: ${limit}, spike_only: ${spikeOnly})`);

  try {
    const url = `${API_BASE}/api/events?limit=${limit}&spike_only=${spikeOnly}`;
    const response = await fetch(url);

    if (!response.ok) {
      throw new Error(`API error: ${response.status} ${response.statusText}`);
    }

    const data: EventListResponse = await response.json();
    console.log(
      `[API] Fetched ${data.events.length} events (${data.hasVolumeSpike} with spikes)`
    );

    return data;
  } catch (error) {
    console.error("[API] Failed to fetch frontier events:", error);
    throw error;
  }
}

/**
 * Fetch a single event by ID
 */
export async function fetchEvent(eventId: string): Promise<PolymarketEvent> {
  console.log(`[API] Fetching event:`, eventId);

  try {
    const url = `${API_BASE}/api/events/${eventId}`;
    const response = await fetch(url);

    if (!response.ok) {
      throw new Error(`API error: ${response.status} ${response.statusText}`);
    }

    const event: PolymarketEvent = await response.json();
    console.log(`[API] Fetched event:`, event.title);

    return event;
  } catch (error) {
    console.error(`[API] Failed to fetch event ${eventId}:`, error);
    throw error;
  }
}

/**
 * Toggle lock state for an event
 */
export async function toggleEventLock(eventId: string): Promise<{ id: string; locked: boolean }> {
  console.log(`[API] Toggling lock for event:`, eventId);

  try {
    const url = `${API_BASE}/api/events/${eventId}/lock`;
    const response = await fetch(url, { method: "POST" });

    if (!response.ok) {
      throw new Error(`API error: ${response.status} ${response.statusText}`);
    }

    const result = await response.json();
    console.log(`[API] Event ${eventId} lock state:`, result.locked);

    return result;
  } catch (error) {
    console.error(`[API] Failed to toggle lock for event ${eventId}:`, error);
    throw error;
  }
}

/**
 * Get volume spike summary statistics
 */
export async function fetchSpikeSummary(): Promise<SpikeSummary> {
  console.log("[API] Fetching spike summary");

  try {
    const url = `${API_BASE}/api/events/spikes/summary`;
    const response = await fetch(url);

    if (!response.ok) {
      throw new Error(`API error: ${response.status} ${response.statusText}`);
    }

    const summary: SpikeSummary = await response.json();
    console.log(
      `[API] Spike summary: ${summary.spike_events}/${summary.total_events} events with spikes`
    );

    return summary;
  } catch (error) {
    console.error("[API] Failed to fetch spike summary:", error);
    throw error;
  }
}

/**
 * Force refresh of market data
 */
export async function forceRefresh(): Promise<{
  status: string;
  events_fetched: number;
  spike_events: number;
}> {
  console.log("[API] Forcing data refresh");

  try {
    const url = `${API_BASE}/api/refresh`;
    const response = await fetch(url, { method: "POST" });

    if (!response.ok) {
      throw new Error(`API error: ${response.status} ${response.statusText}`);
    }

    const result = await response.json();
    console.log(`[API] Refresh complete: ${result.events_fetched} events fetched`);

    return result;
  } catch (error) {
    console.error("[API] Failed to force refresh:", error);
    throw error;
  }
}

/**
 * Check backend health
 */
export async function checkHealth(): Promise<{
  status: string;
  events_tracked: number;
  events_with_spikes: number;
}> {
  try {
    const url = `${API_BASE}/health`;
    const response = await fetch(url);

    if (!response.ok) {
      throw new Error(`API error: ${response.status} ${response.statusText}`);
    }

    return await response.json();
  } catch (error) {
    console.error("[API] Health check failed:", error);
    throw error;
  }
}

/**
 * Get recent changes detected in polling
 */
export async function fetchChanges(
  limit: number = 50,
  since?: string
): Promise<ChangesResponse> {
  console.log(`[API] Fetching changes (limit: ${limit}, since: ${since || "all"})`);

  try {
    const params = new URLSearchParams({ limit: limit.toString() });
    if (since) {
      params.append("since", since);
    }

    const url = `${API_BASE}/api/events/changes?${params}`;
    const response = await fetch(url);

    if (!response.ok) {
      throw new Error(`API error: ${response.status} ${response.statusText}`);
    }

    const data: ChangesResponse = await response.json();
    console.log(`[API] Fetched ${data.changes.length} changes`);

    return data;
  } catch (error) {
    console.error("[API] Failed to fetch changes:", error);
    throw error;
  }
}

/**
 * Get GPT-mapped ticker suggestions for an event
 */
export async function fetchEventTickers(eventId: string): Promise<TickerSuggestion[]> {
  console.log(`[API] Fetching ticker suggestions for event:`, eventId);

  try {
    const url = `${API_BASE}/api/events/${eventId}/tickers`;
    const response = await fetch(url);

    if (!response.ok) {
      throw new Error(`API error: ${response.status} ${response.statusText}`);
    }

    const tickers: TickerSuggestion[] = await response.json();
    console.log(`[API] Fetched ${tickers.length} tickers for event ${eventId}`);

    return tickers;
  } catch (error) {
    console.error(`[API] Failed to fetch tickers for event ${eventId}:`, error);
    throw error;
  }
}

export interface TickerSuggestion {
  symbol: string;
  name: string;
  rationale: string;
  confidence: number;
  direction: "bullish" | "bearish" | "neutral";
  relatedTags: string[];
}

// News-related interfaces
export interface NewsScrapeRequest {
  query: string;
  max_items: number;
  language: string;
  time_range: string;
  fetch_article_details: boolean;
}

export interface NewsScrapeResponse {
  status: string;
  query: string;
  item_count: number;
  items: any[];
}

export interface EventDetailResponse {
  event: PolymarketEvent;
  status: string;
  news?: any[];
  tickers?: TickerSuggestion[];
  stockData?: Record<string, any>;
  error?: string;
}

/**
 * Scrape news using Apify's Google News scraper
 */
export async function scrapeNews(request: NewsScrapeRequest): Promise<NewsScrapeResponse> {
  console.log(`[API] Scraping news for query:`, request.query);

  try {
    const url = `${API_BASE}/api/news/scrape`;
    const response = await fetch(url, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify(request),
    });

    if (!response.ok) {
      throw new Error(`API error: ${response.status} ${response.statusText}`);
    }

    const data: NewsScrapeResponse = await response.json();
    console.log(`[API] Scraped ${data.item_count} news articles for query: ${data.query}`);

    return data;
  } catch (error) {
    console.error("[API] Failed to scrape news:", error);
    throw error;
  }
}

/**
 * Get news for a specific event
 */
export async function fetchEventNews(
  eventId: string,
  maxItems: number = 6,
  timeRange: string = "1d"
): Promise<{ event_id: string; event_title: string; news_count: number; news: any[] }> {
  console.log(`[API] Fetching news for event:`, eventId);

  try {
    const url = `${API_BASE}/api/events/${eventId}/news?max_items=${maxItems}&time_range=${timeRange}`;
    const response = await fetch(url);

    if (!response.ok) {
      throw new Error(`API error: ${response.status} ${response.statusText}`);
    }

    const data = await response.json();
    console.log(`[API] Fetched ${data.news_count} news articles for event ${eventId}`);

    return data;
  } catch (error) {
    console.error(`[API] Failed to fetch news for event ${eventId}:`, error);
    throw error;
  }
}

/**
 * Get detailed analysis for an event including news
 */
export async function fetchEventDetail(
  eventId: string,
  includeNews: boolean = true,
  newsMaxItems: number = 6,
  newsTimeRange: string = "1d"
): Promise<EventDetailResponse> {
  console.log(`[API] Fetching event detail for:`, eventId);

  try {
    const url = `${API_BASE}/api/events/${eventId}/detail?include_news=${includeNews}&news_max_items=${newsMaxItems}&news_time_range=${newsTimeRange}`;
    const response = await fetch(url);

    if (!response.ok) {
      throw new Error(`API error: ${response.status} ${response.statusText}`);
    }

    const data: EventDetailResponse = await response.json();
    console.log(`[API] Fetched event detail for ${eventId} with status: ${data.status}`);

    return data;
  } catch (error) {
    console.error(`[API] Failed to fetch event detail for ${eventId}:`, error);
    throw error;
  }
}
