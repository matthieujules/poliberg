# Poliberg

Dashboard SPA (Next.js) rendering a frontier feed, event detail, news and assets panels.

This repo contains the frontend. A lightweight mock backend is provided under `backend/` so you can run the app end‑to‑end locally. The frontend will call `NEXT_PUBLIC_API_URL` (defaults to `http://localhost:8000`). A separate orchestrator service (FastAPI) lives under `backend_fastapi/` and the frontend calls it via `NEXT_PUBLIC_ORCHESTRATOR_URL` (defaults to `http://localhost:8001`).

## Prerequisites

- Node.js 18+ (recommend 20 LTS)
- npm 9+

## Run the backend (mock)

The mock backend implements the endpoints the UI expects:

- `GET /health`
- `GET /api/events?limit=&spike_only=`
- `GET /api/events/:id`
- `POST /api/events/:id/lock`
- `GET /api/events/spikes/summary`
- `POST /api/refresh`

Steps:

1) In a new terminal:

```
cd backend
npm install
npm run dev
```

This starts http://localhost:8000.

## Run the frontend

1) In another terminal at the repo root:

```
npm install
npm run dev
```

This starts the Next.js dev server on http://localhost:3000.

By default the frontend points to `http://localhost:8000`. To override, create a `.env.local` at the repo root:

```
NEXT_PUBLIC_API_URL=http://localhost:8000
# Orchestrator (news) backend
NEXT_PUBLIC_ORCHESTRATOR_URL=http://localhost:8001
# Optional: to enable real Finnhub stock data
# NEXT_PUBLIC_FINNHUB_API_KEY=your_finnhub_api_key
```

## Notes

- The stock panel uses Finnhub if `NEXT_PUBLIC_FINNHUB_API_KEY` is set; otherwise it falls back to mock data.
- If you have a real backend service, set `NEXT_PUBLIC_API_URL` to its base URL and skip the mock backend.
- To enable real news orchestration, run the FastAPI service in `backend_fastapi/` and set `NEXT_PUBLIC_ORCHESTRATOR_URL` accordingly.
