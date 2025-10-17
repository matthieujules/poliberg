"use client";

import { useMemo } from "react";
import { AreaChart, Area, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, Line, ComposedChart } from "recharts";
import { format } from "date-fns";
import { PriceHistoryPoint } from "@/lib/types";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { TrendingUp } from "lucide-react";

interface MarketChartProps {
  priceHistory: PriceHistoryPoint[];
  interval: string;
  onIntervalChange: (interval: string) => void;
  isLoading?: boolean;
}

const INTERVALS = [
  { value: "1h", label: "1H" },
  { value: "1d", label: "1D" },
  { value: "1w", label: "1W" },
  { value: "1m", label: "1M" },
  { value: "max", label: "ALL" },
];

export function MarketChart({ priceHistory, interval, onIntervalChange, isLoading = false }: MarketChartProps) {
  // Transform data for Recharts (convert unix timestamp to Date and probability to percentage)
  const chartData = useMemo(() => {
    return priceHistory.map((point) => ({
      timestamp: point.t * 1000, // Convert to milliseconds
      probability: point.p * 100, // Convert to percentage
      date: new Date(point.t * 1000),
    }));
  }, [priceHistory]);

  // Calculate price change
  const priceChange = useMemo(() => {
    if (chartData.length < 2) return null;
    const first = chartData[0].probability;
    const last = chartData[chartData.length - 1].probability;
    const change = last - first;
    const percentChange = (change / first) * 100;
    return { absolute: change, percent: percentChange };
  }, [chartData]);

  const isPositive = priceChange && priceChange.absolute >= 0;

  // Custom tooltip
  const CustomTooltip = ({ active, payload }: any) => {
    if (active && payload && payload.length) {
      const data = payload[0].payload;
      return (
        <div className="bg-slate-900/95 backdrop-blur-sm border border-slate-700/50 rounded-xl px-4 py-3 shadow-2xl">
          <p className="text-xs text-slate-400 mb-1.5 font-medium">
            {format(data.date, "MMM d, yyyy h:mm a")}
          </p>
          <p className="text-2xl font-bold bg-gradient-to-r from-emerald-400 to-cyan-400 bg-clip-text text-transparent">
            {data.probability.toFixed(2)}%
          </p>
        </div>
      );
    }
    return null;
  };

  // Format X-axis labels
  const formatXAxis = (timestamp: number) => {
    const date = new Date(timestamp);
    switch (interval) {
      case "1h":
        return format(date, "h:mm a");
      case "1d":
        return format(date, "h a");
      case "1w":
        return format(date, "MMM d");
      case "1m":
      case "max":
        return format(date, "MMM d");
      default:
        return format(date, "MMM d");
    }
  };

  if (isLoading) {
    return (
      <Card className="w-full bg-gradient-to-br from-slate-900 to-slate-950 border-slate-800">
        <CardContent className="p-6">
          <div className="animate-pulse">
            <div className="h-8 bg-slate-700/50 rounded-lg w-1/4 mb-4"></div>
            <div className="h-[350px] bg-slate-800/30 rounded-xl"></div>
          </div>
        </CardContent>
      </Card>
    );
  }

  if (chartData.length === 0) {
    return (
      <Card className="w-full bg-gradient-to-br from-slate-900 to-slate-950 border-slate-800">
        <CardContent className="p-6">
          <p className="text-slate-400 text-center py-12">No price history available for this market</p>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card className="w-full bg-gradient-to-br from-slate-900 via-slate-900/95 to-slate-950 border-slate-800/50 shadow-xl">
      <CardContent className="p-6">
        {/* Header with interval selector */}
        <div className="flex items-center justify-between mb-6">
          <div>
            <div className="flex items-center gap-2 mb-2">
              <TrendingUp className={`w-5 h-5 ${isPositive ? "text-emerald-400" : "text-red-400"}`} />
              <h3 className="text-lg font-semibold bg-gradient-to-r from-slate-50 to-slate-300 bg-clip-text text-transparent">
                Probability Over Time
              </h3>
            </div>
            {priceChange && (
              <div className="flex items-center gap-3">
                <span className="text-3xl font-bold bg-gradient-to-r from-emerald-400 via-cyan-400 to-blue-400 bg-clip-text text-transparent">
                  {chartData[chartData.length - 1].probability.toFixed(1)}%
                </span>
                <Badge
                  variant="outline"
                  className={`${
                    isPositive
                      ? "border-emerald-500/30 bg-emerald-500/10 text-emerald-400"
                      : "border-red-500/30 bg-red-500/10 text-red-400"
                  } px-3 py-1 text-sm font-semibold`}
                >
                  {priceChange.absolute >= 0 ? "+" : ""}
                  {priceChange.absolute.toFixed(1)}%
                </Badge>
              </div>
            )}
          </div>

          {/* Interval selector */}
          <div className="flex gap-1.5 bg-slate-800/50 backdrop-blur-sm rounded-xl p-1.5 border border-slate-700/50">
            {INTERVALS.map((int) => (
              <button
                key={int.value}
                onClick={() => onIntervalChange(int.value)}
                className={`px-4 py-2 text-sm font-medium rounded-lg transition-all duration-200 ${
                  interval === int.value
                    ? "bg-gradient-to-r from-emerald-600 to-cyan-600 text-white shadow-lg shadow-emerald-500/20"
                    : "text-slate-400 hover:text-white hover:bg-slate-700/50"
                }`}
              >
                {int.label}
              </button>
            ))}
          </div>
        </div>

        {/* Chart */}
        <div className="bg-slate-950/50 rounded-xl p-4 border border-slate-800/50">
          <ResponsiveContainer width="100%" height={350}>
            <ComposedChart data={chartData} margin={{ top: 10, right: 20, left: 0, bottom: 0 }}>
              <defs>
                <linearGradient id="colorProbability" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="5%" stopColor="#10b981" stopOpacity={0.4} />
                  <stop offset="50%" stopColor="#06b6d4" stopOpacity={0.2} />
                  <stop offset="95%" stopColor="#3b82f6" stopOpacity={0.05} />
                </linearGradient>
                <filter id="glow">
                  <feGaussianBlur stdDeviation="3" result="coloredBlur"/>
                  <feMerge>
                    <feMergeNode in="coloredBlur"/>
                    <feMergeNode in="SourceGraphic"/>
                  </feMerge>
                </filter>
              </defs>
              <CartesianGrid strokeDasharray="3 3" stroke="#1e293b" strokeOpacity={0.3} />
              <XAxis
                dataKey="timestamp"
                tickFormatter={formatXAxis}
                stroke="#475569"
                style={{ fontSize: "12px", fontWeight: 500 }}
                tickLine={{ stroke: "#334155" }}
              />
              <YAxis
                domain={[0, 100]}
                tickFormatter={(value) => `${value}%`}
                stroke="#475569"
                style={{ fontSize: "12px", fontWeight: 500 }}
                tickLine={{ stroke: "#334155" }}
              />
              <Tooltip content={<CustomTooltip />} cursor={{ stroke: "#10b981", strokeWidth: 1, strokeDasharray: "3 3" }} />
              <Area
                type="monotone"
                dataKey="probability"
                stroke="#10b981"
                strokeWidth={3}
                fillOpacity={1}
                fill="url(#colorProbability)"
                filter="url(#glow)"
              />
              <Line
                type="monotone"
                dataKey="probability"
                stroke="#10b981"
                strokeWidth={2}
                dot={false}
                activeDot={{ r: 6, fill: "#10b981", stroke: "#fff", strokeWidth: 2 }}
              />
            </ComposedChart>
          </ResponsiveContainer>
        </div>
      </CardContent>
    </Card>
  );
}
