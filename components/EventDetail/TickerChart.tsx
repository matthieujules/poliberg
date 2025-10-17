"use client";

import { StockData } from "@/lib/types";
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

interface TickerChartProps {
  stockData: StockData;
  eventTimestamp: string;
}

export function TickerChart({ stockData, eventTimestamp }: TickerChartProps) {
  // Find the baseline price (price at event timestamp)
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
  const areaColor = isPositive ? "#22c55e" : "#ef4444";

  // Format data for Recharts
  const chartData = stockData.priceHistory.map((point) => ({
    date: new Date(point.timestamp).getTime(),
    price: point.price,
    formattedDate: format(new Date(point.timestamp), "MMM d"),
  }));

  return (
    <div className="w-full h-[200px]">
      <ResponsiveContainer width="100%" height="100%">
        <AreaChart data={chartData}>
          <defs>
            <linearGradient id={`gradient-${stockData.symbol}`} x1="0" y1="0" x2="0" y2="1">
              <stop offset="5%" stopColor={areaColor} stopOpacity={0.3} />
              <stop offset="95%" stopColor={areaColor} stopOpacity={0} />
            </linearGradient>
          </defs>

          <XAxis
            dataKey="date"
            type="number"
            domain={["dataMin", "dataMax"]}
            tickFormatter={(timestamp) => format(new Date(timestamp), "MMM d")}
            stroke="#64748b"
            fontSize={12}
            tickLine={false}
          />

          <YAxis
            domain={["auto", "auto"]}
            tickFormatter={(value) => `$${value.toFixed(0)}`}
            stroke="#64748b"
            fontSize={12}
            tickLine={false}
            width={60}
          />

          <Tooltip
            contentStyle={{
              backgroundColor: "#1e293b",
              border: "1px solid #334155",
              borderRadius: "0.5rem",
            }}
            labelFormatter={(timestamp) => format(new Date(timestamp), "MMM d, yyyy")}
            formatter={(value: number) => [`$${value.toFixed(2)}`, "Price"]}
          />

          {/* Event baseline reference line */}
          <ReferenceLine
            x={eventDate.getTime()}
            stroke="#94a3b8"
            strokeDasharray="3 3"
            label={{
              value: "Event",
              position: "top",
              fill: "#94a3b8",
              fontSize: 10,
            }}
          />

          <Area
            type="monotone"
            dataKey="price"
            stroke={lineColor}
            strokeWidth={2}
            fill={`url(#gradient-${stockData.symbol})`}
            isAnimationActive={true}
          />
        </AreaChart>
      </ResponsiveContainer>
    </div>
  );
}
