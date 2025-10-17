"use client";

import { useState, useEffect } from "react";
import { useEventStore } from "@/lib/store/eventStore";
import { Button } from "@/components/ui/button";
import { ArrowLeft } from "lucide-react";
import { TickerList } from "./TickerList";
import { NewsDigest } from "./NewsDigest";
import { Separator } from "@/components/ui/separator";
import { fetchEventDetail } from "@/lib/services/api";
import { NewsCard } from "@/lib/types";

interface EventDetailViewProps {
  eventId: string;
  onClose: () => void;
}

export function EventDetailView({ eventId, onClose }: EventDetailViewProps) {
  const event = useEventStore((state) => state.events.find((e) => e.id === eventId));
  const [news, setNews] = useState<NewsCard[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (event) {
      loadEventDetail();
    }
  }, [event]);

  const loadEventDetail = async () => {
    if (!event) return;
    
    setLoading(true);
    setError(null);
    
    try {
      const detail = await fetchEventDetail(eventId, true, 6, "1d");
      
      // Transform the news data to match NewsCard interface
      if (detail.news) {
        const transformedNews: NewsCard[] = detail.news.map((item: any, index: number) => ({
          id: item.id || `news_${eventId}_${index}`,
          title: item.title || item.headline || "News Article",
          snippet: item.snippet || item.description || item.text || "No description available",
          source: item.source || item.publisher || "Unknown Source",
          publishedAt: item.publishedAt || item.date || new Date().toISOString(),
          url: item.url || item.link || "#",
          relevanceScore: item.relevanceScore || 0.8,
          sentiment: item.sentiment || "neutral"
        }));
        setNews(transformedNews);
      }
    } catch (err) {
      console.error("Failed to load event detail:", err);
      setError("Failed to load news data");
    } finally {
      setLoading(false);
    }
  };

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
          <TickerList eventId={eventId} />
          
          <Separator className="bg-slate-800" />
          
          {/* News Section */}
          <div>
            {loading && (
              <div className="flex items-center justify-center h-32 text-slate-400">
                Loading news...
              </div>
            )}
            
            {error && (
              <div className="flex items-center justify-center h-32 text-red-400">
                {error}
              </div>
            )}
            
            {!loading && !error && (
              <NewsDigest news={news} />
            )}
          </div>
        </div>
      </main>
    </div>
  );
}
