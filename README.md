# Frontier Markets Dashboard

Hackathon scaffold for a prediction-market monitoring dashboard blending frontier event detection, multi-source news surfacing, and related asset mapping.

## Project Layout
- `frontend/` – React/Vite SPA showing live frontier ticker grid, event detail panel, and news/ticker results.
- `backend/` – Single FastAPI/Express-style app with modules for ingestion polling, orchestrator fan-out, and API routes.
- `infrastructure/` – Local configs and deployment helpers (docker-compose, environment templates).
- `scripts/` – Dev utilities (data seeding, mock responders, combined startup).
- `docs/` – Architecture notes and quick runbooks.

## Backend Flow Overview
1. `services/ingestion.py` polls Polymarket, scores swing velocity, and updates the in-memory frontier list.
2. `routes.py` exposes `GET /frontier` for initial load and a WebSocket for push updates; it also handles lock/unlock actions.
3. When the UI posts to `/events/{id}/open`, `services/orchestrator.py` concurrently kicks off news (`news_agents.py`) and ticker mapping (`asset_mapper.py`) tasks and streams results back.
4. Models in `backend/models/` define the payloads sent to the frontend, keeping the SPA strongly typed.

## Next Steps
1. Implement ingestion prototype with mocked Polymarket responses.
2. Stub orchestrator fan-out with hardcoded news/ticker results to validate end-to-end UI flow.
3. Connect the frontend to WebSocket/REST endpoints and iterate on the dashboard layout locally.
