# Orchestrator Backend Plan

## Overview
- Objective: Provide a FastAPI endpoint that routes requests to a LangGraph-based orchestrator agent. The orchestrator chooses how to fetch relevant news (via Apify or an internal tool), enriches the given Polymarket event context, infers impacted markets, and returns structured results for graph generation.
- Scope (initial): Define architecture, contracts, graph topology, data models, and testing strategy. Stub out templates for tools and flow. Do not implement Apify; treat it as a pluggable I/O.

## Goals
- Simple, reliable `POST /orchestrate` endpoint that kicks off the orchestration for a given event and optional news query hints.
- Deterministic, inspectable flow using LangGraph with clear state transitions and tool boundaries.
- Pluggable news-acquisition tools (Apify or internal) via a shared interface.
- Output designed to drive “market impact” selection and downstream graph generation.

## High-Level Architecture
- FastAPI app exposes:
  - `POST /orchestrate` — runs the orchestrator over a provided Polymarket event and optional filters.
  - `GET /health` — simple health check.
- Orchestrator built with LangGraph:
  - Nodes: Validate Input → Tool Select → Fetch News → Aggregate/Score → Market Inference → Output.
  - Edges determined by simple policies (e.g., if Apify hint present, choose Apify; else fallback to internal tool; add later: LLM-based tool chooser).
- Tools abstraction:
  - `NewsSourceTool` interface with `run(input: NewsToolInput) -> NewsToolOutput`.
  - Implementations: `ApifyTool` (placeholder), `InternalNewsTool` (placeholder).
- Storage/Cache (later): optional short-lived cache for fetched news by query/event id; simple in-memory first, Redis later.
- Observability: attach run IDs, request IDs; emit structured logs; LangGraph tracing (e.g., LangSmith) optional.

## Data Contracts (Pydantic)
- Polymarket event (input):
  - `id: str`
  - `title: str` (e.g., "New York Elections")
  - `description: str | None`
  - `category: str | None`
  - `start_time: datetime | None`, `end_time: datetime | None`
  - `metadata: dict[str, Any] | None` (raw extra data from Polymarket)
- Orchestrate request:
  - `event: PolymarketEvent`
  - `news_query: str | None` (freeform hint)
  - `preferred_tool: Literal["apify","internal"] | None`
  - `max_items: int = 25`
- News item:
  - `id: str`, `source: str`, `title: str`, `summary: str | None`, `url: HttpUrl`, `published_at: datetime | None`, `raw: dict[str, Any] | None`
- Tool I/O:
  - `NewsToolInput = { query: str, event: PolymarketEvent, max_items: int }`
  - `NewsToolOutput = { items: list[NewsItem], tool_name: str, diagnostics: dict[str, Any] | None }`
- Market impact candidate:
  - `market_id: str | None` (if known) or `name: str`
  - `impact_score: float` (0–1)
  - `rationale: str`
  - `evidence: list[str]` (URLs or item IDs)
- Orchestrate response:
  - `run_id: str`
  - `event_id: str`
  - `tool_used: str`
  - `news_count: int`
  - `candidates: list[MarketImpactCandidate]`
  - `next_actions: list[str]` (e.g., "render_graphs", "fetch_prices")

## Endpoint Contract (initial)
- POST `/orchestrate`
  - Request (example):
    ```json
    {
      "event": {
        "id": "evt_ny_2025",
        "title": "New York Elections",
        "description": "State and local races",
        "category": "politics"
      },
      "news_query": "New York election polling",
      "preferred_tool": "apify",
      "max_items": 15
    }
    ```
  - Response (example, abbreviated):
    ```json
    {
      "run_id": "run_01HZX...",
      "event_id": "evt_ny_2025",
      "tool_used": "apify",
      "news_count": 12,
      "candidates": [
        {
          "name": "Turnout above 50% statewide",
          "impact_score": 0.78,
          "rationale": "Recent polling + court ruling likely to increase turnout",
          "evidence": ["https://news.example/1", "news_item:abc123"]
        }
      ],
      "next_actions": ["render_graphs"]
    }
    ```

## LangGraph Topology (v0)
- State: `GraphState = { event, news_query, preferred_tool, max_items, tool_output, candidates, logs }`
- Nodes:
  - `validate_input(state) -> state`
  - `select_tool(state) -> state` (sets `state.tool = apify|internal`)
  - `fetch_news(state) -> state` (calls selected tool with `NewsToolInput`)
  - `aggregate_and_score(state) -> state` (dedupe, basic keyword scoring vs. event title/category; placeholder)
  - `infer_markets(state) -> state` (maps news signals to market candidates; placeholder rules)
  - `finalize_output(state) -> OrchestrateResponse`
