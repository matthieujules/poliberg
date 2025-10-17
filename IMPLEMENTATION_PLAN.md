# Polymarket Prediction Market Dashboard - Implementation Plan

## Overview
A local-first dashboard that displays Polymarket prediction market events with real-time updates, allows users to explore events in detail, and surfaces related stock tickers with historical price data and news context.

**Tech Stack:**
- Frontend: Next.js 14 (App Router), TypeScript, ShadCN UI, Tailwind CSS, Recharts
- State: Zustand
- Backend: FastAPI (Python 3.11+)
- APIs: Polymarket API, Finnhub/Alpha Vantage (stock data), OpenAI GPT-4

---

## Phase 1: Frontend with Mock Data

### 1.1 Project Setup

**Directory Structure:**
```
frontend/
├── app/
│   ├── page.tsx                    # Main dashboard page
│   ├── layout.tsx                  # Root layout with fonts
│   └── globals.css                 # Tailwind + custom styles
├── components/
│   ├── ui/                         # ShadCN primitives (button, card, etc.)
│   ├── Dashboard/
│   │   ├── FrontierBanner.tsx      # Top 20% - featured event
│   │   ├── EventGrid.tsx           # Bottom 80% - event grid
│   │   └── EventCard.tsx           # Individual event card
│   └── EventDetail/
│       ├── EventDetailView.tsx     # Main detail view container
│       ├── OrchestratorStatus.tsx  # Loading states display
│       ├── TickerChart.tsx         # Recharts component with baseline
│       ├── TickerGrid.tsx          # Grid of ticker cards
│       └── NewsDigest.tsx          # News cards display
├── lib/
│   ├── store/
│   │   └── eventStore.ts           # Zustand store
│   ├── data/
│   │   ├── mockEvents.ts           # Mock Polymarket events
│   │   └── mockTickers.ts          # Mock ticker suggestions
│   ├── hooks/
│   │   ├── useEventRotation.ts     # Simulates new events arriving
│   │   └── useStockData.ts         # Fetches stock prices
│   ├── services/
│   │   ├── mockOrchestrator.ts     # Simulates backend orchestration
│   │   └── stockApi.ts             # Finnhub API wrapper
│   └── types/
│       └── index.ts                # TypeScript interfaces
├── public/                         # Static assets
├── package.json
├── tsconfig.json
├── tailwind.config.ts
└── components.json                 # ShadCN config
```

**Installation Steps:**
1. Initialize Next.js: `npx create-next-app@latest . --typescript --tailwind --app --no-src-dir --import-alias "@/*"`
2. Install ShadCN: `npx shadcn-ui@latest init` (choose default options)
3. Add components: `npx shadcn-ui@latest add button card badge separator skeleton`
4. Install dependencies:
   ```bash
   npm install zustand recharts date-fns lucide-react
   npm install -D @types/node
   ```

---

### 1.2 Type Definitions

**File: `lib/types/index.ts`**

Define all TypeScript interfaces:

```typescript
// Core event from Polymarket
interface PolymarketEvent {
  id: string;                      // Unique event ID
  title: string;                   // "Will Trump win 2024?"
  description: string;             // Full event description
  probability: number;             // Current probability (0-1)
  priceChange24h: number;          // 24h change (-1 to 1)
  volume24h: number;               // 24h volume in USD
  liquidity: number;               // Total liquidity
  detectedAt: string;              // ISO timestamp when detected
  tags: string[];                  // ["politics", "election"]
  locked: boolean;                 // User locked this event
  category: string;                // "politics" | "sports" | "crypto" | "business"
  endDate: string;                 // Event resolution date
  marketUrl: string;               // Polymarket URL
}

// Ticker suggestion from GPT
interface TickerSuggestion {
  symbol: string;                  // "NVDA"
  name: string;                    // "NVIDIA Corporation"
  rationale: string;               // Why this ticker is relevant
  confidence: number;              // 0-1 confidence score
  direction: "bullish" | "bearish" | "neutral";
  relatedTags: string[];           // Tags from the event
}

// Historical price data point
interface PriceDataPoint {
  timestamp: string;               // ISO timestamp
  price: number;                   // Stock price
  volume: number;                  // Trading volume
}

// Stock data with history
interface StockData {
  symbol: string;
  currentPrice: number;
  priceHistory: PriceDataPoint[]; // Last 30 days
  change24h: number;
  changePercent24h: number;
  eventTimestamp: string;          // When user clicked event
}

// News card
interface NewsCard {
  id: string;
  title: string;
  snippet: string;                 // 2-3 sentence summary
  source: string;                  // "Bloomberg", "Reuters"
  publishedAt: string;             // ISO timestamp
  url: string;
  relevanceScore: number;          // 0-1
  sentiment: "positive" | "negative" | "neutral";
}

// Orchestrator status
type OrchestratorStatus =
  | "idle"
  | "fetching_tickers"             // Calling GPT
  | "fetching_prices"              // Calling stock API
  | "fetching_news"                // Calling news sources
  | "complete"
  | "error";

// Event detail data
interface EventDetailData {
  event: PolymarketEvent;
  status: OrchestratorStatus;
  tickers: TickerSuggestion[];
  stockData: Record<string, StockData>; // Keyed by symbol
  news: NewsCard[];
  error?: string;
}
```

---

### 1.3 Mock Data

**File: `lib/data/mockEvents.ts`**

Create 15-20 realistic Polymarket events covering different categories:

**Requirements:**
- Mix of categories: politics (40%), crypto (20%), business (20%), sports (10%), tech (10%)
- Varying probabilities: some close to 0.5 (contentious), some extreme (>0.8 or <0.2)
- Realistic titles mimicking Polymarket style
- Include recent dates (last 7 days for `detectedAt`)
- Price changes ranging from -0.15 to +0.15
- Volume ranging from $100K to $5M
- Tags should be relevant and reusable

