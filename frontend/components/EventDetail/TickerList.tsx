"use client";

import { useEffect, useState, useRef } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Skeleton } from "@/components/ui/skeleton";
import { TrendingUp, TrendingDown, Minus, Loader2 } from "lucide-react";
import { cn } from "@/lib/utils";
import { fetchEventTickers, TickerSuggestion } from "@/lib/services/api";
import { TickerChart } from "./TickerChart";

interface TickerListProps {
  eventId: string;
  event: any; // PolymarketEvent from the store
}

export function TickerList({ eventId, event }: TickerListProps) {
  const [tickers, setTickers] = useState<TickerSuggestion[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    console.log(`[TickerList] Effect triggered for eventId: ${eventId}`);

    let cancelled = false;

    async function loadTickers() {
      try {
        setIsLoading(true);
        setError(null);

        const data = await fetchEventTickers(eventId, event);

        if (!cancelled) {
          console.log(`[TickerList] Setting ${data.length} tickers in state:`, data);
          setTickers(data);
          console.log(`[TickerList] State updated, isLoading will be set to false`);
        }
      } catch (err) {
        console.error(`[TickerList] Error:`, err);
        if (!cancelled) {
          setError(err instanceof Error ? err.message : "Failed to load tickers");
        }
      } finally {
        if (!cancelled) {
          setIsLoading(false);
        }
      }
    }

    loadTickers();

    return () => {
      cancelled = true;
    };
  }, [eventId]);

  const getDirectionIcon = (direction: string) => {
    switch (direction) {
      case "bullish":
        return <TrendingUp className="w-4 h-4 text-green-500" />;
      case "bearish":
        return <TrendingDown className="w-4 h-4 text-red-500" />;
      default:
        return <Minus className="w-4 h-4 text-slate-500" />;
    }
  };

  const getDirectionColor = (direction: string) => {
    switch (direction) {
      case "bullish":
        return "text-green-500";
      case "bearish":
        return "text-red-500";
      default:
        return "text-slate-500";
    }
  };

  console.log(`[TickerList] Render - isLoading: ${isLoading}, tickers: ${tickers.length}, error: ${error}`);

  if (isLoading) {
    return (
      <div className="space-y-4">
        <div>
          <h3 className="text-xl font-bold mb-2">Related Stock Tickers</h3>
          <p className="text-sm text-slate-400 flex items-center gap-2">
            <Loader2 className="w-4 h-4 animate-spin" />
            GPT is analyzing market correlations...
          </p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {[...Array(8)].map((_, i) => (
            <Card key={i}>
              <CardHeader className="pb-3">
                <Skeleton className="h-5 w-24" />
              </CardHeader>
              <CardContent>
                <Skeleton className="h-4 w-full mb-2" />
                <Skeleton className="h-4 w-3/4" />
              </CardContent>
            </Card>
          ))}
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="space-y-4">
        <div>
          <h3 className="text-xl font-bold mb-2">Related Stock Tickers</h3>
        </div>
        <Card className="border-red-500/50">
          <CardContent className="p-6 text-center">
            <p className="text-red-400">{error}</p>
            <p className="text-sm text-slate-500 mt-2">
              Make sure OPENROUTER_API_KEY is set in frontend/.env.local
            </p>
          </CardContent>
        </Card>
      </div>
    );
  }

  if (tickers.length === 0) {
    return (
      <div className="space-y-4">
        <div>
          <h3 className="text-xl font-bold mb-2">Related Stock Tickers</h3>
        </div>
        <Card className="border-dashed">
          <CardContent className="p-6 text-center text-slate-500">
            No ticker suggestions available
          </CardContent>
        </Card>
      </div>
    );
  }

  return (
    <div className="space-y-4">
      <div>
        <h3 className="text-xl font-bold mb-2">Related Stock Tickers</h3>
        <p className="text-sm text-slate-400">
          GPT-5-mini identified {tickers.length} stocks that could be affected by this event
        </p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        {tickers.map((ticker, index) => (
          <Card key={ticker.symbol} className="overflow-hidden">
            <CardHeader className="pb-3">
              <div className="flex items-start justify-between gap-2">
                <div className="flex-1">
                  <CardTitle className="text-lg flex items-center gap-2">
                    {ticker.symbol}
                    {getDirectionIcon(ticker.direction)}
                  </CardTitle>
                  <p className="text-xs text-slate-400 mt-1">{ticker.name}</p>
                </div>

                <div className="flex flex-col items-end gap-1">
                  <Badge variant="outline" className="text-xs">
                    #{index + 1}
                  </Badge>
                  <Badge variant="secondary" className="text-xs">
                    {(ticker.confidence * 100).toFixed(0)}% impact
                  </Badge>
                </div>
              </div>
            </CardHeader>

            <CardContent className="space-y-3">
              {/* Stock Chart with Price */}
              <TickerChart symbol={ticker.symbol} eventTimestamp={event.detectedAt} />

              {/* Rationale */}
              <p className="text-xs text-slate-400 line-clamp-2">{ticker.rationale}</p>
            </CardContent>
          </Card>
        ))}
      </div>
    </div>
  );
}
