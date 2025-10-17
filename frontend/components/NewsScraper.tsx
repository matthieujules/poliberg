"use client";

import { useState } from "react";
import { scrapeNews } from "@/lib/services/api";

interface NewsItem {
  title: string;
  link: string;
  source: string;
  publishedAt: string;
  image?: string;
}

export function NewsScraper() {
  const [query, setQuery] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const [newsItems, setNewsItems] = useState<NewsItem[]>([]);
  const [error, setError] = useState<string | null>(null);

  const handleScrapeNews = async () => {
    if (!query.trim()) return;

    setIsLoading(true);
    setError(null);
    setNewsItems([]);

    try {
      const result = await scrapeNews({
        query: query.trim(),
        max_items: 5,
        time_range: "1h",
        fetch_details: true,
      });

      if (result.status === "SUCCEEDED") {
        setNewsItems(result.items);
      } else {
        setError(`News scraping failed: ${result.status}`);
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to scrape news");
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="p-6 bg-slate-800 rounded-lg border border-slate-700">
      <h2 className="text-xl font-semibold text-white mb-4">News Scraper</h2>
      
      {/* Query Input */}
      <div className="flex gap-2 mb-4">
        <input
          type="text"
          value={query}
          onChange={(e) => setQuery(e.target.value)}
          placeholder="Enter search query (e.g., Tesla, Bitcoin, AI)"
          className="flex-1 px-3 py-2 bg-slate-700 border border-slate-600 rounded-md text-white placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-blue-500"
          onKeyPress={(e) => e.key === "Enter" && handleScrapeNews()}
        />
        <button
          onClick={handleScrapeNews}
          disabled={isLoading || !query.trim()}
          className="px-4 py-2 bg-blue-600 hover:bg-blue-700 disabled:bg-slate-600 disabled:cursor-not-allowed text-white rounded-md transition-colors"
        >
          {isLoading ? "Scraping..." : "Scrape News"}
        </button>
      </div>

      {/* Error Display */}
      {error && (
        <div className="mb-4 p-3 bg-red-900/50 border border-red-700 rounded-md text-red-200">
          {error}
        </div>
      )}

      {/* News Results */}
      {newsItems.length > 0 && (
        <div className="space-y-3">
          <h3 className="text-lg font-medium text-white">
            Found {newsItems.length} news articles:
          </h3>
          {newsItems.map((item, index) => (
            <div
              key={index}
              className="p-4 bg-slate-700 rounded-md border border-slate-600"
            >
              <h4 className="font-medium text-white mb-2">{item.title}</h4>
              <div className="flex items-center gap-4 text-sm text-slate-400">
                <span>Source: {item.source}</span>
                <span>
                  Published: {new Date(item.publishedAt).toLocaleString()}
                </span>
              </div>
              <a
                href={item.link}
                target="_blank"
                rel="noopener noreferrer"
                className="inline-block mt-2 text-blue-400 hover:text-blue-300 text-sm"
              >
                Read full article →
              </a>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
