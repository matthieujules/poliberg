"use client";

import { useEffect } from "react";
import { useEventStore } from "@/lib/store/eventStore";
import { useFrontierEvents } from "@/lib/hooks/useFrontierEvents";
import { FrontierBanner } from "@/components/Dashboard/FrontierBanner";
import { EventGrid } from "@/components/Dashboard/EventGrid";
import { EventDetailView } from "@/components/EventDetail/EventDetailView";
import { DebugConsole } from "@/components/Dashboard/DebugConsole";

export default function Home() {
  const events = useEventStore((state) => state.events);
  const featuredEvent = useEventStore((state) => state.featuredEvent);
  const selectedEventId = useEventStore((state) => state.selectedEventId);
  const selectEvent = useEventStore((state) => state.selectEvent);
  const clearSelection = useEventStore((state) => state.clearSelection);

  // Fetch events from backend and poll for updates every 5s
  const { pollStatus } = useFrontierEvents({
    limit: 20,
    spikeOnly: false,
    pollInterval: 5000, // Poll every 5 seconds
  });

  useEffect(() => {
    console.log("[Dashboard] Mounted with", events.length, "events");
  }, [events.length]);

  // Get events excluding the featured one
  const gridEvents = events.slice(1);

  // If an event is selected, show detail view
  if (selectedEventId) {
    return <EventDetailView eventId={selectedEventId} onClose={clearSelection} />;
  }

  // Otherwise show dashboard
  return (
    <div className="min-h-screen bg-slate-950 text-slate-50">
      {/* Debug Console */}
      <DebugConsole pollStatus={pollStatus} />

      {/* Header */}
      <header className="border-b border-slate-800 bg-slate-950/80 backdrop-blur-sm sticky top-0 z-50">
        <div className="container mx-auto px-4 py-4">
          <h1 className="text-xl font-bold">Polymarket Frontier</h1>
        </div>
      </header>

      {/* Main Content */}
      <main className="container mx-auto px-4 py-6">
        <div className="flex flex-col gap-6">
          {/* Featured Event Banner */}
          {featuredEvent && (
            <section>
              <FrontierBanner
                event={featuredEvent}
                onSelect={() => selectEvent(featuredEvent.id)}
              />
            </section>
          )}

          {/* Event Grid */}
          {gridEvents.length > 0 && (
            <section>
              <EventGrid
                events={gridEvents}
                onSelectEvent={selectEvent}
              />
            </section>
          )}
        </div>
      </main>
    </div>
  );
}
