import { PolymarketEvent, NewsCard } from "@/lib/types";

const ORCH_BASE = process.env.NEXT_PUBLIC_ORCHESTRATOR_URL || "http://localhost:8001";

export interface OrchestrateResponse {
  run_id: string;
  event_id: string;
  tool_used: string;
  news_count: number;
  articles: { title: string; url: string; source?: string; published_at?: string; summary?: string }[];
  next_actions: string[];
  diagnostics?: Record<string, unknown>;
}

export async function fetchEventNews(event: PolymarketEvent, opts?: { maxItems?: number; preferredTool?: "exa" | "apify" | "internal"; newsQuery?: string; }): Promise<NewsCard[]> {
  const body = {
    event: {
      id: event.id,
      title: event.title,
      description: event.description,
      category: event.category,
    },
    news_query: opts?.newsQuery ?? `${event.title} latest news`,
    preferred_tool: opts?.preferredTool ?? "exa",
    max_items: Math.min(Math.max(opts?.maxItems ?? 6, 1), 6),
  };

  const res = await fetch(`${ORCH_BASE}/orchestrate`, {
    method: "POST",
    headers: { "content-type": "application/json" },
    body: JSON.stringify(body),
  });

  if (!res.ok) {
    const text = await res.text();
    throw new Error(`Orchestrator error: ${res.status} ${res.statusText}: ${text}`);
  }

  const data: OrchestrateResponse = await res.json();

  // Map backend articles to NewsCard shape used by UI
  const now = new Date();
  const news: NewsCard[] = data.articles.map((a, idx) => ({
    id: `orch_${event.id}_${idx}`,
    title: a.title,
    snippet: a.summary || "",
    source: a.source || "",
    publishedAt: a.published_at || now.toISOString(),
    url: a.url,
    relevanceScore: 0.85, // placeholder until scoring is added
    sentiment: "neutral",
  }));

  return news;
}
