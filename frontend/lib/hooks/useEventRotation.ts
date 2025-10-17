import { useEffect, useRef } from "react";
import { useEventStore } from "@/lib/store/eventStore";
import { MOCK_EVENTS } from "@/lib/data/mockEvents";
import { PolymarketEvent } from "@/lib/types";

/**
 * Hook to simulate new Polymarket events arriving every 25-35 seconds
 * Respects locked events (they don't rotate out)
 */
export function useEventRotation() {
  const addNewEvent = useEventStore((state) => state.addNewEvent);
  const eventPoolRef = useRef([...MOCK_EVENTS]);
  const usedEventsRef = useRef(new Set<string>());

  useEffect(() => {
    // Function to get a random interval between 25-35 seconds
    const getRandomInterval = () => Math.floor(Math.random() * 10_000) + 25_000;

    const rotateEvent = () => {
      // Get an unused event from the pool
      const availableEvents = eventPoolRef.current.filter(
        (event) => !usedEventsRef.current.has(event.id)
      );

      if (availableEvents.length === 0) {
        // Reset pool if we've used all events
        usedEventsRef.current.clear();
        return;
      }

      // Pick a random event
      const randomEvent = availableEvents[Math.floor(Math.random() * availableEvents.length)];

      // Modify the event to make it "new"
      const newEvent: PolymarketEvent = {
        ...randomEvent,
        // Update probability slightly (±3%)
        probability: Math.max(
          0.05,
          Math.min(0.95, randomEvent.probability + (Math.random() - 0.5) * 0.06)
        ),
        // Update 24h change (±10%)
        priceChange24h: randomEvent.priceChange24h + (Math.random() - 0.5) * 0.2,
        // Update detected time to now
        detectedAt: new Date().toISOString(),
        // Slightly vary volume (±20%)
        volume24h: Math.floor(randomEvent.volume24h * (1 + (Math.random() - 0.5) * 0.4)),
      };

      // Mark as used
      usedEventsRef.current.add(randomEvent.id);

      // Add to store
      addNewEvent(newEvent);
    };

    // Set up interval with random timing
    let timeoutId: NodeJS.Timeout;

    const scheduleNext = () => {
      const interval = getRandomInterval();
      timeoutId = setTimeout(() => {
        rotateEvent();
        scheduleNext(); // Schedule the next rotation
      }, interval);
    };

    // Start the rotation cycle
    scheduleNext();

    // Cleanup
    return () => {
      if (timeoutId) {
        clearTimeout(timeoutId);
      }
    };
  }, [addNewEvent]);
}