- Edges (linear for v0): `validate → select → fetch → aggregate → infer → finalize`
- Future edge variants: retry on tool failure, confidence-based branching, multi-tool merge.

### Pseudo-code (v0)
```python
from langgraph.graph import StateGraph

def build_graph():
    g = StateGraph(GraphState)
    g.add_node("validate_input", validate_input)
    g.add_node("select_tool", select_tool)
    g.add_node("fetch_news", fetch_news)
    g.add_node("aggregate_and_score", aggregate_and_score)
    g.add_node("infer_markets", infer_markets)
    g.add_node("finalize_output", finalize_output)

    g.add_edge("validate_input", "select_tool")
    g.add_edge("select_tool", "fetch_news")
    g.add_edge("fetch_news", "aggregate_and_score")
    g.add_edge("aggregate_and_score", "infer_markets")
    g.add_edge("infer_markets", "finalize_output")

    g.set_entry_point("validate_input")
    g.set_finish_point("finalize_output")
    return g.compile()
```

## File Layout (proposed)
- `backend_fastapi/`
  - `main.py` (FastAPI app, routers include)
  - `routers/orchestrate.py` (POST `/orchestrate`)
  - `orchestrator/graph.py` (LangGraph builder + nodes)
  - `models.py` (Pydantic models for contracts)
  - `tools/base.py` (`NewsSourceTool`, I/O types)
  - `tools/apify.py` (placeholder implementation)
  - `tools/internal.py` (placeholder implementation)
  - `services/scoring.py` (basic heuristics for aggregation/scoring)
  - `services/market_inference.py` (map signals → candidate markets; stubs)
  - `config.py` (env parsing; timeouts; feature flags)
  - `tests/` (unit + integration with a dummy tool)

## Placeholders / Templates
- Tool interface (Python):
  ```python
  class NewsSourceTool(Protocol):
      name: str
      def run(self, input: NewsToolInput) -> NewsToolOutput: ...
  ```
- Apify tool stub:
  ```python
  class ApifyTool(NewsSourceTool):
      name = "apify"
      def run(self, input):
          # TODO: integrate Apify actor/run once available
          return NewsToolOutput(items=[], tool_name=self.name, diagnostics={"note": "stub"})
  ```
- Internal tool stub is analogous; returns empty `items` for now.

## Market Inference (initial heuristics)
- Keyword/topic matching between event title/category and news titles/summaries to produce candidate market statements.
- Simple scoring: tf-idf-like weighting on event keywords; recency boost; source credibility multiplier (static table for v0).
- Output `candidates` with a rationale and supporting evidence links/IDs.
- Later: LLM-assisted hypothesis generation and validation against known market catalogs.

## Graphs Generation (downstream)
- Out of scope to implement here, but the orchestrator response should include:
  - Normalized candidate list with `impact_score` and evidence.
  - `next_actions` suggesting the frontend/another service to render time series, comparatives, or network graphs.

## Configuration
- Env vars (future; not required to run stubs):
  - `APIFY_TOKEN` (for Apify integration)
  - `NEWS_TOOL_BASE_URL` (if internal tool is HTTP-based)
  - `OPENAI_API_KEY` (if LLM-based selection/scoring added)
  - `ORCH_TIMEOUT_MS` (global orchestration timeout)

## Testing Strategy
- Unit tests:
  - Model validation for contracts
  - Tool selection logic given different `preferred_tool`/`news_query`
  - Aggregation/scoring on synthetic news items
  - Market inference mapping from signals → candidates
- Integration tests:
  - FastAPI test client calling `/orchestrate` with a dummy tool
  - Golden responses for specific events (e.g., "New York Elections") with fixed inputs
- Property tests (optional): ensure stable output bounds for score ranges and item limits.

## Example Flow ("New York Elections")
1. Client posts event + `news_query: "New York election polling"`, `preferred_tool: "apify"`.
2. Orchestrator selects Apify and fetches up to `max_items` news.
3. Aggregation dedupes sources, boosts items with polling/court terms.
4. Inference proposes markets like "Turnout above X%", "Party Y wins district Z", each with `impact_score` and evidence URLs.
5. Response lists candidates and `next_actions: ["render_graphs"]`.

## Roadmap
- v0: Endpoint + graph skeleton + dummy tools + basic heuristics.
- v1: Real Apify integration; caching; configurable policies.
- v2: LLM-based tool selection and inference; observability and tracing; multi-tool merge.
- v3: Feedback loop from realized market movements to refine scoring.

