/**
 * Hook for fetching and managing frontier events from the backend
 */

import { useEffect, useRef, useState } from "react";
import { useEventStore } from "@/lib/store/eventStore";
import { fetchFrontierEvents, checkHealth } from "@/lib/services/api";

interface UseFrontierEventsOptions {
  limit?: number;
  spikeOnly?: boolean;
  pollInterval?: number; // in milliseconds, 0 to disable
}

export interface PollStatus {
  isPolling: boolean;
  lastPollTime: Date | null;
  nextPollIn: number; // seconds
  lastResult: {
    eventCount: number;
    spikeCount: number;
  } | null;
  error: string | null;
}

export function useFrontierEvents(options: UseFrontierEventsOptions = {}) {
  const { limit = 20, spikeOnly = false, pollInterval = 5000 } = options; // Default: poll every 5s
  const setEvents = useEventStore((state) => state.setEvents);
  const pollRef = useRef<NodeJS.Timeout>();
  const countdownRef = useRef<NodeJS.Timeout>();

  const [pollStatus, setPollStatus] = useState<PollStatus>({
    isPolling: false,
    lastPollTime: null,
    nextPollIn: Math.floor(pollInterval / 1000),
    lastResult: null,
    error: null,
  });

  const fetchEvents = async () => {
    try {
      console.log("[useFrontierEvents] Fetching events from backend...");
      setPollStatus((prev) => ({ ...prev, isPolling: true, error: null }));

      const response = await fetchFrontierEvents(limit, spikeOnly);

      console.log(
        `[useFrontierEvents] Received ${response.events.length} events, ` +
          `${response.hasVolumeSpike} with volume spikes`
      );

      setEvents(response.events);

      setPollStatus((prev) => ({
        ...prev,
        isPolling: false,
        lastPollTime: new Date(),
        nextPollIn: Math.floor(pollInterval / 1000),
        lastResult: {
          eventCount: response.events.length,
          spikeCount: response.hasVolumeSpike,
        },
      }));
    } catch (error) {
      console.error("[useFrontierEvents] Error fetching events:", error);
      setPollStatus((prev) => ({
        ...prev,
        isPolling: false,
        error: error instanceof Error ? error.message : "Unknown error",
      }));
    }
  };

  useEffect(() => {
    // Initial fetch
    console.log("[useFrontierEvents] Initializing...");
    fetchEvents();

    // Check backend health
    checkHealth()
      .then((health) => {
        console.log(
          `[useFrontierEvents] Backend health: ${health.status}, ` +
            `tracking ${health.events_tracked} events, ` +
            `${health.events_with_spikes} with spikes`
        );
      })
      .catch(() => {
        console.warn("[useFrontierEvents] Backend health check failed");
      });

    // Set up polling if interval > 0
    if (pollInterval > 0) {
      console.log(`[useFrontierEvents] Starting polling (interval: ${pollInterval}ms)`);

      // Countdown timer (updates every second)
      countdownRef.current = setInterval(() => {
        setPollStatus((prev) => ({
          ...prev,
          nextPollIn: Math.max(0, prev.nextPollIn - 1),
        }));
      }, 1000);

      // Polling timer
      pollRef.current = setInterval(() => {
        console.log("[useFrontierEvents] Polling for updates...");
        fetchEvents();
      }, pollInterval);
    }

    // Cleanup
    return () => {
      if (pollRef.current) {
        console.log("[useFrontierEvents] Stopping polling");
        clearInterval(pollRef.current);
      }
      if (countdownRef.current) {
        clearInterval(countdownRef.current);
      }
    };
  }, [limit, spikeOnly, pollInterval]); // Re-fetch if options change

  return {
    refetch: fetchEvents,
    pollStatus,
  };
}
