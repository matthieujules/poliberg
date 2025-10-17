"use client";

import { useState, useEffect } from "react";
import { useEventStore } from "@/lib/store/eventStore";
import { Button } from "@/components/ui/button";
import { ArrowLeft, ExternalLink } from "lucide-react";
import { TickerList } from "./TickerList";
import { MarketChart } from "./MarketChart";
import { Separator } from "@/components/ui/separator";
import { fetchPriceHistory, scrapeNews } from "@/lib/services/api";
import { PriceHistoryPoint } from "@/lib/types";
import { Badge } from "@/components/ui/badge";
import { formatVolume } from "@/lib/utils/time";

interface EventDetailViewProps {
  eventId: string;
  onClose: () => void;
}

export function EventDetailView({ eventId, onClose }: EventDetailViewProps) {
  const event = useEventStore((state) => state.events.find((e) => e.id === eventId));
  const [priceHistory, setPriceHistory] = useState<PriceHistoryPoint[]>([]);
  const [interval, setInterval] = useState<string>("1d");
  const [selectedOutcomeIndex, setSelectedOutcomeIndex] = useState<number>(0);
  const [isLoadingChart, setIsLoadingChart] = useState<boolean>(true);
  const [chartError, setChartError] = useState<string | null>(null);
  
  // News state
  const [newsItems, setNewsItems] = useState<any[]>([]);
  const [isLoadingNews, setIsLoadingNews] = useState<boolean>(false);
  const [newsError, setNewsError] = useState<string | null>(null);

  // Fetch price history when component mounts or interval changes
  // NOTE: We only depend on eventId and interval, NOT event object itself
  // This prevents refetching when the store updates every 5 seconds
  useEffect(() => {
    if (!event || !event.clobTokenIds || event.clobTokenIds.length === 0) {
      setIsLoadingChart(false);
      setChartError("Price history not available for this market");
      return;
    }

    const loadPriceHistory = async () => {
      setIsLoadingChart(true);
      setChartError(null);

      try {
        const data = await fetchPriceHistory(eventId, interval, selectedOutcomeIndex);
        setPriceHistory(data.history);
      } catch (error) {
        console.error("Failed to load price history:", error);
        setChartError("Failed to load price history");
      } finally {
        setIsLoadingChart(false);
      }
    };

    loadPriceHistory();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [eventId, interval, selectedOutcomeIndex]); // Re-fetch when eventId, interval, or outcome changes

  // Fetch Tesla news when component mounts
  useEffect(() => {
    const loadTeslaNews = async () => {
      setIsLoadingNews(true);
      setNewsError(null);
      setNewsItems([]);

      try {
        const result = await scrapeNews({
          query: "Tesla",
          max_items: 5,
          time_range: "1h",
          fetch_details: true,
        });

        if (result.status === "SUCCEEDED") {
          setNewsItems(result.items);
        } else {
          setNewsError(`News scraping failed: ${result.status}`);
        }
      } catch (err) {
        setNewsError(err instanceof Error ? err.message : "Failed to scrape news");
      } finally {
        setIsLoadingNews(false);
      }
    };

    loadTeslaNews();
  }, [eventId]); // Only fetch once when event changes

  if (!event) {
    return null;
  }

  const hasChart = !chartError && (isLoadingChart || priceHistory.length > 0);
  const isMultiOutcome = event.outcomes && event.outcomes.length > 2;
  const selectedOutcomeName = event.outcomes?.[selectedOutcomeIndex] || `Outcome ${selectedOutcomeIndex}`;

  return (
    <div className="fixed inset-0 bg-gradient-to-br from-slate-950 via-slate-900 to-slate-950 z-50 flex flex-col">
      {/* Fixed Header with Back Button */}
      <header className="flex-shrink-0 bg-slate-900/90 backdrop-blur-md border-b border-slate-800 shadow-lg">
        <div className="container mx-auto px-6 py-6">
          <div className="flex items-center justify-between">
            <Button
              variant="outline"
              size="lg"
              onClick={onClose}
              className="gap-2 font-medium"
            >
              <ArrowLeft className="w-5 h-5" />
              Back to Events
            </Button>

            <a
              href={event.marketUrl}
              target="_blank"
              rel="noopener noreferrer"
              className="text-sm text-slate-400 hover:text-slate-300 flex items-center gap-2 transition-colors"
            >
              View on Polymarket
              <ExternalLink className="w-4 h-4" />
            </a>
          </div>
        </div>
      </header>

      {/* Scrollable Content */}
      <main className="flex-1 overflow-y-auto">
        <div className="container mx-auto px-6 py-8 space-y-6">
          {/* Market Info Section */}
          <div className="bg-slate-900/50 rounded-lg border border-slate-800 p-6">
            <h1 className="text-2xl font-bold text-slate-50 mb-3">{event.title}</h1>
            <p className="text-base text-slate-300 mb-4">{event.description}</p>

            {/* Stats */}
            <div className="flex flex-wrap items-center gap-4 text-sm">
              <div className="flex items-center gap-2">
                <span className="text-slate-400">Current Probability:</span>
                <Badge variant="secondary" className="text-base font-bold">
                  {(event.probability * 100).toFixed(1)}%
                </Badge>
              </div>

              {event.oneDayPriceChange !== null && event.oneDayPriceChange !== 0 && (
                <div className="flex items-center gap-2">
                  <span className="text-slate-400">24h Change:</span>
                  <span
                    className={`font-medium ${
                      event.oneDayPriceChange > 0 ? "text-green-400" : "text-red-400"
                    }`}
                  >
                    {event.oneDayPriceChange > 0 ? "+" : ""}
                    {(event.oneDayPriceChange * 100).toFixed(1)}%
                  </span>
                </div>
              )}

              <div className="flex items-center gap-2">
                <span className="text-slate-400">24h Volume:</span>
                <span className="text-slate-200 font-medium">{formatVolume(event.volume24hr)}</span>
              </div>

              <div className="flex items-center gap-2">
                <span className="text-slate-400">Liquidity:</span>
                <span className="text-slate-200 font-medium">{formatVolume(event.liquidityNum)}</span>
              </div>
            </div>
          </div>

          {/* Outcome Selector (for multi-outcome markets like elections) */}
          {isMultiOutcome && event.outcomes && event.clobTokenIds && (
            <div className="bg-slate-900/50 rounded-lg border border-slate-800 p-4">
              <label className="text-sm text-slate-400 mb-2 block">Select Candidate/Outcome:</label>
              <div className="flex flex-wrap gap-2">
                {event.outcomes.map((outcome, index) => (
                  <button
                    key={index}
                    onClick={() => setSelectedOutcomeIndex(index)}
                    className={`px-4 py-2 rounded-lg text-sm font-medium transition-colors ${
                      selectedOutcomeIndex === index
                        ? "bg-blue-600 text-white"
                        : "bg-slate-800 text-slate-300 hover:bg-slate-700"
                    }`}
                  >
                    {outcome}
                  </button>
                ))}
              </div>
            </div>
          )}

          {/* Price Chart */}
          {hasChart && (
            <div className="space-y-2">
              {isMultiOutcome && (
                <div className="text-sm text-slate-400 px-2">
                  Showing probability for: <span className="text-white font-medium">{selectedOutcomeName}</span>
                </div>
              )}
              <MarketChart
                priceHistory={priceHistory}
                interval={interval}
                onIntervalChange={setInterval}
                isLoading={isLoadingChart}
              />
            </div>
          )}

          {chartError && !hasChart && (
            <div className="bg-slate-900/50 rounded-lg border border-slate-800 p-6 text-center">
              <p className="text-slate-400">{chartError}</p>
            </div>
          )}

          <Separator className="bg-slate-800" />

          {/* GPT-Mapped Tickers */}
          <TickerList eventId={eventId} event={event} />

          <Separator className="bg-slate-800" />

          {/* Tesla News Section */}
          <div className="bg-slate-900/50 rounded-lg border border-slate-800 p-6">
            <h2 className="text-xl font-semibold text-white mb-4">Related News</h2>
            
            {isLoadingNews && (
              <div className="text-center py-8">
                <div className="inline-block animate-spin rounded-full h-8 w-8 border-b-2 border-blue-500"></div>
                <p className="text-slate-400 mt-2">Loading news...</p>
              </div>
            )}

            {newsError && (
              <div className="p-4 bg-red-900/50 border border-red-700 rounded-md text-red-200">
                {newsError}
              </div>
            )}

            {newsItems.length > 0 && (
              <div className="space-y-4">
                {newsItems.map((item, index) => (
                  <div
                    key={index}
                    className="p-4 bg-slate-800 rounded-md border border-slate-700 hover:border-slate-600 transition-colors"
                  >
                    <h3 className="font-medium text-white mb-2 line-clamp-2">{item.title}</h3>
                    <div className="flex items-center gap-4 text-sm text-slate-400 mb-2">
                      <span>Source: {item.source}</span>
                      <span>
                        Published: {new Date(item.publishedAt).toLocaleString()}
                      </span>
                    </div>
                    <a
                      href={item.link}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="inline-block text-blue-400 hover:text-blue-300 text-sm transition-colors"
                    >
                      Read full article →
                    </a>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>
      </main>
    </div>
  );
}
