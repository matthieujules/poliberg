"use client";

import { useEffect, useState } from "react";
import { useEventStore } from "@/lib/store/eventStore";
import { useFrontierEvents } from "@/lib/hooks/useFrontierEvents";
import { FrontierBanner } from "@/components/Dashboard/FrontierBanner";
import { EventGrid } from "@/components/Dashboard/EventGrid";
import { EventDetailView } from "@/components/EventDetail/EventDetailView";
import { DebugConsole } from "@/components/Dashboard/DebugConsole";
import { Visualization3DOverlay } from "@/components/Visualization3D/Visualization3DOverlay";
import ChatWidget from "@/components/ChatWidget";
import { NewsScraper } from "@/components/NewsScraper";
import { Box } from "lucide-react";

export default function Home() {
  const events = useEventStore((state) => state.events);
  const featuredEvent = useEventStore((state) => state.featuredEvent);
  const selectedEventId = useEventStore((state) => state.selectedEventId);
  const selectEvent = useEventStore((state) => state.selectEvent);
  const clearSelection = useEventStore((state) => state.clearSelection);

  // 3D visualization state
  const [show3D, setShow3D] = useState(false);

  // Fetch events from backend and poll for updates every 5s
  const { pollStatus } = useFrontierEvents({
    limit: 20,
    spikeOnly: false,
    pollInterval: 5000, // Poll every 5 seconds
  });

  useEffect(() => {
    console.log("[Dashboard] Mounted with", events.length, "events");
  }, [events.length]);

  // If an event is selected, show detail view
  if (selectedEventId) {
    return <EventDetailView eventId={selectedEventId} onClose={clearSelection} />;
  }

  // Otherwise show dashboard
  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-950 via-slate-900 to-slate-950 text-slate-50">
      {/* Header */}
      <header className="border-b border-slate-800 bg-slate-950/90 backdrop-blur-md sticky top-0 z-50 shadow-lg">
        <div className="container mx-auto px-6 py-5">
          <div className="flex items-center gap-3">
            <div className="w-8 h-8 bg-gradient-to-br from-blue-500 to-purple-600 rounded-lg flex items-center justify-center">
              <span className="text-white font-bold text-sm">P</span>
            </div>
            <h1 className="text-2xl font-bold bg-gradient-to-r from-blue-400 to-purple-400 bg-clip-text text-transparent">
              PolyBerg
            </h1>
            <div className="ml-auto text-sm text-slate-400">
              {events.length} active spikes
            </div>
          </div>
        </div>
      </header>

      {/* Main Content */}
      <main className="container mx-auto px-4 py-6">
        {/* News Scraper Section */}
        <section className="mb-8">
          <NewsScraper />
        </section>

        {/* Event Grid - All events */}
        {events.length > 0 && (
          <section>
            <EventGrid
              events={events}
              onSelectEvent={selectEvent}
            />
          </section>
        )}
      </main>

      {/* Floating 3D View Button */}
      {events.length > 0 && (
        <button
          onClick={() => setShow3D(true)}
          className="fixed bottom-6 right-6 z-40 flex items-center gap-2 px-5 py-3 bg-gradient-to-r from-purple-600 to-blue-600 hover:from-purple-500 hover:to-blue-500 text-white font-semibold rounded-full shadow-lg hover:shadow-xl transition-all duration-300 transform hover:scale-105"
          title="Open 3D Visualization"
        >
          <Box className="w-5 h-5" />
          <span>3D View</span>
        </button>
      )}

      {/* 3D Visualization Overlay */}
      <Visualization3DOverlay
        events={events}
        isOpen={show3D}
        onClose={() => setShow3D(false)}
        onSelectEvent={(event) => {
          setShow3D(false);
          selectEvent(event.id);
        }}
      />

      {/* AI Chat Widget */}
      <ChatWidget />
    </div>
  );
}
