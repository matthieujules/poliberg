"use client";

import { useState, useEffect } from "react";
import { PolymarketEvent } from "@/lib/types";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { TrendingUp, Activity, Zap, Clock, Flame } from "lucide-react";
import { cn } from "@/lib/utils";
import { formatRelativeTime, formatVolume, isRecentlyUpdated, getRecencyIntensity } from "@/lib/utils/time";

interface FrontierBannerProps {
  event: PolymarketEvent;
  onSelect: () => void;
}

export function FrontierBanner({ event, onSelect }: FrontierBannerProps) {
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
        "w-full cursor-pointer transition-all duration-500 hover:shadow-xl hover:border-slate-600",
        hasVolumeSpike && "border-amber-500/50 shadow-amber-500/20",
        // Enhanced glow for recently updated featured event
        isRecent && intensity > 0.7 && "shadow-amber-500/40 animate-pulse-slow",
        isRecent && intensity === 1.0 && "border-amber-400 shadow-amber-400/50"
      )}
      onClick={onSelect}
    >
      <CardContent className="p-6">
        <div className="flex flex-col md:flex-row items-start md:items-center gap-4">
          <div className="flex-1 space-y-3">
            <div className="flex items-center gap-2 flex-wrap">
              {hasVolumeSpike && (
                <>
                  <Badge variant="default" className="bg-amber-500 hover:bg-amber-600">
                    <Zap className="w-3 h-3 mr-1" />
                    {event.volumeSpike.toFixed(1)}x Volume Spike
                  </Badge>
                  <Badge variant="outline" className="text-amber-400 border-amber-400/50">
                    <Clock className="w-3 h-3 mr-1" />
                    {relativeTime}
                  </Badge>
                  {isRecent && (
                    <Badge
                      variant="outline"
                      className={cn(
                        "border-orange-500/50",
                        intensity === 1.0 && "text-orange-500 animate-pulse",
                        intensity > 0.7 && intensity < 1.0 && "text-orange-400",
                        intensity <= 0.7 && "text-amber-400"
                      )}
                    >
                      <Flame className="w-3 h-3 mr-1" />
                      HOT
                    </Badge>
                  )}
                </>
              )}
              <Badge variant="secondary" className="text-sm">
                {(event.probability * 100).toFixed(0)}% probability
              </Badge>
            </div>

            <h3 className="text-lg md:text-xl font-bold leading-tight">{event.title}</h3>

            <div className="flex items-center gap-6 text-sm text-slate-400">
              <div className="flex items-center gap-2">
                <Activity className="w-4 h-4" />
                <span className="font-medium">{formatVolume(event.volume24hr)}</span>
                <span className="text-xs">24h volume</span>
              </div>

              {event.oneDayPriceChange !== null && (
                <div className="flex items-center gap-2">
                  <TrendingUp
                    className={cn(
                      "w-4 h-4",
                      event.oneDayPriceChange > 0 ? "text-green-400" : "text-red-400"
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
                  <span className="text-xs">24h change</span>
                </div>
              )}
            </div>
          </div>
        </div>
      </CardContent>
    </Card>
  );
}
