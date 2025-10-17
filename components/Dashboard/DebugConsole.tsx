"use client";

import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { PollStatus } from "@/lib/hooks/useFrontierEvents";
import { Activity, Clock, CheckCircle2, XCircle, Loader2 } from "lucide-react";
import { cn } from "@/lib/utils";

interface DebugConsoleProps {
  pollStatus: PollStatus;
}

export function DebugConsole({ pollStatus }: DebugConsoleProps) {
  const formatTime = (date: Date | null) => {
    if (!date) return "Never";
    return date.toLocaleTimeString();
  };

  return (
    <Card className="fixed top-4 right-4 w-80 bg-slate-900/95 backdrop-blur-sm border-slate-700 shadow-xl z-50">
      <CardHeader className="pb-3">
        <CardTitle className="text-sm font-medium flex items-center gap-2">
          <Activity className="w-4 h-4 text-blue-400" />
          Debug Console
        </CardTitle>
      </CardHeader>

      <CardContent className="space-y-3 text-xs">
        {/* Polling Status */}
        <div className="flex items-center justify-between">
          <span className="text-slate-400">Status:</span>
          <Badge
            variant={pollStatus.isPolling ? "default" : "secondary"}
            className={cn(
              "text-xs",
              pollStatus.isPolling && "bg-blue-500",
              pollStatus.error && "bg-red-500"
            )}
          >
            {pollStatus.isPolling ? (
              <>
                <Loader2 className="w-3 h-3 mr-1 animate-spin" />
                Polling...
              </>
            ) : pollStatus.error ? (
              <>
                <XCircle className="w-3 h-3 mr-1" />
                Error
              </>
            ) : (
              <>
                <CheckCircle2 className="w-3 h-3 mr-1" />
                Idle
              </>
            )}
          </Badge>
        </div>

        {/* Countdown */}
        <div className="flex items-center justify-between">
          <span className="text-slate-400">Next poll in:</span>
          <div className="flex items-center gap-1 font-mono">
            <Clock className="w-3 h-3 text-amber-400" />
            <span
              className={cn(
                "font-bold",
                pollStatus.nextPollIn <= 1 ? "text-amber-400" : "text-slate-200"
              )}
            >
              {pollStatus.nextPollIn}s
            </span>
          </div>
        </div>

        {/* Last Poll Time */}
        <div className="flex items-center justify-between">
          <span className="text-slate-400">Last poll:</span>
          <span className="text-slate-200 font-mono">{formatTime(pollStatus.lastPollTime)}</span>
        </div>

        {/* Separator */}
        <div className="border-t border-slate-700 pt-3 mt-3">
          {pollStatus.lastResult ? (
            <div className="space-y-2">
              <div className="flex items-center justify-between">
                <span className="text-slate-400">Events fetched:</span>
                <span className="text-green-400 font-bold">
                  {pollStatus.lastResult.eventCount}
                </span>
              </div>
              <div className="flex items-center justify-between">
                <span className="text-slate-400">Volume spikes:</span>
                <span className="text-amber-400 font-bold">
                  {pollStatus.lastResult.spikeCount}
                </span>
              </div>
            </div>
          ) : (
            <div className="text-slate-500 italic">No data yet</div>
          )}
        </div>

        {/* Error Display */}
        {pollStatus.error && (
          <div className="bg-red-500/10 border border-red-500/50 rounded px-2 py-1.5 mt-2">
            <p className="text-red-400 text-xs break-words">{pollStatus.error}</p>
          </div>
        )}

        {/* Info */}
        <div className="text-slate-500 text-[10px] mt-3 pt-3 border-t border-slate-700">
          Polling every 5 seconds
        </div>
      </CardContent>
    </Card>
  );
}
