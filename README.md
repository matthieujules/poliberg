# Frontier Markets Dashboard

Hackathon scaffold for a prediction-market monitoring dashboard blending frontier event detection, multi-source news surfacing, and related asset mapping.

## Project Layout
- `frontend/` – Next.js SPA showing live frontier ticker grid, event detail panel, and news/ticker results.
- `backend/` – FastAPI app with modules for ingestion polling, orchestrator fan-out, and API routes.
- `infrastructure/` – Local configs and deployment helpers (docker-compose, environment templates).
- `scripts/` – Dev utilities (data seeding, mock responders, combined startup).
- `docs/` – Architecture notes and quick runbooks.

## Backend Flow Overview
1. `services/ingestion.py` polls Polymarket, scores swing velocity, and updates the in-memory frontier list.
2. `routes.py` exposes `GET /api/events` for initial load and handles lock/unlock actions.
3. When the UI requests `/api/events/{id}/detail`, `services/orchestrator.py` concurrently kicks off news (`news_agents.py`) and ticker mapping (`asset_mapper.py`) tasks.
4. **NEW**: `services/apify_service.py` provides real-time Google News scraping via Apify integration.
5. Models in `backend/models/` define the payloads sent to the frontend, keeping the SPA strongly typed.

## Features
- **Real-time Polymarket Data**: Live polling of prediction markets with volume spike detection
- **News Integration**: Apify-powered Google News scraping for event context
- **Frontend Dashboard**: Next.js app with event grid, detail views, and news panels
- **API Endpoints**: RESTful API for events, news scraping, and event analysis

## Quick Start

### Backend
```bash
cd backend
pip install -r requirements.txt
echo "APIFY_TOKEN=your_token_here" > .env
uvicorn app:app --reload --port 8000
```

### Frontend
```bash
cd frontend
npm install
npm run dev
```

## API Endpoints
- `GET /api/events` - Get frontier events
- `GET /api/news/scrape?query=Tesla` - Scrape news for any topic
- `GET /api/events/{id}/detail` - Get event analysis with news
