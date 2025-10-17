"use client";

import { PolymarketEvent } from "@/lib/types";
import { EventCard } from "./EventCard";

interface EventGridProps {
  events: PolymarketEvent[];
  onSelectEvent: (id: string) => void;
}

export function EventGrid({ events, onSelectEvent }: EventGridProps) {
  if (events.length === 0) {
    return (
      <div className="flex items-center justify-center h-64 text-slate-500">
        No events available
      </div>
    );
  }

  return (
    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
      {events.map((event) => (
        <EventCard
          key={event.id}
          event={event}
          onSelect={() => onSelectEvent(event.id)}
        />
      ))}
    </div>
  );
}
