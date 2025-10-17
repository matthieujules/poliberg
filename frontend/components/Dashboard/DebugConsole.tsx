"use client";

import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Separator } from "@/components/ui/separator";
import { PollStatus } from "@/lib/hooks/useFrontierEvents";
import { EventChange } from "@/lib/services/api";
import { Activity, Clock, CheckCircle2, XCircle, Loader2, TrendingUp, TrendingDown, Plus, Trash2 } from "lucide-react";
import { cn } from "@/lib/utils";

interface DebugConsoleProps {
  pollStatus: PollStatus;
}

function getChangeIcon(changeType: string) {
  switch (changeType) {
    case "new_spike":
      return <Plus className="w-3 h-3 text-green-400" />;
    case "spike_increased":
      return <TrendingUp className="w-3 h-3 text-blue-400" />;
    case "spike_decreased":
      return <TrendingDown className="w-3 h-3 text-yellow-400" />;
    case "spike_removed":
      return <Trash2 className="w-3 h-3 text-red-400" />;
    default:
      return <Activity className="w-3 h-3" />;
  }
}

function getChangeLabel(changeType: string) {
  switch (changeType) {
    case "new_spike":
      return "NEW";
    case "spike_increased":
      return "UP";
    case "spike_decreased":
      return "DOWN";
    case "spike_removed":
      return "GONE";
    default:
      return changeType;
  }
}

function getChangeColor(changeType: string) {
  switch (changeType) {
    case "new_spike":
      return "text-green-400";
    case "spike_increased":
      return "text-blue-400";
    case "spike_decreased":
      return "text-yellow-400";
    case "spike_removed":
      return "text-red-400";
    default:
      return "text-slate-400";
  }
}

export function DebugConsole({ pollStatus }: DebugConsoleProps) {
  const formatTime = (date: Date | null) => {
    if (!date) return "Never";
    return date.toLocaleTimeString();
  };

  return (
    <Card className="fixed top-4 right-4 w-96 max-h-[90vh] overflow-y-auto bg-slate-900/95 backdrop-blur-sm border-slate-700 shadow-xl z-50">
      <CardHeader className="pb-3 sticky top-0 bg-slate-900/95 backdrop-blur-sm">
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

        <Separator className="bg-slate-700" />

        {/* Last Poll Results */}
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
            <div className="flex items-center justify-between">
              <span className="text-slate-400">Changes detected:</span>
              <span className="text-blue-400 font-bold">
                {pollStatus.lastResult.changesDetected}
              </span>
            </div>
          </div>
        ) : (
          <div className="text-slate-500 italic">No data yet</div>
        )}

        {/* Recent Changes */}
        {pollStatus.recentChanges.length > 0 && (
          <>
            <Separator className="bg-slate-700" />
            <div>
              <div className="text-slate-400 font-medium mb-2">Recent Changes:</div>
              <div className="space-y-1.5 max-h-64 overflow-y-auto">
                {pollStatus.recentChanges.map((change, idx) => (
                  <div
                    key={`${change.eventId}-${change.timestamp}-${idx}`}
                    className="bg-slate-800/50 rounded px-2 py-1.5 text-[10px]"
                  >
                    <div className="flex items-start gap-2">
                      <div className="flex-shrink-0 mt-0.5">
                        {getChangeIcon(change.changeType)}
                      </div>
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center gap-1.5 mb-0.5">
                          <Badge
                            variant="outline"
                            className={cn("text-[9px] px-1 py-0", getChangeColor(change.changeType))}
                          >
                            {getChangeLabel(change.changeType)}
                          </Badge>
                          {change.newSpikeRatio && (
                            <span className="text-amber-400 font-mono font-bold">
                              {change.newSpikeRatio.toFixed(1)}x
                            </span>
                          )}
                        </div>
                        <div className="text-slate-300 truncate leading-tight">
                          {change.eventTitle}
                        </div>
                        <div className="text-slate-500 mt-0.5">
                          {new Date(change.timestamp).toLocaleTimeString()}
                        </div>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </>
        )}

        {/* Error Display */}
        {pollStatus.error && (
          <div className="bg-red-500/10 border border-red-500/50 rounded px-2 py-1.5 mt-2">
            <p className="text-red-400 text-xs break-words">{pollStatus.error}</p>
          </div>
        )}

        {/* Info */}
        <Separator className="bg-slate-700" />
        <div className="text-slate-500 text-[10px]">
          Polling every 5 seconds for volume spike changes
        </div>
      </CardContent>
    </Card>
  );
}
