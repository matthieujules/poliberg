# Poliberg Orchestrator FastAPI

FastAPI service exposing an orchestrated endpoint to fetch 6 recent news articles relevant to a given Polymarket event. Planning is delegated to OpenRouter (GPT‑4 class model) which selects a news tool (Apify or internal). Tools are currently stubbed.

## Endpoints
- `GET /health` — health check
- `POST /orchestrate` — body includes event, optional news query and preferred tool; returns up to 6 articles.

## Quick start
1. Create and activate a Python environment (3.10+).
2. Install dependencies:
   ```bash
   pip install -r backend_fastapi/requirements.txt
   ```
3. Export your OpenRouter key (optional for planning; stubs still work):
   ```bash
   export OPENROUTER_KEY=sk-or-...
   # optional tuning
   export OPENROUTER_MODEL=openai/gpt-4o-mini
   ```
4. Run the API:
   ```bash
   uvicorn backend_fastapi.main:app --host 0.0.0.0 --port 8001 --reload
   ```

## Example request
```bash
curl -s localhost:8001/orchestrate \
  -H 'content-type: application/json' \
  -d '{
    "event": {"id":"evt_ny_2025","title":"New York Elections","category":"politics"},
    "news_query": "New York election polling",
    "preferred_tool": "apify",
    "max_items": 6
  }' | jq .
```

## Notes
- Tools (`ApifyTool`, `InternalNewsTool`) are stubbed; set `ALLOW_STUB_RESULTS=false` to disable stub results.
- If `OPENROUTER_KEY` is not set, a local fallback selects the tool and query.
- Default port is `8001` to avoid collision with the existing mock Node backend on `8000`.
- To enable real Apify fetching, set in `.env`:
  - `APIFY_TOKEN`
- Preferred news tool: Exa. Set `EXA_KEY` to enable direct Exa search for relevant news. If `EXA_KEY` is missing, the service falls back to Apify (if configured) or to stub data.
- To enable Exa, set in `.env`:
  - `EXA_KEY`
  - Optional: keep `OPENROUTER_KEY` if you want LLM planning for queries.
- Apify remains available as a fallback. If used, defaults to actor `lhotanova~google-news-scraper` and requires `APIFY_TOKEN`.
