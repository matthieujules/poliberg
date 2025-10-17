# Backend

Single-process hackathon backend with clearly separated modules:

- `app.py` – server bootstrap (FastAPI/Express entrypoint).
- `routes.py` – HTTP/WebSocket routes exposing frontier feed, lock controls, and event open triggers.
- `services/ingestion.py` – async loop polling prediction markets and refreshing the frontier queue.
- `services/orchestrator.py` – handles event selections, fans out news searches and asset mapping requests.
- `services/news_agents.py` – thin wrappers around Twitter/news APIs for single-shot querying.
- `services/asset_mapper.py` – GPT-4o prompt/response logic returning JSON ticker suggestions.
- `models/` – shared data schemas for events, news snippets, and tickers.
- `utils/` – helpers for entity extraction, scoring, caching, and scheduling.
