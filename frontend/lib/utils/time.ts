/**
 * Utility functions for time formatting
 */

/**
 * Format a relative time string (e.g., "2m ago", "30s ago")
 */
export function formatRelativeTime(timestamp: string | Date): string {
  const date = typeof timestamp === "string" ? new Date(timestamp) : timestamp;
  const now = new Date();
  const diffMs = now.getTime() - date.getTime();
  const diffSeconds = Math.floor(diffMs / 1000);

  if (diffSeconds < 0) {
    return "just now";
  }

  if (diffSeconds < 60) {
    return `${diffSeconds}s ago`;
  }

  const diffMinutes = Math.floor(diffSeconds / 60);
  if (diffMinutes < 60) {
    return `${diffMinutes}m ago`;
  }

  const diffHours = Math.floor(diffMinutes / 60);
  if (diffHours < 24) {
    return `${diffHours}h ago`;
  }

  const diffDays = Math.floor(diffHours / 24);
  return `${diffDays}d ago`;
}

/**
 * Format volume as compact string
 */
export function formatVolume(volume: number): string {
  if (volume >= 1_000_000) {
    return `$${(volume / 1_000_000).toFixed(1)}M`;
  } else if (volume >= 1_000) {
    return `$${(volume / 1_000).toFixed(0)}k`;
  }
  return `$${volume.toFixed(0)}`;
}

/**
 * Check if an event was recently updated (within last 90 seconds)
 * Backend polls every 60s, so 90s gives buffer for display
 */
export function isRecentlyUpdated(timestamp: string | Date): boolean {
  const date = typeof timestamp === "string" ? new Date(timestamp) : timestamp;
  const now = new Date();
  const diffMs = now.getTime() - date.getTime();
  const diffSeconds = Math.floor(diffMs / 1000);

  return diffSeconds <= 90; // Last 90 seconds
}

/**
 * Get intensity of recency (for animation strength)
 * Returns 0-1 scale: 1 = just updated, 0 = old
 */
export function getRecencyIntensity(timestamp: string | Date): number {
  const date = typeof timestamp === "string" ? new Date(timestamp) : timestamp;
  const now = new Date();
  const diffMs = now.getTime() - date.getTime();
  const diffSeconds = Math.floor(diffMs / 1000);

  if (diffSeconds <= 30) return 1.0; // 0-30s: Maximum intensity
  if (diffSeconds <= 60) return 0.7; // 30-60s: High intensity
  if (diffSeconds <= 90) return 0.4; // 60-90s: Medium intensity
  return 0; // > 90s: No effect
}
