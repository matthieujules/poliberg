"use client";

import { useEffect, useState } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Skeleton } from "@/components/ui/skeleton";
import { TrendingUp, TrendingDown, Minus, Loader2 } from "lucide-react";
import { cn } from "@/lib/utils";
import { fetchEventTickers, TickerSuggestion } from "@/lib/services/api";

interface TickerListProps {
  eventId: string;
}

export function TickerList({ eventId }: TickerListProps) {
  const [tickers, setTickers] = useState<TickerSuggestion[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    let isMounted = true;

    async function loadTickers() {
      try {
        setIsLoading(true);
        setError(null);
        const data = await fetchEventTickers(eventId);

        if (isMounted) {
          setTickers(data);
        }
      } catch (err) {
        if (isMounted) {
          setError(err instanceof Error ? err.message : "Failed to load tickers");
        }
      } finally {
        if (isMounted) {
          setIsLoading(false);
        }
      }
    }

    loadTickers();

    return () => {
      isMounted = false;
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
              Make sure the OPENROUTER_API_KEY environment variable is set in backend/.env
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
          GPT-4o-mini identified {tickers.length} stocks that could be affected by this event
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

            <CardContent className="space-y-2">
              <p className="text-sm text-slate-300">{ticker.rationale}</p>

              <div className="flex gap-1 flex-wrap">
                {ticker.relatedTags.map((tag) => (
                  <Badge key={tag} variant="outline" className="text-xs">
                    {tag}
                  </Badge>
                ))}
              </div>

              <div className={cn("text-xs font-medium", getDirectionColor(ticker.direction))}>
                {ticker.direction.charAt(0).toUpperCase() + ticker.direction.slice(1)} if event occurs
              </div>
            </CardContent>
          </Card>
        ))}
      </div>
    </div>
  );
}
