/**
 * Mini sparkline chart showing volume trend
 * Shows if volume is accelerating (spike) vs just high volume
 */

import { cn } from "@/lib/utils";

interface VolumeSparklineProps {
  volume24hr: number;
  volume1wk: number;
  volume1mo: number;
  className?: string;
}

export function VolumeSparkline({
  volume24hr,
  volume1wk,
  volume1mo,
  className,
}: VolumeSparklineProps) {
  // Calculate average daily volumes
  const avgDaily1wk = volume1wk / 7;
  const avgDaily1mo = volume1mo / 30;

  // Create 4 data points: 1 month ago, 1 week ago, yesterday (estimated), today
  // Note: We don't have exact daily data, so we approximate
  const points = [
    avgDaily1mo,      // ~30 days ago average
    avgDaily1wk,      // ~7 days ago average
    avgDaily1wk * 1.1, // Yesterday estimate (slightly higher than week avg)
    volume24hr,       // Today
  ];

  // Normalize to 0-100 scale for SVG
  const maxVolume = Math.max(...points);
  const minVolume = Math.min(...points, 0);
  const range = maxVolume - minVolume || 1;

  const normalizedPoints = points.map((v) => ((v - minVolume) / range) * 100);

  // SVG dimensions
  const width = 80;
  const height = 40;
  const padding = 4;

  // Calculate x positions (evenly spaced)
  const xStep = (width - padding * 2) / (points.length - 1);

  // Create SVG path
  const pathData = normalizedPoints
    .map((y, i) => {
      const x = padding + i * xStep;
      const yPos = height - padding - (y / 100) * (height - padding * 2);
      return i === 0 ? `M ${x} ${yPos}` : `L ${x} ${yPos}`;
    })
    .join(" ");

  // Determine if volume is accelerating (today > recent average)
  const isAccelerating = volume24hr > avgDaily1wk * 1.2; // 20% above week average
  const strokeColor = isAccelerating ? "#f59e0b" : "#64748b"; // Amber if accelerating, slate if not

  return (
    <svg
      width={width}
      height={height}
      className={cn("overflow-visible", className)}
      viewBox={`0 0 ${width} ${height}`}
    >
      {/* Area fill under the line */}
      <path
        d={`${pathData} L ${padding + (points.length - 1) * xStep} ${height - padding} L ${padding} ${height - padding} Z`}
        fill={isAccelerating ? "rgba(251, 191, 36, 0.1)" : "rgba(100, 116, 139, 0.1)"}
        strokeWidth="0"
      />

      {/* Line */}
      <path
        d={pathData}
        fill="none"
        stroke={strokeColor}
        strokeWidth="2"
        strokeLinecap="round"
        strokeLinejoin="round"
      />

      {/* Dots at each point */}
      {normalizedPoints.map((y, i) => {
        const x = padding + i * xStep;
        const yPos = height - padding - (y / 100) * (height - padding * 2);
        return (
          <circle
            key={i}
            cx={x}
            cy={yPos}
            r={i === points.length - 1 ? 3 : 2} // Larger dot for current day
            fill={strokeColor}
            className={i === points.length - 1 && isAccelerating ? "animate-pulse" : ""}
          />
        );
      })}
    </svg>
  );
}
