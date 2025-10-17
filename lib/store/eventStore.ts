import { create } from "zustand";
import { PolymarketEvent, EventDetailData, OrchestratorStatus } from "@/lib/types";

interface EventStore {
  // Frontier state
  events: PolymarketEvent[];
  featuredEvent: PolymarketEvent | null;

  // Selection state
  selectedEventId: string | null;
  eventDetailData: Record<string, EventDetailData>; // Cached detail data

  // Actions
  setEvents: (events: PolymarketEvent[]) => void;
  addNewEvent: (event: PolymarketEvent) => void;
  toggleLock: (eventId: string) => void;
  selectEvent: (eventId: string) => void;
  clearSelection: () => void;
  updateEventDetail: (eventId: string, data: Partial<EventDetailData>) => void;
  initializeEventDetail: (eventId: string, event: PolymarketEvent) => void;
}

export const useEventStore = create<EventStore>((set, get) => ({
  events: [],
  featuredEvent: null,
  selectedEventId: null,
  eventDetailData: {},

  setEvents: (events) => {
    set({
      events: events,
      featuredEvent: events.length > 0 ? events[0] : null,
    });
  },

  addNewEvent: (event) => {
    set((state) => {
      // Don't add if event already exists
      if (state.events.some((e) => e.id === event.id)) {
        return state;
      }

      // Get locked events
      const lockedEvents = state.events.filter((e) => e.locked);
      const unlockedEvents = state.events.filter((e) => !e.locked);

      // If the new event is locked, add it to the beginning of locked events
      // Otherwise add it to the beginning of unlocked events
      let newEvents: PolymarketEvent[];
      if (event.locked) {
        newEvents = [event, ...lockedEvents, ...unlockedEvents];
      } else {
        newEvents = [...lockedEvents, event, ...unlockedEvents];
      }

      // Limit to 20 events max (but keep all locked events)
      const lockedCount = newEvents.filter((e) => e.locked).length;
      if (newEvents.length > 20) {
        // Keep all locked events + fill up to 20 with unlocked events
        const locked = newEvents.filter((e) => e.locked);
        const unlocked = newEvents.filter((e) => !e.locked).slice(0, 20 - lockedCount);
        newEvents = [...locked, ...unlocked];
      }

      return {
        events: newEvents,
        featuredEvent: newEvents[0],
      };
    });
  },

  toggleLock: (eventId) => {
    set((state) => {
      const events = state.events.map((event) =>
        event.id === eventId ? { ...event, locked: !event.locked } : event
      );

      // Re-sort: locked events first (maintain order), then unlocked by detectedAt
      const lockedEvents = events.filter((e) => e.locked);
      const unlockedEvents = events
        .filter((e) => !e.locked)
        .sort((a, b) => new Date(b.detectedAt).getTime() - new Date(a.detectedAt).getTime());

      const sortedEvents = [...lockedEvents, ...unlockedEvents];

      return {
        events: sortedEvents,
        featuredEvent: sortedEvents[0],
      };
    });
  },

  selectEvent: (eventId) => {
    const event = get().events.find((e) => e.id === eventId);
    if (!event) return;

    // Initialize event detail data if it doesn't exist
    if (!get().eventDetailData[eventId]) {
      get().initializeEventDetail(eventId, event);
    }

    set({ selectedEventId: eventId });
  },

  clearSelection: () => {
    set({ selectedEventId: null });
  },

  initializeEventDetail: (eventId, event) => {
    set((state) => ({
      eventDetailData: {
        ...state.eventDetailData,
        [eventId]: {
          event,
          status: "idle" as OrchestratorStatus,
          tickers: [],
          stockData: {},
          news: [],
        },
      },
    }));
  },

  updateEventDetail: (eventId, data) => {
    set((state) => {
      const existing = state.eventDetailData[eventId];
      if (!existing) return state;

      return {
        eventDetailData: {
          ...state.eventDetailData,
          [eventId]: {
            ...existing,
            ...data,
          },
        },
      };
    });
  },
}));

// Selectors for convenience
export const useEvents = () => useEventStore((state) => state.events);
export const useFeaturedEvent = () => useEventStore((state) => state.featuredEvent);
export const useSelectedEventId = () => useEventStore((state) => state.selectedEventId);
export const useEventDetailData = (eventId: string) =>
  useEventStore((state) => state.eventDetailData[eventId]);
export const useSelectedEvent = () => {
  const selectedEventId = useEventStore((state) => state.selectedEventId);
  const events = useEventStore((state) => state.events);
  return events.find((e) => e.id === selectedEventId) || null;
};