**Example structure:**
```typescript
export const MOCK_EVENTS: PolymarketEvent[] = [
  {
    id: "evt_001",
    title: "Will Bitcoin reach $100,000 by end of 2025?",
    description: "Resolves YES if Bitcoin trades at $100k on any major exchange",
    probability: 0.62,
    priceChange24h: 0.08,
    volume24h: 2_400_000,
    liquidity: 8_500_000,
    detectedAt: "2025-01-17T14:32:00Z",
    tags: ["crypto", "bitcoin", "price-prediction"],
    locked: false,
    category: "crypto",
    endDate: "2025-12-31T23:59:59Z",
    marketUrl: "https://polymarket.com/..."
  },
  // ... 14-19 more events
];
```

**File: `lib/data/mockTickers.ts`**

Create a mapping of event tags/categories to ticker suggestions:

```typescript
// Maps event categories to relevant tickers
export const TICKER_MAPPINGS: Record<string, TickerSuggestion[]> = {
  crypto: [
    { symbol: "COIN", name: "Coinbase", rationale: "...", confidence: 0.85, direction: "bullish", relatedTags: ["crypto"] },
    { symbol: "MSTR", name: "MicroStrategy", rationale: "...", confidence: 0.78, direction: "bullish", relatedTags: ["bitcoin"] }
  ],
  politics: [
    { symbol: "LMT", name: "Lockheed Martin", rationale: "...", confidence: 0.72, direction: "neutral", relatedTags: ["defense"] },
    { symbol: "BA", name: "Boeing", rationale: "...", confidence: 0.68, direction: "neutral", relatedTags: ["defense"] }
  ],
  // ... more mappings
};

// Generates realistic ticker suggestions based on event
export function getMockTickers(event: PolymarketEvent): TickerSuggestion[] {
  // Logic to select 8-12 relevant tickers based on tags and category
}
```

---

### 1.4 State Management

**File: `lib/store/eventStore.ts`**

Zustand store managing:
- List of frontier events
- Currently selected event
- Event detail data
- Lock states

**Key state slices:**
```typescript
interface EventStore {
  // Frontier state
  events: PolymarketEvent[];
  featuredEvent: PolymarketEvent | null;

  // Selection state
  selectedEventId: string | null;
  eventDetailData: Record<string, EventDetailData>; // Cached detail data

  // Actions
  setEvents: (events: PolymarketEvent[]) => void;
  addNewEvent: (event: PolymarketEvent) => void; // Prepends to list
  toggleLock: (eventId: string) => void;
  selectEvent: (eventId: string) => void;
  clearSelection: () => void;
  updateEventDetail: (eventId: string, data: Partial<EventDetailData>) => void;
}
```

**Behavior:**
- `featuredEvent` is always the first event in `events` array
- New events are prepended unless locked
- Locked events stay in position even when new events arrive
- `eventDetailData` caches API responses to avoid re-fetching

---

### 1.5 Event Rotation Simulation

**File: `lib/hooks/useEventRotation.ts`**

Simulates new Polymarket events arriving every 25-35 seconds.

**Logic:**
1. On mount, set interval (random 25-35s)
2. Each tick:
   - Generate a new event (random from mock pool or slightly modify existing)
   - Increment probability by ±0.03 to simulate movement
   - Update `detectedAt` to current time
   - Call `eventStore.addNewEvent()`
