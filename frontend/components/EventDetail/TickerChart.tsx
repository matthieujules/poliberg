"use client";

import { useEffect, useState } from "react";
import { cn } from "@/lib/utils";
import {
  LineChart,
  Line,
  XAxis,
  YAxis,
  Tooltip,
  ResponsiveContainer,
  ReferenceLine,
  Area,
  AreaChart,
} from "recharts";
import { format } from "date-fns";

interface PriceDataPoint {
  timestamp: string;
  price: number;
  volume: number;
}

interface StockData {
  symbol: string;
  currentPrice: number;
  priceHistory: PriceDataPoint[];
  change24h: number;
  changePercent24h: number;
  eventTimestamp: string;
}

interface TickerChartProps {
  symbol: string;
  eventTimestamp: string;
}

export function TickerChart({ symbol, eventTimestamp }: TickerChartProps) {
  const [stockData, setStockData] = useState<StockData | null>(null);

  useEffect(() => {
    // Generate mock 30-day price history
    const mockData = generateMockStockData(symbol, eventTimestamp);
    setStockData(mockData);
  }, [symbol, eventTimestamp]);

  if (!stockData) {
    return (
      <div className="space-y-2">
        <div className="h-4 w-24 bg-slate-800 rounded animate-pulse" />
        <div className="h-[120px] bg-slate-900/50 rounded border border-slate-800" />
      </div>
    );
  }

  // Find baseline price at event timestamp
  const eventDate = new Date(eventTimestamp);
  const baselineIndex = stockData.priceHistory.findIndex((point) => {
    const pointDate = new Date(point.timestamp);
    return pointDate >= eventDate;
  });

  const baselinePrice =
    baselineIndex >= 0
      ? stockData.priceHistory[baselineIndex].price
      : stockData.priceHistory[stockData.priceHistory.length - 1].price;

  // Determine color based on current vs baseline
  const isPositive = stockData.currentPrice >= baselinePrice;
  const lineColor = isPositive ? "#22c55e" : "#ef4444";

  // Format data for Recharts
  const chartData = stockData.priceHistory.map((point) => ({
    date: new Date(point.timestamp).getTime(),
    price: point.price,
    formattedDate: format(new Date(point.timestamp), "MMM d"),
  }));

  return (
    <div className="space-y-2">
      {/* Current Price */}
      <div className="flex items-baseline gap-2">
        <span className="text-lg font-bold">${stockData.currentPrice.toFixed(2)}</span>
        <span
          className={cn(
            "text-xs font-medium",
            stockData.change24h > 0 ? "text-green-500" : "text-red-500"
          )}
        >
          {stockData.change24h > 0 ? "+" : ""}
          {stockData.changePercent24h.toFixed(2)}%
        </span>
      </div>

      {/* Chart */}
      <div className="w-full h-[120px]">
        <ResponsiveContainer width="100%" height="100%">
        <AreaChart data={chartData}>
          <defs>
            <linearGradient id={`gradient-${symbol}`} x1="0" y1="0" x2="0" y2="1">
              <stop offset="5%" stopColor={lineColor} stopOpacity={0.3} />
              <stop offset="95%" stopColor={lineColor} stopOpacity={0} />
            </linearGradient>
          </defs>

          <XAxis
            dataKey="date"
            type="number"
            domain={["dataMin", "dataMax"]}
            hide
          />

          <YAxis domain={["auto", "auto"]} hide />

          <Tooltip
            contentStyle={{
              backgroundColor: "#1e293b",
              border: "1px solid #334155",
              borderRadius: "0.5rem",
              fontSize: "12px",
            }}
            labelFormatter={(timestamp) => format(new Date(timestamp), "MMM d")}
            formatter={(value: number) => [`$${value.toFixed(2)}`, "Price"]}
          />

          {/* Event baseline reference line */}
          <ReferenceLine
            x={eventDate.getTime()}
            stroke="#94a3b8"
            strokeDasharray="3 3"
            strokeWidth={1}
          />

          <Area
            type="monotone"
            dataKey="price"
            stroke={lineColor}
            strokeWidth={2}
            fill={`url(#gradient-${symbol})`}
            isAnimationActive={false}
          />
        </AreaChart>
      </ResponsiveContainer>
      </div>
    </div>
  );
}

// Generate mock stock data for now
function generateMockStockData(symbol: string, eventTimestamp: string): StockData {
  const basePrices: Record<string, number> = {
    AAPL: 185, MSFT: 420, GOOGL: 145, AMZN: 175, TSLA: 250, NVDA: 880,
    META: 480, COIN: 185, MSTR: 1450, JPM: 195, BAC: 38, NEM: 45,
    GOLD: 18, FNV: 135, WPM: 52, RGLD: 120, AEM: 65, KGC: 8,
  };

  const basePrice = basePrices[symbol] || 100;
  const priceHistory: PriceDataPoint[] = [];
  let currentPrice = basePrice;

  const now = new Date();
  for (let i = 29; i >= 0; i--) {
    const date = new Date(now);
    date.setDate(date.getDate() - i);

    const changePercent = (Math.random() - 0.5) * 0.04;
    currentPrice = currentPrice * (1 + changePercent);

    priceHistory.push({
      timestamp: date.toISOString(),
      price: parseFloat(currentPrice.toFixed(2)),
      volume: Math.floor(Math.random() * 50_000_000 + 10_000_000),
    });
  }

  const latestPrice = priceHistory[priceHistory.length - 1].price;
  const yesterdayPrice = priceHistory[priceHistory.length - 2].price;

  return {
    symbol,
    currentPrice: latestPrice,
    priceHistory,
    change24h: latestPrice - yesterdayPrice,
    changePercent24h: ((latestPrice - yesterdayPrice) / yesterdayPrice) * 100,
    eventTimestamp,
  };
}
