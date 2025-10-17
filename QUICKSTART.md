# Polymarket Volume Spike Detector - Quick Start Guide

## What Was Built

A real-time prediction market monitoring system that detects volume spikes in Polymarket betting markets and displays them in an interactive dashboard.

### Key Features

1. **Volume Spike Detection**
   - Analyzes 24hr trading volume vs. 7-day average
   - Automatically flags markets with >50% volume increase (1.5x spike threshold)
   - Currently tracking ~100 active markets with ~54 showing volume spikes

2. **Real-Time Data Pipeline**
   - Backend polls Polymarket Gamma API every 60 seconds
   - Frontend polls backend API every 30 seconds
   - Live updates without page refresh

3. **Interactive Dashboard**
   - Featured event banner highlighting top market
   - Grid view of all frontier events
   - Visual indicators for volume spikes (amber badges/borders)
   - Displays probability, 24h volume, price changes

4. **API Integration**
   - RESTful backend API with FastAPI
   - Clean separation between data ingestion and frontend display
   - Auto-generated API documentation

### Architecture

```
Polymarket Gamma API
        ↓
   Backend (FastAPI)
   - Ingestion Service (polls every 60s)
   - Volume Spike Detection
   - In-memory event storage
        ↓
   Frontend (Next.js)
   - Dashboard display
   - Real-time updates (polls every 30s)
   - Event details (future)
```

---

## How to Launch

### Prerequisites

- Python 3.11+
- Node.js 18+
- npm or yarn

### Backend Setup

1. **Navigate to backend directory:**
   ```bash
   cd backend
   ```

2. **Create virtual environment (if not exists):**
   ```bash
   python3 -m venv venv
   ```

3. **Activate virtual environment:**
   ```bash
   source venv/bin/activate
   ```

4. **Install dependencies:**
   ```bash
   pip install -r requirements.txt
   ```

5. **Start the backend server:**
   ```bash
   python app.py
   ```

   **Expected output:**
   ```
   INFO: Starting Polymarket ingestion service...
   INFO: Fetched 100 markets from Gamma API
   INFO: Processed 100 events
   INFO: Backend started successfully
   INFO: Uvicorn running on http://0.0.0.0:8000
   ```

6. **Verify backend is running:**
   - Health check: http://localhost:8000/health
   - API docs: http://localhost:8000/docs
   - Events: http://localhost:8000/api/events

### Frontend Setup

1. **Open a new terminal and navigate to frontend:**
   ```bash
   cd frontend
   ```

2. **Install dependencies (if not already done):**
   ```bash
   npm install
   ```

3. **Ensure `.env.local` exists with:**
   ```bash
   NEXT_PUBLIC_API_URL=http://localhost:8000
   ```

4. **Start the development server:**
   ```bash
   npm run dev
   ```

   **Expected output:**
   ```
   ▲ Next.js 15.5.6 (Turbopack)
   - Local:        http://localhost:3000 (or 3002 if 3000 is in use)
   ✓ Ready in ~800ms
   ```

5. **Open your browser:**
   - Go to: http://localhost:3000 (or whatever port is shown)
   - Open browser console (F12) to see detailed logs

---

## What You'll See

### Dashboard View

1. **Featured Event Banner (Top)**
   - Shows highest-priority market
   - Large volume spike badge if detected
   - Displays probability, 24h volume, price change

2. **Event Grid (Below)**
   - 20 most interesting markets
   - Cards show:
     - Market title
     - Probability
     - Volume spike indicator (if applicable)
     - 24h trading volume
     - 24h price change

3. **Visual Indicators**
   - **Amber borders/badges**: Volume spike detected
   - **Green text**: Positive price change
   - **Red text**: Negative price change

### Console Logs

**Browser Console:**
```
[API] Initialized with base URL: http://localhost:8000
[useFrontierEvents] Initializing...
[API] Fetching frontier events (limit: 20, spike_only: false)
[API] Fetched 20 events (18 with spikes)
[Dashboard] Mounted with 20 events
```

**Backend Terminal:**
```
INFO: Fetched 100 markets from Gamma API
INFO: Processed 100 events
INFO: Current events: 100, Volume spikes: 54
```

---

## API Endpoints

### Backend API (Port 8000)

- **GET `/health`** - Server health check
- **GET `/api/events`** - Get frontier events
  - Query params: `?limit=20&spike_only=false`
