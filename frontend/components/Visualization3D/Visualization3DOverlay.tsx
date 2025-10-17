"use client";

import { useEffect } from "react";
import { X, Info } from "lucide-react";
import { PolymarketEvent } from "@/lib/types";
import { Scene3D } from "./Scene3D";

interface Visualization3DOverlayProps {
  events: PolymarketEvent[];
  isOpen: boolean;
  onClose: () => void;
  onSelectEvent: (event: PolymarketEvent) => void;
}

export function Visualization3DOverlay({
  events,
  isOpen,
  onClose,
  onSelectEvent,
}: Visualization3DOverlayProps) {
  // Handle ESC key to close
  useEffect(() => {
    const handleEsc = (e: KeyboardEvent) => {
      if (e.key === "Escape" && isOpen) {
        onClose();
      }
    };
    window.addEventListener("keydown", handleEsc);
    return () => window.removeEventListener("keydown", handleEsc);
  }, [isOpen, onClose]);

  // Don't render if not open
  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 bg-slate-950">
      {/* Header with controls */}
      <div className="absolute top-0 left-0 right-0 z-10 bg-gradient-to-b from-slate-950 to-transparent p-6">
        <div className="flex items-center justify-between max-w-7xl mx-auto">
          {/* Title */}
          <div>
            <h2 className="text-2xl font-bold text-white mb-1">
              3D Event Universe
            </h2>
            <p className="text-sm text-slate-400">
              {events.length} events visualized in 3D space
            </p>
          </div>

          {/* Close button */}
          <button
            onClick={onClose}
            className="flex items-center gap-2 px-4 py-2 bg-slate-800 hover:bg-slate-700 text-white rounded-lg transition-colors"
          >
            <X className="w-4 h-4" />
            Close
          </button>
        </div>
      </div>

      {/* Legend */}
      <div className="absolute bottom-6 left-6 z-10 bg-slate-900/90 backdrop-blur-md rounded-lg p-4 border border-slate-700 max-w-sm">
        <div className="flex items-center gap-2 mb-3">
          <Info className="w-4 h-4 text-blue-400" />
          <h3 className="text-sm font-semibold text-white">Visualization Guide</h3>
        </div>
        <div className="space-y-2 text-xs text-slate-300">
          <div className="flex items-center gap-2">
            <div className="w-3 h-3 bg-green-500 rounded-full" />
            <span>Green = Price increasing</span>
          </div>
          <div className="flex items-center gap-2">
            <div className="w-3 h-3 bg-red-500 rounded-full" />
            <span>Red = Price decreasing</span>
          </div>
          <div className="flex items-center gap-2">
            <div className="w-3 h-3 bg-blue-500 rounded-full" />
            <span>Blue = Neutral</span>
          </div>
          <div className="border-t border-slate-700 my-2 pt-2">
            <p><strong>X-axis:</strong> Time (left = recent)</p>
            <p><strong>Y-axis:</strong> Probability</p>
            <p><strong>Z-axis:</strong> Volume spike</p>
            <p className="mt-1"><strong>Size:</strong> 24h volume</p>
          </div>
          <div className="border-t border-slate-700 my-2 pt-2 text-slate-400">
            <p>🖱️ Drag to rotate</p>
            <p>🔍 Scroll to zoom</p>
            <p>👆 Click bubble for details</p>
          </div>
        </div>
      </div>

      {/* Stats */}
      <div className="absolute top-24 right-6 z-10 bg-slate-900/90 backdrop-blur-md rounded-lg p-4 border border-slate-700">
        <div className="space-y-2 text-sm">
          <div>
            <div className="text-slate-400">Total Events</div>
            <div className="text-2xl font-bold text-white">{events.length}</div>
          </div>
          <div>
            <div className="text-slate-400">With Spikes</div>
            <div className="text-2xl font-bold text-amber-400">
              {events.filter(e => e.volumeSpike && e.volumeSpike > 1.3).length}
            </div>
          </div>
        </div>
      </div>

      {/* 3D Scene */}
      <div className="w-full h-full">
        <Scene3D events={events} onSelectEvent={onSelectEvent} />
      </div>
    </div>
  );
}
