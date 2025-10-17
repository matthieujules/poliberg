"use client";

import { OrchestratorStatus as Status } from "@/lib/types";
import { Progress } from "@/components/ui/progress";
import { CheckCircle2, XCircle, Loader2 } from "lucide-react";
import { cn } from "@/lib/utils";

interface OrchestratorStatusProps {
  status: Status;
  error?: string;
}

export function OrchestratorStatus({ status, error }: OrchestratorStatusProps) {
  if (status === "idle") {
    return null;
  }

  const statusConfig = {
    fetching_tickers: {
      text: "Analyzing market correlations...",
      progress: 33,
      icon: <Loader2 className="w-4 h-4 animate-spin" />,
    },
    fetching_prices: {
      text: "Fetching stock data...",
      progress: 66,
      icon: <Loader2 className="w-4 h-4 animate-spin" />,
    },
    fetching_news: {
      text: "Gathering news context...",
      progress: 90,
      icon: <Loader2 className="w-4 h-4 animate-spin" />,
    },
    complete: {
      text: "Analysis complete",
      progress: 100,
      icon: <CheckCircle2 className="w-4 h-4 text-green-500" />,
    },
    error: {
      text: error || "Failed to load data",
      progress: 0,
      icon: <XCircle className="w-4 h-4 text-red-500" />,
    },
    idle: {
      text: "",
      progress: 0,
      icon: null,
    },
  };

  const config = statusConfig[status];

  return (
    <div
      className={cn(
        "sticky top-0 z-10 bg-slate-950/95 backdrop-blur-sm border-b border-slate-800 p-4 transition-all",
        status === "complete" && "animate-out fade-out duration-1000 delay-2000"
      )}
    >
      <div className="flex items-center gap-3">
        {config.icon}
        <span className="text-sm font-medium">{config.text}</span>
      </div>

      {status !== "idle" && status !== "complete" && status !== "error" && (
        <Progress value={config.progress} className="mt-2 h-1" />
      )}
    </div>
  );
}