3. Respects locked events (they don't rotate out)

**Visual feedback:**
- New event should "slide in" from top with animation
- Featured banner should highlight for 2s when new event arrives

---

### 1.6 Dashboard Components

**File: `components/Dashboard/FrontierBanner.tsx`**

**Purpose:** Display the newest/hottest event in a prominent banner (top 20% of viewport).

**Props:**
- `event: PolymarketEvent`
- `onSelect: () => void`
- `onToggleLock: () => void`

**Layout:**
- Full-width card with gradient background based on probability
- Large title (text-2xl)
- Probability badge (large, animated)
- 24h change indicator with arrow (green/red)
- Volume and liquidity stats
- Lock icon button (top-right)
- "Explore Details" CTA button
- Pulse animation on new event arrival

**Styling:**
- Use ShadCN Card component
- Gradient: green tint if priceChange24h > 0, red if < 0
- Responsive: stack on mobile, horizontal on desktop

---

**File: `components/Dashboard/EventCard.tsx`**

**Purpose:** Compact event card for grid view.

**Props:**
- `event: PolymarketEvent`
- `onSelect: () => void`
- `onToggleLock: () => void`
- `isLocked: boolean`

**Layout:**
- Compact card (250px height)
- Title (truncate to 2 lines)
- Probability badge
- 24h change (smaller)
- Volume (compact format: "$2.4M")
- Category badge
- Lock icon (subtle, top-right)
- Hover effect: lift shadow

**Interaction:**
- Click anywhere → select event
- Click lock icon → toggle lock (prevent propagation)
- Locked cards have gold border

---

**File: `components/Dashboard/EventGrid.tsx`**

**Purpose:** Grid of event cards (bottom 80% of viewport).

**Props:**
- `events: PolymarketEvent[]` (excludes featured event)
- `onSelectEvent: (id: string) => void`

**Layout:**
- CSS Grid: 3 columns on desktop, 2 on tablet, 1 on mobile
- Gap: 1rem
- Scrollable if overflows
- Show up to 15 events (pagination later)

**Sorting:**
- Locked events first (maintain user order)
- Then by `detectedAt` descending

---

**File: `app/page.tsx`**

**Purpose:** Main dashboard page composing banner + grid.

**Layout:**
```
┌─────────────────────────────────────┐
│     FrontierBanner (20% height)     │
├─────────────────────────────────────┤
│                                     │
│     EventGrid (80% height)          │
│                                     │
│     (scrollable)                    │
└─────────────────────────────────────┘
```

**State connections:**
- Subscribe to `eventStore`
- Handle event selection → open detail view in modal/sidebar
- Handle lock toggles

---

### 1.7 Event Detail Components

**File: `components/EventDetail/EventDetailView.tsx`**

**Purpose:** Modal/sidebar showing event deep dive.

**Props:**
- `eventId: string`
- `onClose: () => void`

**Layout (vertical scroll):**
1. Header: Event title, probability, close button
2. Orchestrator status indicator (progress bar or loading states)
3. Ticker grid (8-12 ticker cards)
4. News digest (4-6 news cards)

**Behavior:**
- On mount: trigger mock orchestration
- Show loading states for each section
- Simulate 2-3s delay for tickers, 3-4s for news

**Implementation:**
- Use ShadCN Dialog for modal (desktop)
- Use ShadCN Sheet for slide-over (mobile)
- Trap focus, ESC to close

---

**File: `components/EventDetail/OrchestratorStatus.tsx`**

**Purpose:** Visual indicator of backend processing status.

**Props:**
- `status: OrchestratorStatus`

**UI States:**
```
idle           → Hidden
fetching_tickers → "🔍 Analyzing market correlations..."
fetching_prices  → "📈 Fetching stock data..."
fetching_news    → "📰 Gathering news context..."
complete         → "✅ Analysis complete" (then fade out)
error            → "❌ Failed to load data"
```

**Styling:**
- Use ShadCN Progress component
- Animate progress bar: 0% → 33% → 66% → 100%
- Position: sticky below header

---

**File: `components/EventDetail/TickerChart.tsx`**

**Purpose:** Recharts line chart showing 30-day stock price with event baseline.

**Props:**
- `stockData: StockData`
- `eventTimestamp: string`

**Chart features:**
1. X-axis: Last 30 days
2. Y-axis: Stock price
3. Line chart of price history
4. Vertical dashed line at `eventTimestamp` (when user clicked)
5. Tooltip showing price + date
6. Color: green if current > baseline, red if <
7. Area fill below line (subtle gradient)

**Recharts components:**
- `<ResponsiveContainer>`
- `<LineChart>`
- `<Line>` (stroke: green/red)
- `<ReferenceLine>` (x = eventTimestamp, stroke: dashed)
- `<Tooltip>` (custom format)
- `<XAxis>` (format: "Jan 15")
- `<YAxis>` (format: "$123.45")

**Size:** 300px width × 200px height

---

**File: `components/EventDetail/TickerGrid.tsx`**

**Purpose:** Grid of ticker cards with mini charts.

**Props:**
- `tickers: TickerSuggestion[]`
- `stockData: Record<string, StockData>`

**Layout:**
- Grid: 3 columns (desktop), 2 (tablet), 1 (mobile)
- Each card:
  - Ticker symbol (bold, large)
  - Company name (small)
  - Rationale (2 lines, truncate)
  - Confidence badge (0-100%)
  - Direction indicator (↑ ↓ →)
  - Mini chart (150px × 100px)
  - Current price + 24h change

**Sorting:** By confidence descending

**Loading state:** Skeleton cards while `stockData` is empty

---

**File: `components/EventDetail/NewsDigest.tsx`**

**Purpose:** List of news cards.

**Props:**
- `news: NewsCard[]`

**Layout:**
- Vertical list (no grid)
- Each card:
  - Source + timestamp (small, gray)
  - Title (bold, medium)
  - Snippet (3 lines, truncate)
  - Sentiment badge (🟢 🔴 ⚪)
  - Relevance score (subtle, bottom-right)
  - Click → open URL in new tab

**Sorting:** By relevance score descending, then by publishedAt descending

**Empty state:** "No news found for this event"

---

### 1.8 Mock Orchestrator

**File: `lib/services/mockOrchestrator.ts`**

**Purpose:** Simulate backend processing flow with realistic delays.

**Function signature:**
```typescript
async function orchestrateEventDetail(
  event: PolymarketEvent,
  onStatusUpdate: (status: OrchestratorStatus) => void
): Promise<EventDetailData>
```

**Flow:**
1. Update status: `fetching_tickers`
2. Delay 1.5-2.5s
3. Generate tickers using `getMockTickers(event)`
4. Update status: `fetching_prices`
5. Delay 2-3s
6. For each ticker, generate mock `StockData` (see below)
7. Update status: `fetching_news`
8. Delay 1.5-2s
9. Generate 4-6 mock news cards (see below)
10. Update status: `complete`
11. Return full `EventDetailData`

**Mock stock data generation:**
- Generate 30 random price points (last 30 days)
- Use random walk algorithm: start at realistic price, ±2% per day
- Set `eventTimestamp` to current time

**Mock news generation:**
- Create 4-6 news cards with titles like:
  - "[Source] reports on [event topic]"
  - "Analysts predict [outcome] amid [event]"
- Use event tags to make snippets relevant
- Randomize sources: Bloomberg, Reuters, CNBC, WSJ
- Randomize sentiment and relevance scores

---

### 1.9 Stock API Integration (Real Data)

**File: `lib/services/stockApi.ts`**

**Purpose:** Fetch real historical stock prices from Finnhub.

**API: Finnhub**
- Free tier: 60 calls/min
- Endpoint: `https://finnhub.io/api/v1/stock/candle`
- Params: `symbol`, `resolution=D`, `from` (unix), `to` (unix)
- Response: `{ c: [prices], t: [timestamps], v: [volumes] }`

**Functions:**

```typescript
async function fetchStockHistory(
  symbol: string,
  days: number = 30
): Promise<PriceDataPoint[]>
```
- Calculate `from` = now - `days`
- Call Finnhub API
- Transform response to `PriceDataPoint[]`
- Handle rate limits (queue requests)
- Cache responses in memory (1 hour TTL)

```typescript
async function fetchMultipleStocks(
  symbols: string[]
): Promise<Record<string, StockData>>
```
- Batch fetch with 500ms delay between calls (respect rate limit)
- Return map of symbol → StockData
- Handle errors gracefully (skip failed symbols)

**Error handling:**
- If API fails, fallback to mock data
- Log errors but don't break UI

**API Key:**
- Store in `.env.local`: `NEXT_PUBLIC_FINNHUB_API_KEY=xxx`
- Get free key from finnhub.io

---

### 1.10 Custom Hooks

**File: `lib/hooks/useStockData.ts`**

**Purpose:** Hook to fetch stock data for tickers.

**Signature:**
```typescript
function useStockData(tickers: TickerSuggestion[]) {
  return {
    stockData: Record<string, StockData>,
    isLoading: boolean,
    error: string | null
  }
}
```

**Behavior:**
1. Extract symbols from tickers
2. Call `fetchMultipleStocks(symbols)`
3. Update state when data arrives
4. Cache data to avoid re-fetching

---

### 1.11 Styling & Polish

**Global styles (`app/globals.css`):**
- Dark theme: bg-slate-950, text-slate-50
- Accent colors: green (positive), red (negative), blue (neutral)
- Custom scrollbar styling
- Smooth transitions

**Animations:**
- Event card hover: lift shadow
- New event arrival: slide-in from top
- Probability badge: pulse on change
- Loading skeletons for async content

**Responsive breakpoints:**
- Mobile: < 768px
- Tablet: 768px - 1024px
- Desktop: > 1024px

**Accessibility:**
- All interactive elements keyboard accessible
- ARIA labels for icons
- Focus visible styles
- Color contrast WCAG AA

---

## Phase 2: Backend with Fake Data

### 2.1 Backend Setup

**Tech stack:**
- FastAPI (Python 3.11+)
- Pydantic for validation
- asyncio for concurrency
- uvicorn for ASGI server

**Directory structure:**
```
backend/
├── app.py                      # FastAPI app entry point
├── routes.py                   # API endpoints
├── models/
│   ├── __init__.py
│   ├── events.py               # Pydantic models for events
│   ├── tickers.py              # Ticker models
│   └── news.py                 # News models
├── services/
│   ├── ingestion.py            # Polymarket data ingestion (mocked)
│   ├── orchestrator.py         # Event detail orchestration
│   ├── asset_mapper.py         # Ticker suggestion logic (mocked)
│   └── news_agents.py          # News fetching (mocked)
├── utils/
│   ├── __init__.py
│   ├── cache.py                # Simple in-memory cache
│   └── scoring.py              # Event scoring algorithms
├── data/
│   ├── mock_events.json        # Same structure as frontend
│   └── mock_tickers.json       # Ticker mappings
├── tests/
│   └── test_orchestrator.py
├── requirements.txt
└── .env
```

**Installation:**
```bash
python -m venv venv
source venv/bin/activate
pip install fastapi uvicorn pydantic python-dotenv httpx
```

---

### 2.2 Pydantic Models

**File: `models/events.py`**

Mirror frontend types in Pydantic:

```python
from pydantic import BaseModel, Field
from typing import List, Optional
from datetime import datetime

class PolymarketEvent(BaseModel):
    id: str
    title: str
    description: str
    probability: float = Field(ge=0, le=1)
    priceChange24h: float
    volume24h: float
    liquidity: float
    detectedAt: datetime
    tags: List[str]
    locked: bool = False
    category: str
    endDate: datetime
    marketUrl: str

class EventListResponse(BaseModel):
    events: List[PolymarketEvent]
    total: int
```

**File: `models/tickers.py`**
```python
class TickerSuggestion(BaseModel):
    symbol: str
    name: str
    rationale: str
    confidence: float = Field(ge=0, le=1)
    direction: Literal["bullish", "bearish", "neutral"]
    relatedTags: List[str]

class StockData(BaseModel):
    symbol: str
    currentPrice: float
    priceHistory: List[PriceDataPoint]
    change24h: float
    changePercent24h: float
    eventTimestamp: datetime
```

**File: `models/news.py`**
```python
class NewsCard(BaseModel):
    id: str
    title: str
    snippet: str
    source: str
    publishedAt: datetime
    url: str
    relevanceScore: float = Field(ge=0, le=1)
    sentiment: Literal["positive", "negative", "neutral"]
```

---

### 2.3 API Endpoints

**File: `routes.py`**

**Endpoints:**

```
GET /api/events
  → Returns list of frontier events
  Query params: ?limit=20&category=crypto
  Response: EventListResponse

GET /api/events/{event_id}
  → Returns single event details
  Response: PolymarketEvent

POST /api/events/{event_id}/lock
  → Toggle lock state
  Response: { locked: true }

GET /api/events/{event_id}/detail
  → Triggers orchestration, returns full detail
  Response: EventDetailData (with tickers, stock data, news)

  This endpoint:
  1. Calls orchestrator.orchestrate_event_detail()
  2. Streams progress via Server-Sent Events (optional)
  3. Returns complete data when ready

GET /health
  → Health check
  Response: { status: "ok" }
```

**CORS:**
- Allow `http://localhost:3000` (Next.js dev server)

**Error handling:**
- 404 for missing events
- 500 for orchestration failures
- Structured error responses: `{ error: "message", code: "EVENT_NOT_FOUND" }`

---

### 2.4 Ingestion Service (Mocked)

**File: `services/ingestion.py`**

**Purpose:** Simulate Polymarket data ingestion.

**In Phase 2 (fake data):**
- Load events from `data/mock_events.json`
- Every 30s, "rotate" events by updating probabilities slightly
- Store events in memory (simple dict)

**Function:**
```python
class IngestionService:
    def __init__(self):
        self.events: Dict[str, PolymarketEvent] = {}
        self.load_mock_data()

    def load_mock_data(self):
        # Load from JSON, populate self.events
        pass

    async def start_polling(self):
        # Background task: every 30s, update probabilities
        while True:
            await asyncio.sleep(30)
            self.update_events()

    def update_events(self):
        # Randomly adjust probabilities by ±0.03
        # Update detectedAt for "new" events
        pass

    def get_frontier_events(self, limit: int = 20) -> List[PolymarketEvent]:
        # Return top events sorted by score
        pass

    def calculate_frontier_score(self, event: PolymarketEvent) -> float:
        # Score = abs(priceChange24h) * log(volume24h) * liquidity_factor
        # Higher score = more interesting
        pass
```

**Startup:**
- In `app.py`, start `ingestion_service.start_polling()` as background task

---

### 2.5 Orchestrator Service (Mocked)

**File: `services/orchestrator.py`**

**Purpose:** Coordinate ticker mapping + stock data + news fetching.

**Function:**
```python
class OrchestratorService:
    def __init__(self):
        self.asset_mapper = AssetMapperService()
        self.news_agent = NewsAgentService()

    async def orchestrate_event_detail(
        self,
        event: PolymarketEvent
    ) -> EventDetailData:
        # Step 1: Get ticker suggestions
        tickers = await self.asset_mapper.get_tickers(event)

        # Step 2: Fetch stock data (parallel)
        stock_data = await self.fetch_stock_data([t.symbol for t in tickers])

        # Step 3: Fetch news (parallel with step 2)
        news = await self.news_agent.get_news(event)

        return EventDetailData(
            event=event,
            tickers=tickers,
            stockData=stock_data,
            news=news,
            status="complete"
        )

    async def fetch_stock_data(
        self,
        symbols: List[str]
    ) -> Dict[str, StockData]:
        # For Phase 2: generate mock data
        # For Phase 3: call real Finnhub API
        pass
```

---

### 2.6 Asset Mapper Service (Mocked)

**File: `services/asset_mapper.py`**

**Purpose:** Map events to relevant stock tickers.

**In Phase 2 (fake data):**
- Use `data/mock_tickers.json` (same mappings as frontend)
- Match event tags/category to predefined tickers
- Return 8-12 suggestions

**Function:**
```python
class AssetMapperService:
    def __init__(self):
        self.ticker_mappings = self.load_mappings()

    def load_mappings(self) -> Dict[str, List[TickerSuggestion]]:
        # Load from JSON
        pass

    async def get_tickers(
        self,
        event: PolymarketEvent
    ) -> List[TickerSuggestion]:
        # Match tags to mappings
        # Return top 12 by confidence
        pass
```

**In Phase 3:** Replace with GPT-4 call (see Phase 3 details).

---

### 2.7 News Agent Service (Mocked)

**File: `services/news_agents.py`**

**Purpose:** Fetch news related to event.

**In Phase 2 (fake data):**
- Generate 4-6 mock news cards
- Use event title/tags to create realistic snippets

**Function:**
```python
class NewsAgentService:
    async def get_news(
        self,
        event: PolymarketEvent
    ) -> List[NewsCard]:
        # Generate mock news based on event tags
        # Return 4-6 cards
        pass
```

**In Phase 3:** Integrate real news APIs (see Phase 3 details).

---

### 2.8 Caching

**File: `utils/cache.py`**

Simple in-memory cache with TTL:

```python
class Cache:
    def __init__(self):
        self._cache: Dict[str, Tuple[Any, float]] = {}

    def get(self, key: str) -> Optional[Any]:
        if key in self._cache:
            value, expiry = self._cache[key]
            if time.time() < expiry:
                return value
            del self._cache[key]
        return None

    def set(self, key: str, value: Any, ttl: int = 3600):
        self._cache[key] = (value, time.time() + ttl)
```

**Usage:**
- Cache stock data: 1 hour TTL
- Cache ticker suggestions: 1 day TTL
- Cache news: 30 min TTL

---

### 2.9 Frontend Integration

**Update frontend to call backend:**

**Create new file: `lib/services/api.ts`**

```typescript
const API_BASE = process.env.NEXT_PUBLIC_API_URL || "http://localhost:8000";

export async function fetchFrontierEvents(): Promise<PolymarketEvent[]> {
  const res = await fetch(`${API_BASE}/api/events`);
  return res.json();
}

export async function fetchEventDetail(eventId: string): Promise<EventDetailData> {
  const res = await fetch(`${API_BASE}/api/events/${eventId}/detail`);
  return res.json();
}

export async function toggleEventLock(eventId: string): Promise<void> {
  await fetch(`${API_BASE}/api/events/${eventId}/lock`, { method: "POST" });
}
```

**Update components:**
- Replace `mockOrchestrator` calls with `fetchEventDetail()`
- Replace local event state with API calls to `/api/events`
- Keep `useEventRotation` for now (simulates real-time updates)

---

### 2.10 Testing

**Run backend:**
```bash
cd backend
uvicorn app:app --reload --port 8000
```

**Test endpoints:**
```bash
curl http://localhost:8000/api/events
curl http://localhost:8000/api/events/evt_001/detail
```

**Run frontend:**
```bash
cd frontend
npm run dev
```

Visit `http://localhost:3000` and verify:
- Events load from backend
- Clicking event triggers detail fetch
- Tickers and news display correctly

---

## Phase 3: Real Data Integration with LLMs

### 3.1 Polymarket API Integration

**File: `services/ingestion.py` (update)**

**Replace mock data with real Polymarket API calls.**

**Polymarket API:**
- Endpoint: `https://clob.polymarket.com/markets`
- No auth required for public data
- Returns markets with probabilities, volume, etc.

**Implementation:**
```python
import httpx

class IngestionService:
    def __init__(self):
        self.client = httpx.AsyncClient()
        self.events: Dict[str, PolymarketEvent] = {}

    async def fetch_polymarket_markets(self) -> List[Dict]:
        response = await self.client.get("https://clob.polymarket.com/markets")
        return response.json()

    async def start_polling(self):
        while True:
            markets = await self.fetch_polymarket_markets()
            self.process_markets(markets)
            await asyncio.sleep(60)  # Poll every 60s

    def process_markets(self, markets: List[Dict]):
        # Transform Polymarket response to PolymarketEvent
        # Calculate price changes (compare to previous poll)
        # Update self.events
        pass

    def calculate_frontier_score(self, event: PolymarketEvent) -> float:
        # Velocity-based scoring:
        # - High probability swing in last hour/day
        # - High volume
        # - Sufficient liquidity (>$100k)

        velocity = abs(event.priceChange24h) / 0.01  # Normalize
        volume_factor = log10(event.volume24h / 100_000)
        liquidity_factor = min(event.liquidity / 1_000_000, 2)

        return velocity * volume_factor * liquidity_factor
```

**Key transformations:**
- Polymarket `outcome_prices` → `probability`
- Calculate `priceChange24h` by comparing with previous snapshot
- Extract tags from market `question` and `description` using NLP (spaCy)

**Entity extraction for tags:**
```python
import spacy

nlp = spacy.load("en_core_web_sm")

def extract_tags(text: str) -> List[str]:
    doc = nlp(text)
    tags = []
    for ent in doc.ents:
        if ent.label_ in ["PERSON", "ORG", "GPE", "EVENT"]:
            tags.append(ent.text.lower())
    return tags
```

---

### 3.2 GPT-4 Ticker Mapping

**File: `services/asset_mapper.py` (update)**

**Replace mock mappings with GPT-4 calls.**

**OpenAI API:**
- Model: `gpt-4-turbo-preview` or `gpt-4o`
- Endpoint: `/v1/chat/completions`

**Prompt engineering:**
```python
import openai
import json

class AssetMapperService:
    def __init__(self):
        self.client = openai.AsyncOpenAI(api_key=os.getenv("OPENAI_API_KEY"))

    async def get_tickers(
        self,
        event: PolymarketEvent
    ) -> List[TickerSuggestion]:
        prompt = self.build_prompt(event)

        response = await self.client.chat.completions.create(
            model="gpt-4o-mini",  # Cheaper, faster
            messages=[
                {"role": "system", "content": SYSTEM_PROMPT},
                {"role": "user", "content": prompt}
            ],
            response_format={"type": "json_object"}
        )

        result = json.loads(response.choices[0].message.content)
        return [TickerSuggestion(**t) for t in result["tickers"]]

    def build_prompt(self, event: PolymarketEvent) -> str:
        return f"""
Analyze this prediction market event and suggest 8-12 stock tickers that are likely to be affected:

Event: {event.title}
Description: {event.description}
Current probability: {event.probability:.0%}
24h change: {event.priceChange24h:+.1%}
Category: {event.category}
Tags: {", ".join(event.tags)}

For each ticker, provide:
1. Symbol (e.g., "NVDA")
2. Company name
3. Rationale (why this stock is affected, 1-2 sentences)
4. Confidence (0-1 scale)
5. Direction (bullish, bearish, neutral)
6. Related tags from the event

Return JSON in this format:
{{
  "tickers": [
    {{
      "symbol": "AAPL",
      "name": "Apple Inc.",
      "rationale": "...",
      "confidence": 0.85,
      "direction": "bullish",
      "relatedTags": ["tech", "consumer"]
    }},
    ...
  ]
}}
"""

SYSTEM_PROMPT = """
You are a financial analyst specializing in identifying market-moving events and their impact on equities.

Your task is to map prediction market events to publicly traded stocks that are likely to be affected.

Guidelines:
- Focus on direct correlations (e.g., Fed policy → banking stocks)
- Include indirect effects (e.g., oil prices → airlines)
- Confidence should reflect likelihood of impact, not event outcome
- Direction is relative to the event resolving "YES"
- Prioritize liquid, well-known stocks (avoid penny stocks)
- Aim for 8-12 suggestions, ranked by confidence
"""
```

**Response validation:**
- Ensure JSON is valid
- Validate ticker symbols (basic regex: `^[A-Z]{1,5}$`)
- Clamp confidence to [0, 1]
- Fallback to mock data if GPT fails

**Cost optimization:**
- Use `gpt-4o-mini` instead of `gpt-4` (10x cheaper)
- Cache results per event (1 day TTL)
- Batch multiple events if possible

---

### 3.3 Real Stock Data

**File: `services/orchestrator.py` (update)**

**Replace mock stock data with Finnhub API calls.**

```python
import httpx
from datetime import datetime, timedelta

class StockDataService:
    def __init__(self):
        self.api_key = os.getenv("FINNHUB_API_KEY")
        self.client = httpx.AsyncClient()
        self.cache = Cache()

    async def fetch_stock_history(
        self,
        symbol: str,
        days: int = 30
    ) -> List[PriceDataPoint]:
        cache_key = f"stock:{symbol}:{days}"
        cached = self.cache.get(cache_key)
        if cached:
            return cached

        to_ts = int(datetime.now().timestamp())
        from_ts = int((datetime.now() - timedelta(days=days)).timestamp())

        url = "https://finnhub.io/api/v1/stock/candle"
        params = {
            "symbol": symbol,
            "resolution": "D",
            "from": from_ts,
            "to": to_ts,
            "token": self.api_key
        }

        response = await self.client.get(url, params=params)
        data = response.json()

        if data["s"] != "ok":
            raise ValueError(f"Finnhub error for {symbol}")

        points = [
            PriceDataPoint(
                timestamp=datetime.fromtimestamp(t),
                price=p,
                volume=v
            )
            for t, p, v in zip(data["t"], data["c"], data["v"])
        ]

        self.cache.set(cache_key, points, ttl=3600)
        return points

    async def fetch_multiple_stocks(
        self,
        symbols: List[str]
    ) -> Dict[str, StockData]:
        results = {}

        # Rate limit: 60 calls/min = 1 per second
        for symbol in symbols:
            try:
                history = await self.fetch_stock_history(symbol)
                results[symbol] = StockData(
                    symbol=symbol,
                    currentPrice=history[-1].price,
                    priceHistory=history,
                    change24h=history[-1].price - history[-2].price,
                    changePercent24h=(history[-1].price / history[-2].price - 1) * 100,
                    eventTimestamp=datetime.now()
                )
                await asyncio.sleep(1)  # Rate limit
            except Exception as e:
                print(f"Error fetching {symbol}: {e}")
                # Skip failed stocks

        return results
```

**Alternative: Alpha Vantage**
- If Finnhub rate limits are too restrictive
- Free tier: 25 calls/day (very limited)
- Endpoint: `https://www.alphavantage.co/query?function=TIME_SERIES_DAILY`

**Recommendation:** Use Finnhub for demo, implement queue system for production.

---

### 3.4 News Integration

**File: `services/news_agents.py` (update)**

**Replace mock news with real API calls.**

**Option 1: NewsAPI.org**
- Free tier: 100 calls/day
- Endpoint: `https://newsapi.org/v2/everything`

```python
class NewsAgentService:
    def __init__(self):
        self.api_key = os.getenv("NEWSAPI_KEY")
        self.client = httpx.AsyncClient()

    async def get_news(
        self,
        event: PolymarketEvent
    ) -> List[NewsCard]:
        query = self.build_query(event)

        url = "https://newsapi.org/v2/everything"
        params = {
            "q": query,
            "sortBy": "relevancy",
            "language": "en",
            "pageSize": 10,
            "apiKey": self.api_key
        }

        response = await self.client.get(url, params=params)
        articles = response.json()["articles"]

        news_cards = []
        for i, article in enumerate(articles[:6]):
            news_cards.append(NewsCard(
                id=f"news_{i}",
                title=article["title"],
                snippet=article["description"] or article["content"][:200],
                source=article["source"]["name"],
                publishedAt=datetime.fromisoformat(article["publishedAt"].replace("Z", "+00:00")),
                url=article["url"],
                relevanceScore=self.calculate_relevance(article, event),
                sentiment=self.analyze_sentiment(article["title"])
            ))

        return news_cards

    def build_query(self, event: PolymarketEvent) -> str:
        # Extract key terms from title
        # Use tags as additional keywords
        keywords = event.tags[:3]  # Top 3 tags
        return f"{event.title.split('?')[0]} {' '.join(keywords)}"

    def calculate_relevance(self, article: Dict, event: PolymarketEvent) -> float:
        # Simple keyword matching
        title_lower = article["title"].lower()
        score = 0.0
        for tag in event.tags:
            if tag.lower() in title_lower:
                score += 0.2
        return min(score, 1.0)

    def analyze_sentiment(self, text: str) -> str:
        # Simple sentiment (or use TextBlob/transformers)
        positive_words = ["up", "rise", "gain", "win", "success"]
        negative_words = ["down", "fall", "lose", "crisis", "fail"]

        text_lower = text.lower()
        pos_count = sum(1 for w in positive_words if w in text_lower)
        neg_count = sum(1 for w in negative_words if w in text_lower)

        if pos_count > neg_count:
            return "positive"
        elif neg_count > pos_count:
            return "negative"
        return "neutral"
```

**Option 2: Perplexity API**
- More accurate, AI-powered search
- Endpoint: `/v1/chat/completions`
- Use prompt to extract relevant news

```python
async def get_news_perplexity(
    self,
    event: PolymarketEvent
) -> List[NewsCard]:
    prompt = f"""
Find 5 recent news articles related to: {event.title}

Focus on articles from last 7 days from reputable sources.
For each article provide: title, source, brief summary, URL.
"""

    response = await self.client.post(
        "https://api.perplexity.ai/chat/completions",
        headers={"Authorization": f"Bearer {self.perplexity_key}"},
        json={
            "model": "llama-3.1-sonar-small-128k-online",
            "messages": [{"role": "user", "content": prompt}]
        }
    )

    # Parse response and convert to NewsCard[]
    pass
```

**Recommendation:** Use NewsAPI for demo (free tier sufficient), Perplexity for better results.

---

### 3.5 Error Handling & Fallbacks

**Graceful degradation:**

1. **GPT fails → Use mock ticker mappings**
```python
async def get_tickers(self, event):
    try:
        return await self.get_tickers_gpt(event)
    except Exception as e:
        logger.warning(f"GPT failed, using fallback: {e}")
        return self.get_tickers_fallback(event)
```

2. **Stock API fails → Show tickers without charts**
```python
async def fetch_multiple_stocks(self, symbols):
    results = {}
    for symbol in symbols:
        try:
            results[symbol] = await self.fetch_stock_history(symbol)
        except Exception:
            results[symbol] = None  # Frontend handles missing data
    return results
```

3. **News API fails → Show empty state**
```python
async def get_news(self, event):
    try:
        return await self.get_news_api(event)
    except Exception:
        return []  # Frontend shows "No news available"
```

**Rate limit handling:**
- Implement exponential backoff
- Queue requests if hitting limits
- Show user-friendly errors: "Rate limit reached, please wait..."

---

### 3.6 Environment Variables

**File: `backend/.env`**
```
OPENAI_API_KEY=sk-...
FINNHUB_API_KEY=...
NEWSAPI_KEY=...
PERPLEXITY_API_KEY=...  # Optional
```

**File: `frontend/.env.local`**
```
NEXT_PUBLIC_API_URL=http://localhost:8000
NEXT_PUBLIC_FINNHUB_API_KEY=...  # If calling from frontend
```

---

### 3.7 Performance Optimization

**Parallel execution:**
```python
async def orchestrate_event_detail(self, event):
    # Run ticker fetch, stock data, and news in parallel
    tickers_task = self.asset_mapper.get_tickers(event)
    news_task = self.news_agent.get_news(event)

    tickers = await tickers_task
    news, stock_data = await asyncio.gather(
        news_task,
        self.stock_service.fetch_multiple_stocks([t.symbol for t in tickers])
    )

    return EventDetailData(...)
```

**Caching strategy:**
- Ticker suggestions: 24h (events don't change often)
- Stock data: 1h (prices update frequently)
- News: 30min (articles update frequently)
- Polymarket events: 1min (probabilities change constantly)

**Batch requests:**
- Fetch multiple stocks with staggered delays
- Use connection pooling (httpx persistent connections)

---

### 3.8 Monitoring & Logging

**Add structured logging:**
```python
import logging
import structlog

logger = structlog.get_logger()

@app.get("/api/events/{event_id}/detail")
async def get_event_detail(event_id: str):
    logger.info("event_detail_requested", event_id=event_id)

    try:
        result = await orchestrator.orchestrate_event_detail(event)
        logger.info("event_detail_complete", event_id=event_id, ticker_count=len(result.tickers))
        return result
    except Exception as e:
        logger.error("event_detail_failed", event_id=event_id, error=str(e))
        raise
```

**Metrics to track:**
- API response times (p50, p95, p99)
- GPT call latency and success rate
- Stock API success rate
- Cache hit rate
- Events detected per minute

**Tools:**
- Use FastAPI middleware for request timing
- Log to stdout (Render/Railway will capture)
- Optional: Sentry for error tracking

---

### 3.9 Deployment Considerations

**Backend (Render/Railway):**
- Deploy as web service
- Set environment variables
- Use worker dyno for ingestion polling
- Enable CORS for frontend domain

**Frontend (Vercel):**
- Deploy Next.js app
- Set `NEXT_PUBLIC_API_URL` to production backend URL
- Enable edge caching for static assets

**Database (optional):**
- If scaling beyond in-memory: use PostgreSQL for events
- Use Redis for caching

---

### 3.10 Testing with Real Data

**Test checklist:**

1. **Polymarket ingestion:**
   - Verify events are fetched and scored correctly
   - Check that probabilities update
   - Ensure frontier rotates based on score

2. **GPT ticker mapping:**
   - Test with various event types (crypto, politics, sports)
   - Verify JSON parsing works
   - Check confidence scores are reasonable

3. **Stock data:**
   - Test with valid symbols (AAPL, MSFT, TSLA)
   - Test with invalid symbols (should handle gracefully)
   - Verify 30-day history is complete

4. **News fetching:**
   - Test with recent events (should find articles)
   - Test with obscure events (should handle empty results)
   - Verify sentiment analysis is reasonable

5. **End-to-end:**
   - Load dashboard → see real Polymarket events
   - Click event → see GPT-generated tickers
   - Charts should show real stock prices
   - News should be recent and relevant

---

## Summary of Implementation Phases

**Phase 1: Frontend with Mock Data (6-8 hours)**
- Next.js project with ShadCN
- Mock Polymarket events
- Dashboard with banner + grid
- Event detail modal with loading states
- Mock orchestration flow
- Event rotation simulation
- Real stock charts (via Finnhub)

**Phase 2: Backend with Fake Data (4-6 hours)**
- FastAPI setup
- REST API endpoints
- Mock Polymarket ingestion
- Mock ticker mappings
- Mock news generation
- Frontend integration

**Phase 3: Real Data Integration (6-8 hours)**
- Polymarket API integration
- GPT-4 ticker mapping
- Real stock data (Finnhub)
- Real news (NewsAPI/Perplexity)
- Error handling and fallbacks
- Caching and optimization

**Total estimated time: 16-22 hours** (hackathon-feasible with 2-3 developers)

---

## Key Success Metrics

**User experience:**
- Events update in real-time (or every 30s)
- Event detail loads in < 10s
- Charts are readable and accurate
- News is relevant and recent

**Technical:**
- API response times < 2s (excluding orchestration)
- Orchestration completes in 5-10s
- Cache hit rate > 50%
- Zero crashes during demo

**Demo readiness:**
- 10+ interesting events in frontier
- Ticker suggestions look reasonable
- Stock charts show clear trends
- News adds context to events

---

## Risk Mitigation

**Risks:**
1. **Polymarket API changes** → Have mock data ready as fallback
2. **GPT rate limits** → Cache aggressively, use gpt-4o-mini
3. **Stock API limits** → Queue requests, show partial data
4. **News API restrictions** → Use multiple sources, fallback to mock
5. **Slow orchestration** → Set aggressive timeouts, show partial results

**Mitigation:**
- Build fallbacks for every external API
- Test with real APIs early (Phase 2 → Phase 3 transition)
- Have mock data that looks realistic
- Prioritize UX over perfect data

---

## Next Steps

1. **Validate APIs:**
   - Sign up for Polymarket, Finnhub, NewsAPI, OpenAI
   - Test API calls with curl/Postman
   - Check rate limits and pricing

2. **Assign tasks:**
   - Developer 1: Frontend (Phase 1)
   - Developer 2: Backend (Phase 2)
   - Developer 3: LLM integration (Phase 3)

3. **Set checkpoints:**
   - Day 1 EOD: Phase 1 complete
   - Day 2 EOD: Phase 2 complete
   - Day 3: Phase 3 + polish

4. **Demo preparation:**
   - Prepare 2-3 interesting events to showcase
   - Have backup localhost recording in case of API issues
   - Practice walkthrough: event detection → detail dive → ticker insights
