import { PolymarketEvent } from "@/lib/types";

// Mock Polymarket events with realistic data
// Mix: Politics (40%), Crypto (20%), Business (20%), Sports (10%), Tech (10%)
export const MOCK_EVENTS: PolymarketEvent[] = [
  {
    id: "evt_001",
    title: "Will Bitcoin reach $100,000 by end of 2025?",
    description: "This market resolves YES if Bitcoin (BTC) trades at or above $100,000 USD on any major exchange (Coinbase, Binance, Kraken) before December 31, 2025, 11:59 PM ET.",
    probability: 0.62,
    priceChange24h: 0.08,
    volume24h: 2_400_000,
    liquidity: 8_500_000,
    detectedAt: new Date(Date.now() - 2 * 60 * 60 * 1000).toISOString(), // 2 hours ago
    tags: ["crypto", "bitcoin", "price-prediction"],
    locked: false,
    category: "crypto",
    endDate: "2025-12-31T23:59:59Z",
    marketUrl: "https://polymarket.com/event/bitcoin-100k-2025",
  },
  {
    id: "evt_002",
    title: "Will Donald Trump win the 2024 Presidential Election?",
    description: "This market resolves YES if Donald Trump wins the 2024 U.S. Presidential Election and is declared President-elect.",
    probability: 0.48,
    priceChange24h: -0.03,
    volume24h: 5_200_000,
    liquidity: 12_000_000,
    detectedAt: new Date(Date.now() - 4 * 60 * 60 * 1000).toISOString(), // 4 hours ago
    tags: ["politics", "election", "trump", "usa"],
    locked: false,
    category: "politics",
    endDate: "2024-11-05T23:59:59Z",
    marketUrl: "https://polymarket.com/event/trump-2024",
  },
  {
    id: "evt_003",
    title: "Will Ethereum ETF be approved by SEC in 2025?",
    description: "Resolves YES if the U.S. Securities and Exchange Commission approves a spot Ethereum ETF by December 31, 2025.",
    probability: 0.71,
    priceChange24h: 0.12,
    volume24h: 1_800_000,
    liquidity: 4_200_000,
    detectedAt: new Date(Date.now() - 1 * 60 * 60 * 1000).toISOString(), // 1 hour ago
    tags: ["crypto", "ethereum", "sec", "etf", "regulation"],
    locked: false,
    category: "crypto",
    endDate: "2025-12-31T23:59:59Z",
    marketUrl: "https://polymarket.com/event/eth-etf-2025",
  },
  {
    id: "evt_004",
    title: "Will the Fed cut interest rates by 50+ basis points in March 2025?",
    description: "This market resolves YES if the Federal Reserve cuts the federal funds rate by 50 basis points or more at their March 2025 meeting.",
    probability: 0.34,
    priceChange24h: 0.15,
    volume24h: 3_100_000,
    liquidity: 6_800_000,
    detectedAt: new Date(Date.now() - 30 * 60 * 1000).toISOString(), // 30 min ago
    tags: ["politics", "economics", "federal-reserve", "interest-rates"],
    locked: false,
    category: "politics",
    endDate: "2025-03-20T23:59:59Z",
    marketUrl: "https://polymarket.com/event/fed-rate-cut-march-2025",
  },
  {
    id: "evt_005",
    title: "Will Apple announce a foldable iPhone in 2025?",
    description: "Resolves YES if Apple officially announces a foldable iPhone device during any event or press release in 2025.",
    probability: 0.23,
    priceChange24h: -0.05,
    volume24h: 890_000,
    liquidity: 2_100_000,
    detectedAt: new Date(Date.now() - 6 * 60 * 60 * 1000).toISOString(), // 6 hours ago
    tags: ["tech", "apple", "iphone", "hardware"],
    locked: false,
    category: "tech",
    endDate: "2025-12-31T23:59:59Z",
    marketUrl: "https://polymarket.com/event/apple-foldable-2025",
  },
  {
    id: "evt_006",
    title: "Will Tesla stock hit $400 before end of Q1 2025?",
    description: "This market resolves YES if Tesla (TSLA) trades at or above $400 per share at any point before March 31, 2025, 11:59 PM ET.",
    probability: 0.58,
    priceChange24h: 0.07,
    volume24h: 1_600_000,
    liquidity: 3_900_000,
    detectedAt: new Date(Date.now() - 3 * 60 * 60 * 1000).toISOString(), // 3 hours ago
    tags: ["business", "tesla", "stock", "ev"],
    locked: false,
    category: "business",
    endDate: "2025-03-31T23:59:59Z",
    marketUrl: "https://polymarket.com/event/tesla-400-q1-2025",
  },
  {
    id: "evt_007",
    title: "Will there be a government shutdown in 2025?",
    description: "Resolves YES if the U.S. federal government experiences a shutdown lasting 24 hours or more at any point in 2025.",
    probability: 0.42,
    priceChange24h: 0.11,
    volume24h: 2_200_000,
    liquidity: 5_100_000,
    detectedAt: new Date(Date.now() - 5 * 60 * 60 * 1000).toISOString(), // 5 hours ago
    tags: ["politics", "government", "usa", "shutdown"],
    locked: false,
    category: "politics",
    endDate: "2025-12-31T23:59:59Z",
    marketUrl: "https://polymarket.com/event/govt-shutdown-2025",
  },
  {
    id: "evt_008",
    title: "Will OpenAI release GPT-5 in 2025?",
    description: "This market resolves YES if OpenAI officially announces and releases GPT-5 or a successor model to GPT-4 in 2025.",
    probability: 0.67,
    priceChange24h: 0.04,
    volume24h: 1_300_000,
    liquidity: 3_200_000,
    detectedAt: new Date(Date.now() - 8 * 60 * 60 * 1000).toISOString(), // 8 hours ago
    tags: ["tech", "ai", "openai", "gpt"],
    locked: false,
    category: "tech",
    endDate: "2025-12-31T23:59:59Z",
    marketUrl: "https://polymarket.com/event/gpt5-2025",
  },
  {
    id: "evt_009",
    title: "Will Lakers win the 2025 NBA Championship?",
    description: "Resolves YES if the Los Angeles Lakers win the 2025 NBA Championship.",
    probability: 0.18,
    priceChange24h: -0.02,
    volume24h: 750_000,
    liquidity: 1_800_000,
    detectedAt: new Date(Date.now() - 7 * 60 * 60 * 1000).toISOString(), // 7 hours ago
    tags: ["sports", "basketball", "nba", "lakers"],
    locked: false,
    category: "sports",
    endDate: "2025-06-30T23:59:59Z",
    marketUrl: "https://polymarket.com/event/lakers-championship-2025",
  },
  {
    id: "evt_010",
    title: "Will NVIDIA stock hit $1000 in 2025?",
    description: "This market resolves YES if NVIDIA (NVDA) trades at or above $1000 per share at any point before December 31, 2025.",
    probability: 0.55,
    priceChange24h: 0.09,
    volume24h: 2_900_000,
    liquidity: 7_400_000,
    detectedAt: new Date(Date.now() - 45 * 60 * 1000).toISOString(), // 45 min ago
    tags: ["business", "nvidia", "stock", "ai", "semiconductors"],
    locked: false,
    category: "business",
    endDate: "2025-12-31T23:59:59Z",
    marketUrl: "https://polymarket.com/event/nvidia-1000-2025",
  },
  {
    id: "evt_011",
    title: "Will the U.S. ban TikTok in 2025?",
    description: "Resolves YES if TikTok is banned from operating in the United States by federal law or executive order in 2025.",
    probability: 0.39,
    priceChange24h: 0.14,
    volume24h: 1_950_000,
    liquidity: 4_600_000,
    detectedAt: new Date(Date.now() - 10 * 60 * 60 * 1000).toISOString(), // 10 hours ago
    tags: ["politics", "tiktok", "social-media", "china", "regulation"],
    locked: false,
    category: "politics",
    endDate: "2025-12-31T23:59:59Z",
    marketUrl: "https://polymarket.com/event/tiktok-ban-2025",
  },
  {
    id: "evt_012",
    title: "Will Solana flip Ethereum by market cap in 2025?",
    description: "This market resolves YES if Solana's market capitalization exceeds Ethereum's at any point in 2025.",
    probability: 0.12,
    priceChange24h: -0.08,
    volume24h: 1_100_000,
    liquidity: 2_700_000,
    detectedAt: new Date(Date.now() - 12 * 60 * 60 * 1000).toISOString(), // 12 hours ago
    tags: ["crypto", "solana", "ethereum", "market-cap"],
    locked: false,
    category: "crypto",
    endDate: "2025-12-31T23:59:59Z",
    marketUrl: "https://polymarket.com/event/sol-flip-eth-2025",
  },
  {
    id: "evt_013",
    title: "Will Amazon acquire a major streaming service in 2025?",
    description: "Resolves YES if Amazon announces the acquisition of Netflix, Disney+, Max, or Paramount+ in 2025.",
    probability: 0.08,
    priceChange24h: 0.03,
    volume24h: 620_000,
    liquidity: 1_400_000,
    detectedAt: new Date(Date.now() - 14 * 60 * 60 * 1000).toISOString(), // 14 hours ago
    tags: ["business", "amazon", "streaming", "acquisition"],
    locked: false,
    category: "business",
    endDate: "2025-12-31T23:59:59Z",
    marketUrl: "https://polymarket.com/event/amazon-streaming-2025",
  },
  {
    id: "evt_014",
    title: "Will there be a recession in the U.S. in 2025?",
    description: "Resolves YES if the National Bureau of Economic Research (NBER) declares a recession occurred in the U.S. during 2025.",
    probability: 0.31,
    priceChange24h: -0.06,
    volume24h: 2_700_000,
    liquidity: 6_200_000,
    detectedAt: new Date(Date.now() - 9 * 60 * 60 * 1000).toISOString(), // 9 hours ago
    tags: ["politics", "economics", "recession", "usa"],
    locked: false,
    category: "politics",
    endDate: "2025-12-31T23:59:59Z",
    marketUrl: "https://polymarket.com/event/us-recession-2025",
  },
  {
    id: "evt_015",
    title: "Will Manchester City win the Premier League 2024-25?",
    description: "This market resolves YES if Manchester City wins the 2024-25 Premier League season.",
    probability: 0.64,
    priceChange24h: 0.02,
    volume24h: 840_000,
    liquidity: 2_000_000,
    detectedAt: new Date(Date.now() - 11 * 60 * 60 * 1000).toISOString(), // 11 hours ago
    tags: ["sports", "soccer", "premier-league", "manchester-city"],
    locked: false,
    category: "sports",
    endDate: "2025-05-31T23:59:59Z",
    marketUrl: "https://polymarket.com/event/man-city-pl-2025",
  },
  {
    id: "evt_016",
    title: "Will SpaceX successfully land Starship on Mars in 2025?",
    description: "Resolves YES if SpaceX's Starship vehicle successfully lands on Mars in 2025, as confirmed by SpaceX or NASA.",
    probability: 0.15,
    priceChange24h: -0.04,
    volume24h: 970_000,
    liquidity: 2_300_000,
    detectedAt: new Date(Date.now() - 13 * 60 * 60 * 1000).toISOString(), // 13 hours ago
    tags: ["tech", "spacex", "mars", "space"],
    locked: false,
    category: "tech",
    endDate: "2025-12-31T23:59:59Z",
    marketUrl: "https://polymarket.com/event/starship-mars-2025",
  },
  {
    id: "evt_017",
    title: "Will oil prices exceed $120 per barrel in 2025?",
    description: "This market resolves YES if WTI crude oil trades at or above $120 per barrel at any point in 2025.",
    probability: 0.28,
    priceChange24h: 0.10,
    volume24h: 1_450_000,
    liquidity: 3_500_000,
    detectedAt: new Date(Date.now() - 15 * 60 * 60 * 1000).toISOString(), // 15 hours ago
    tags: ["business", "oil", "commodities", "energy"],
    locked: false,
    category: "business",
    endDate: "2025-12-31T23:59:59Z",
    marketUrl: "https://polymarket.com/event/oil-120-2025",
  },
  {
    id: "evt_018",
    title: "Will Biden drop out of the 2024 Presidential race?",
    description: "Resolves YES if Joe Biden announces he will not seek re-election in 2024 before the Democratic National Convention.",
    probability: 0.22,
    priceChange24h: -0.07,
    volume24h: 3_800_000,
    liquidity: 9_100_000,
    detectedAt: new Date(Date.now() - 16 * 60 * 60 * 1000).toISOString(), // 16 hours ago
    tags: ["politics", "election", "biden", "usa", "democrats"],
    locked: false,
    category: "politics",
    endDate: "2024-08-19T23:59:59Z",
    marketUrl: "https://polymarket.com/event/biden-dropout-2024",
  },
  {
    id: "evt_019",
    title: "Will a new COVID variant cause global restrictions in 2025?",
    description: "Resolves YES if a new COVID-19 variant leads to lockdowns or travel restrictions in 3+ major countries in 2025.",
    probability: 0.19,
    priceChange24h: 0.06,
    volume24h: 1_120_000,
    liquidity: 2_900_000,
    detectedAt: new Date(Date.now() - 17 * 60 * 60 * 1000).toISOString(), // 17 hours ago
    tags: ["politics", "health", "covid", "pandemic"],
    locked: false,
    category: "politics",
    endDate: "2025-12-31T23:59:59Z",
    marketUrl: "https://polymarket.com/event/covid-variant-2025",
  },
  {
    id: "evt_020",
    title: "Will Microsoft acquire OpenAI in 2025?",
    description: "This market resolves YES if Microsoft announces a full acquisition of OpenAI in 2025.",
    probability: 0.26,
    priceChange24h: 0.05,
    volume24h: 1_680_000,
    liquidity: 4_100_000,
    detectedAt: new Date(Date.now() - 18 * 60 * 60 * 1000).toISOString(), // 18 hours ago
    tags: ["business", "microsoft", "openai", "ai", "acquisition"],
    locked: false,
    category: "business",
    endDate: "2025-12-31T23:59:59Z",
    marketUrl: "https://polymarket.com/event/msft-openai-2025",
  },
];

// Helper function to get events by category
export function getEventsByCategory(category: string): PolymarketEvent[] {
  return MOCK_EVENTS.filter((event) => event.category === category);
}

// Helper function to get featured event (highest velocity)
export function getFeaturedEvent(): PolymarketEvent {
  return [...MOCK_EVENTS].sort((a, b) => {
    const scoreA = Math.abs(a.priceChange24h) * Math.log10(a.volume24h / 100_000);
    const scoreB = Math.abs(b.priceChange24h) * Math.log10(b.volume24h / 100_000);
    return scoreB - scoreA;
  })[0];
}

// Helper function to sort events by frontier score
export function sortByFrontierScore(events: PolymarketEvent[]): PolymarketEvent[] {
  return [...events].sort((a, b) => {
    const scoreA = Math.abs(a.priceChange24h) * Math.log10(a.volume24h / 100_000) * (a.liquidity / 1_000_000);
    const scoreB = Math.abs(b.priceChange24h) * Math.log10(b.volume24h / 100_000) * (b.liquidity / 1_000_000);
    return scoreB - scoreA;
  });
}
