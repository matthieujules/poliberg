"use client";

import { TickerSuggestion, StockData } from "@/lib/types";
import { Card, CardContent, CardHeader } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Skeleton } from "@/components/ui/skeleton";
import { cn } from "@/lib/utils";
import { TickerChart } from "./TickerChart";

interface TickerGridProps {
  tickers: TickerSuggestion[];
  stockData: Record<string, StockData>;
  eventTimestamp: string;
}

export function TickerGrid({ tickers, stockData, eventTimestamp }: TickerGridProps) {
  // Sort by confidence descending
  const sortedTickers = [...tickers].sort((a, b) => b.confidence - a.confidence);

  return (
    <div className="space-y-4">
      <div>
        <h3 className="text-xl font-bold mb-2">Related Stock Tickers</h3>
        <p className="text-sm text-slate-400">
          {tickers.length} tickers potentially affected by this event
        </p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
        {sortedTickers.map((ticker) => {
          const stock = stockData[ticker.symbol];
          const isLoading = !stock;

          return (
            <Card key={ticker.symbol} className="overflow-hidden">
              <CardHeader className="pb-3">
                <div className="flex items-start justify-between">
                  <div>
                    <h4 className="text-lg font-bold">{ticker.symbol}</h4>
                    <p className="text-xs text-slate-400 line-clamp-1">{ticker.name}</p>
                  </div>

                  <Badge variant="outline" className="text-xs">
                    {(ticker.confidence * 100).toFixed(0)}%
                  </Badge>
                </div>
              </CardHeader>

              <CardContent className="space-y-3">
                {/* Rationale */}
                <p className="text-xs text-slate-300 line-clamp-2">{ticker.rationale}</p>

                {/* Stock Price & Chart */}
                {isLoading ? (
                  <div className="space-y-2">
                    <Skeleton className="h-4 w-24" />
                    <Skeleton className="h-[150px] w-full" />
                  </div>
                ) : (
                  <>
                    <div className="flex items-baseline gap-2">
                      <span className="text-2xl font-bold">${stock.currentPrice.toFixed(2)}</span>
                      <span
                        className={cn(
                          "text-sm font-medium",
                          stock.change24h > 0 ? "text-green-500" : "text-red-500"
                        )}
                      >
                        {stock.change24h > 0 ? "+" : ""}
                        {stock.changePercent24h.toFixed(2)}%
                      </span>
                    </div>

                    <TickerChart stockData={stock} eventTimestamp={eventTimestamp} />
                  </>
                )}
              </CardContent>
            </Card>
          );
        })}
      </div>
    </div>
  );
}
