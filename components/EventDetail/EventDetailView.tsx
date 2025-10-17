"use client";

import { useEffect } from "react";
import { useEventStore } from "@/lib/store/eventStore";
import { orchestrateEventDetail } from "@/lib/services/mockOrchestrator";
import { Button } from "@/components/ui/button";
import { ArrowLeft } from "lucide-react";
import { OrchestratorStatus } from "./OrchestratorStatus";
import { TickerGrid } from "./TickerGrid";
import { NewsDigest } from "./NewsDigest";
import { Separator } from "@/components/ui/separator";

interface EventDetailViewProps {
  eventId: string;
  onClose: () => void;
}

export function EventDetailView({ eventId, onClose }: EventDetailViewProps) {
  const event = useEventStore((state) => state.events.find((e) => e.id === eventId));
  const eventDetailData = useEventStore((state) => state.eventDetailData[eventId]);
  const updateEventDetail = useEventStore((state) => state.updateEventDetail);

  useEffect(() => {
    if (!event || !eventDetailData) return;

    // Only trigger orchestration if we haven't started yet
    if (eventDetailData.status === "idle") {
      // Start orchestration
      orchestrateEventDetail(event, (status) => {
        updateEventDetail(eventId, { status });
      }).then((data) => {
        updateEventDetail(eventId, data);
      });
    }
  }, [event, eventDetailData, eventId, updateEventDetail]);

  if (!event || !eventDetailData) {
    return null;
  }

  return (
    <div className="fixed inset-0 bg-slate-950 z-50 flex flex-col">
      {/* Fixed Header with Back Button */}
      <header className="flex-shrink-0 bg-slate-900 border-b border-slate-800">
        <div className="container mx-auto px-6 py-6">
          <div className="flex items-center gap-4">
            <Button
              variant="outline"
              size="lg"
              onClick={onClose}
              className="gap-2 font-medium"
            >
              <ArrowLeft className="w-5 h-5" />
              Back to Events
            </Button>
          </div>
          <div className="mt-4">
            <h1 className="text-2xl font-bold text-slate-50">{event.title}</h1>
            <p className="text-base text-slate-200 mt-2">{event.description}</p>
          </div>
        </div>
      </header>

      {/* Orchestrator Status */}
      <OrchestratorStatus status={eventDetailData.status} error={eventDetailData.error} />

      {/* Scrollable Content */}
      <main className="flex-1 overflow-y-auto bg-slate-950">
        <div className="container mx-auto px-6 py-8 space-y-8">
          {/* Ticker Grid */}
          {eventDetailData.tickers.length > 0 && (
            <>
              <TickerGrid
                tickers={eventDetailData.tickers}
                stockData={eventDetailData.stockData}
                eventTimestamp={event.detectedAt}
              />
              <Separator className="bg-slate-800" />
            </>
          )}

          {/* News Digest */}
          {eventDetailData.news.length > 0 && <NewsDigest news={eventDetailData.news} />}
        </div>
      </main>
    </div>
  );
}
