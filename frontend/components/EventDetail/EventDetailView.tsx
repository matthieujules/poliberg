"use client";

import { useEventStore } from "@/lib/store/eventStore";
import { Button } from "@/components/ui/button";
import { ArrowLeft } from "lucide-react";
import { TickerList } from "./TickerList";
import { Separator } from "@/components/ui/separator";

interface EventDetailViewProps {
  eventId: string;
  onClose: () => void;
}

export function EventDetailView({ eventId, onClose }: EventDetailViewProps) {
  const event = useEventStore((state) => state.events.find((e) => e.id === eventId));

  if (!event) {
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
            <p className="text-base text-slate-300 mt-2">{event.description}</p>
          </div>
        </div>
      </header>

      {/* Scrollable Content */}
      <main className="flex-1 overflow-y-auto bg-slate-950">
        <div className="container mx-auto px-6 py-8 space-y-8">
          {/* GPT-Mapped Tickers */}
          <TickerList eventId={eventId} event={event} />
        </div>
      </main>
    </div>
  );
}