- **GET `/api/events/{id}`** - Get single event
- **POST `/api/events/{id}/lock`** - Toggle event lock
- **GET `/api/events/spikes/summary`** - Volume spike statistics
- **POST `/api/refresh`** - Force data refresh
- **GET `/docs`** - Interactive API documentation

### Example Usage

```bash
# Get top 5 events with volume spikes
curl "http://localhost:8000/api/events?limit=5&spike_only=true"

# Get spike summary
curl "http://localhost:8000/api/events/spikes/summary"

# Force refresh
curl -X POST "http://localhost:8000/api/refresh"
```

---

## Volume Spike Detection Logic

**Algorithm:**
```python
avg_daily_volume = volume_7day / 7
spike_ratio = volume_24hr / avg_daily_volume

if spike_ratio >= 1.5:  # 50% above average
    volume_spike_detected = True
```

**Example:**
- Weekly volume: $700k
- Average daily: $100k
- Today's volume: $323k
- Spike ratio: 3.23x (223% above average) ✅ SPIKE DETECTED

---

## Technical Stack

**Backend:**
- FastAPI (Python web framework)
- httpx (async HTTP client)
- Pydantic (data validation)
- Uvicorn (ASGI server)

**Frontend:**
- Next.js 15 (React framework)
- TypeScript
- Tailwind CSS
- ShadCN UI components
- Zustand (state management)
- Lucide React (icons)

**External API:**
- Polymarket Gamma Markets API (https://gamma-api.polymarket.com)

---

## Troubleshooting

**Backend won't start:**
- Check Python version: `python3 --version` (need 3.11+)
- Verify virtual environment is activated
- Reinstall dependencies: `pip install -r requirements.txt`

**Frontend won't connect:**
- Check backend is running on port 8000
- Verify `.env.local` has correct API URL
- Check browser console for CORS errors

**No events showing:**
- Wait 5-10 seconds for initial data fetch
- Check backend logs for API errors
- Verify Polymarket API is accessible: `curl https://gamma-api.polymarket.com/markets?limit=1`

**Port conflicts:**
- Backend uses port 8000 (configurable in app.py)
- Frontend uses port 3000+ (Next.js auto-finds available port)

---

## Next Steps

Current system is Phase 1 complete with real data integration. Future enhancements:

1. **Event Detail View** - Click on events to see deep analysis
2. **GPT-4 Ticker Mapping** - Suggest related stock tickers
3. **Stock Charts** - Historical price data for suggested tickers
4. **News Integration** - Relevant news articles for each market
5. **WebSocket Support** - True real-time updates without polling
6. **Filters & Search** - Category filtering, search by keyword
7. **User Preferences** - Save favorite markets, custom thresholds

---

## Project Structure

```
.
├── backend/
│   ├── app.py                 # FastAPI entry point
│   ├── routes.py              # API route definitions
│   ├── models/                # Pydantic data models
│   ├── services/
│   │   ├── ingestion.py       # Polymarket polling & spike detection
│   │   └── (orchestrator, asset_mapper, news_agents - future)
│   └── requirements.txt       # Python dependencies
│
├── frontend/
│   ├── app/
│   │   └── page.tsx           # Main dashboard page
│   ├── components/
│   │   ├── Dashboard/         # Banner and card components
│   │   └── EventDetail/       # Detail view (future)
│   ├── lib/
│   │   ├── services/
│   │   │   └── api.ts         # Backend API client
│   │   ├── hooks/
│   │   │   └── useFrontierEvents.ts  # Data fetching hook
│   │   ├── store/
│   │   │   └── eventStore.ts  # Zustand state management
│   │   └── types/
│   │       └── index.ts       # TypeScript interfaces
│   └── package.json           # Node dependencies
│
├── IMPLEMENTATION_PLAN.md     # Full project plan
└── QUICKSTART.md             # This file
```

---

## Support

For issues or questions, check:
1. Backend logs (terminal running `app.py`)
2. Frontend logs (browser console)
3. Network tab in browser dev tools
4. Backend API docs at http://localhost:8000/docs

**Common Issues:**
- API timeout: Increase timeout in `services/ingestion.py` (line 21)
- Memory issues: Reduce event limit in `app/page.tsx` (line 19)
- Slow updates: Adjust poll intervals in respective files
