"use client";

import { useState, useEffect } from "react";
import { PolymarketEvent } from "@/lib/types";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { cn } from "@/lib/utils";
import { TrendingUp, Activity, Zap, Clock, Flame } from "lucide-react";
import { formatRelativeTime, formatVolume, isRecentlyUpdated, getRecencyIntensity } from "@/lib/utils/time";

interface EventCardProps {
  event: PolymarketEvent;
  onSelect: () => void;
}

export function EventCard({ event, onSelect }: EventCardProps) {
  const hasVolumeSpike = event.volumeSpike !== null && event.volumeSpike >= 1.3;

  // Update relative time and recency every second
  const [relativeTime, setRelativeTime] = useState(() => formatRelativeTime(event.detectedAt));
  const [isRecent, setIsRecent] = useState(() => isRecentlyUpdated(event.detectedAt));
  const [intensity, setIntensity] = useState(() => getRecencyIntensity(event.detectedAt));

  useEffect(() => {
    const interval = setInterval(() => {
      setRelativeTime(formatRelativeTime(event.detectedAt));
      setIsRecent(isRecentlyUpdated(event.detectedAt));
      setIntensity(getRecencyIntensity(event.detectedAt));
    }, 1000);

    return () => clearInterval(interval);
  }, [event.detectedAt]);

  return (
    <Card
      className={cn(
        "cursor-pointer transition-all duration-500 hover:shadow-lg hover:border-slate-600",
        "overflow-hidden",
        hasVolumeSpike && "border-amber-500/50 shadow-amber-500/10",
        // Add glow effect for recently updated events
        isRecent && intensity > 0.7 && "shadow-amber-500/30 animate-pulse-slow",
        isRecent && intensity === 1.0 && "border-amber-400 shadow-amber-400/40"
      )}
      onClick={onSelect}
    >
      <CardContent className="p-4">
        <div className="flex gap-4">
          {/* Left side: Probability Chart */}
          <div className="flex flex-col items-center justify-center bg-slate-900/50 rounded-lg px-4 py-3 min-w-[100px]">
            <div className="text-3xl font-bold text-white mb-1">
              {(event.probability * 100).toFixed(0)}%
            </div>
            <div className="text-xs text-slate-400">Chance</div>
            {hasVolumeSpike && (
              <Badge variant="outline" className="mt-2 text-xs text-amber-400 border-amber-400/50">
                <Zap className="w-3 h-3 mr-1" />
                {event.volumeSpike.toFixed(1)}x
              </Badge>
            )}
          </div>

          {/* Right side: Event details */}
          <div className="flex-1 min-w-0">
            {/* Title with relative time */}
            <div className="flex items-start justify-between gap-2 mb-2">
              <div className="flex items-center gap-2 flex-1">
                {isRecent && (
                  <Flame
                    className={cn(
                      "w-4 h-4 flex-shrink-0",
                      intensity === 1.0 && "text-orange-500 animate-pulse",
                      intensity > 0.7 && intensity < 1.0 && "text-orange-400",
                      intensity <= 0.7 && "text-amber-400"
                    )}
                  />
                )}
                <h3 className="text-base font-semibold line-clamp-2 leading-snug">
                  {event.title}
                </h3>
              </div>
              {hasVolumeSpike && (
                <div className="flex items-center gap-1 text-xs text-amber-400 flex-shrink-0">
                  <Clock className="w-3 h-3" />
                  <span className="font-mono">{relativeTime}</span>
                </div>
              )}
            </div>

            {/* Description */}
            <p className="text-sm text-slate-400 mb-3 line-clamp-2 leading-relaxed">
              {event.description}
            </p>

            {/* Stats */}
            <div className="flex items-center gap-4 text-xs">
              <div className="flex items-center gap-1.5 text-slate-300">
                <Activity className="w-3.5 h-3.5" />
                <span className="font-medium">{formatVolume(event.volume24hr)}</span>
                <span className="text-slate-500">volume</span>
              </div>

              {event.oneDayPriceChange !== null && event.oneDayPriceChange !== 0 && (
                <div className="flex items-center gap-1">
                  <TrendingUp
                    className={cn(
                      "w-3.5 h-3.5",
                      event.oneDayPriceChange > 0 ? "text-green-400" : "text-red-400 rotate-180"
                    )}
                  />
                  <span
                    className={cn(
                      "font-medium",
                      event.oneDayPriceChange > 0 ? "text-green-400" : "text-red-400"
                    )}
                  >
                    {event.oneDayPriceChange > 0 ? "+" : ""}
                    {(event.oneDayPriceChange * 100).toFixed(1)}%
                  </span>
                </div>
              )}

              {event.liquidityNum > 0 && (
                <span className="text-slate-500">
                  {formatVolume(event.liquidityNum)} liquidity
                </span>
              )}
            </div>
          </div>
        </div>
      </CardContent>
    </Card>
  );
}
