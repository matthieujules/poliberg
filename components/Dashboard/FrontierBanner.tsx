"use client";

import { PolymarketEvent } from "@/lib/types";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { TrendingUp, Activity, Zap } from "lucide-react";
import { cn } from "@/lib/utils";

interface FrontierBannerProps {
  event: PolymarketEvent;
  onSelect: () => void;
}

function formatVolume(volume: number): string {
  if (volume >= 1_000_000) {
    return `$${(volume / 1_000_000).toFixed(2)}M`;
  } else if (volume >= 1_000) {
    return `$${(volume / 1_000).toFixed(1)}k`;
  }
  return `$${volume.toFixed(0)}`;
}

export function FrontierBanner({ event, onSelect }: FrontierBannerProps) {
  const hasVolumeSpike = event.volumeSpike !== null && event.volumeSpike >= 1.5;

  return (
    <Card
      className={cn(
        "w-full cursor-pointer transition-all hover:shadow-xl hover:border-slate-600",
        hasVolumeSpike && "border-amber-500/50 shadow-amber-500/20"
      )}
      onClick={onSelect}
    >
      <CardContent className="p-6">
        <div className="flex flex-col md:flex-row items-start md:items-center gap-4">
          <div className="flex-1 space-y-3">
            <div className="flex items-center gap-2 flex-wrap">
              {hasVolumeSpike && (
                <Badge variant="default" className="bg-amber-500 hover:bg-amber-600">
                  <Zap className="w-3 h-3 mr-1" />
                  {event.volumeSpike.toFixed(1)}x Volume Spike
                </Badge>
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
