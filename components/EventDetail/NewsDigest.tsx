"use client";

import { useState } from "react";
import { NewsCard } from "@/lib/types";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
} from "@/components/ui/dialog";
import { ExternalLink } from "lucide-react";
import { format, formatDistanceToNow } from "date-fns";

interface NewsDigestProps {
  news: NewsCard[];
}

export function NewsDigest({ news }: NewsDigestProps) {
  const [open, setOpen] = useState(false);
  const [active, setActive] = useState<NewsCard | null>(null);

  // Sort by relevance score descending, then by publishedAt descending
  const sortedNews = [...news].sort((a, b) => {
    if (a.relevanceScore !== b.relevanceScore) {
      return b.relevanceScore - a.relevanceScore;
    }
    return new Date(b.publishedAt).getTime() - new Date(a.publishedAt).getTime();
  });

  const getSentimentColor = (sentiment: string) => {
    switch (sentiment) {
      case "positive":
        return "text-green-500";
      case "negative":
        return "text-red-500";
      default:
        return "text-slate-500";
    }
  };

  if (sortedNews.length === 0) {
    return (
      <div className="space-y-4">
        <div>
          <h3 className="text-xl font-bold mb-2">Related News</h3>
        </div>
        <div className="flex items-center justify-center h-32 text-slate-500 border border-dashed border-slate-700 rounded-lg">
          No news found for this event
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-4">
      <div>
        <h3 className="text-xl font-bold mb-2">Related News</h3>
        <p className="text-sm text-slate-300">
          {sortedNews.length} recent articles related to this event
        </p>
      </div>

      <div className="space-y-3">
        {sortedNews.map((article) => (
          <Card
            key={article.id}
            className="cursor-pointer hover:bg-slate-900/50 transition-colors"
            onClick={() => {
              setActive(article);
              setOpen(true);
            }}
          >
            <CardContent className="p-4">
              <div className="space-y-2">
                {/* Header: Source + Time */}
                <div className="flex items-center gap-2 text-xs text-slate-300">
                  <span className="font-medium">{article.source}</span>
                  <span>•</span>
                  <span title={format(new Date(article.publishedAt), "PPpp")}>
                    {formatDistanceToNow(new Date(article.publishedAt), { addSuffix: true })}
                  </span>
                </div>

                {/* Title */}
                <h4 className="font-bold text-sm leading-tight hover:text-blue-400 transition-colors flex items-center gap-2">
                  {article.title}
                  <ExternalLink className="w-3 h-3 flex-shrink-0" />
                </h4>

                {/* Snippet */}
                <p className="text-xs text-slate-200 line-clamp-3">{article.snippet}</p>

                {/* Footer: Sentiment + Relevance */}
                <div className="flex items-center justify-between">
                  <Badge variant="outline" className={`text-xs ${getSentimentColor(article.sentiment)}`}>
                    {article.sentiment}
                  </Badge>

                  <span className="text-xs text-slate-500">
                    Relevance: {(article.relevanceScore * 100).toFixed(0)}%
                  </span>
                </div>
              </div>
            </CardContent>
          </Card>
        ))}
      </div>

      {/* Article preview modal */}
      <Dialog open={open} onOpenChange={setOpen}>
        <DialogContent className="sm:max-w-2xl">
          {active && (
            <div className="space-y-4">
              <DialogHeader>
                <DialogTitle className="text-base sm:text-lg line-clamp-3">
                  {active.title}
                </DialogTitle>
                <DialogDescription>
                  <span className="font-medium text-slate-300">
                    {active.source}
                  </span>
                  <span className="mx-2">•</span>
                  <span>
                    {formatDistanceToNow(new Date(active.publishedAt), { addSuffix: true })}
                  </span>
                </DialogDescription>
              </DialogHeader>
              <div className="text-sm text-slate-200 whitespace-pre-wrap leading-relaxed">
                {active.snippet || "No preview available."}
              </div>
              <div className="flex items-center justify-end gap-2">
                <Button
                  variant="outline"
                  onClick={() => setOpen(false)}
                >
                  Close
                </Button>
                <Button
                  onClick={() => {
                    window.open(active.url, "_blank", "noopener,noreferrer");
                  }}
                >
                  Open Original
                </Button>
              </div>
            </div>
          )}
        </DialogContent>
      </Dialog>
    </div>
  );
}
