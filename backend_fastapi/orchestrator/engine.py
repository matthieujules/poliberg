from __future__ import annotations

import json
import uuid
from typing import Dict, List, Optional, Tuple

from ..config import settings
from ..models import (
    ArticleResult,
    NewsToolInput,
    OrchestrateRequest,
    OrchestrateResponse,
)
from ..services.openrouter import OpenRouterClient
from ..tools.apify import ApifyTool
from ..tools.internal import InternalNewsTool
from ..tools.exa import ExaTool


def _safe_json_object(text: str) -> Dict:
    try:
        return json.loads(text)
    except Exception:
        return {}


def _choose_tool_locally(req: OrchestrateRequest) -> Tuple[str, str, int]:
    # Fallback selection logic if OpenRouter isn't available
    query = req.news_query or f"Latest news related to {req.event.title}"
    # Prefer EXA when key present, else apify if token present, else internal
    import os
    if req.preferred_tool:
        tool = req.preferred_tool
    else:
        tool = "exa" if (os.getenv("EXA_KEY") or os.getenv("EXA_API_KEY")) else ("apify" if os.getenv("APIFY_TOKEN") else "internal")
    return tool, query, min(max(req.max_items, 1), settings.ORCH_MAX_ITEMS)


async def plan_with_openrouter(req: OrchestrateRequest) -> Tuple[str, str, int, Dict]:
    client = OpenRouterClient()
    system = (
        "You are an orchestrator that selects the best news tool and constructs a precise query.\n"
        "Available tools: 'exa' (Exa web search API), 'apify' (Apify actors), 'internal' (in-house feeds).\n"
        "Output ONLY a compact JSON object with fields: tool ('exa'|'apify'|'internal'), query (string), max_items (int<=6)."
    )
    user = (
        f"Event: {req.event.title}.\n"
        f"Category: {req.event.category or 'n/a'}.\n"
        f"Hint query: {req.news_query or 'none'}.\n"
        f"Preferred tool: {req.preferred_tool or 'none'}.\n"
        f"Return at most {min(req.max_items, settings.ORCH_MAX_ITEMS)} results."
    )
    messages = [
        {"role": "system", "content": system},
        {"role": "user", "content": user},
    ]
    data = await client.chat(messages, temperature=0.1)
    content = (
        data.get("choices", [{}])[0]
        .get("message", {})
        .get("content", "{}")
    )
    plan = _safe_json_object(content)
    tool = plan.get("tool") or req.preferred_tool or "exa"
    query = plan.get("query") or req.news_query or f"Latest news related to {req.event.title}"
    max_items = int(plan.get("max_items") or settings.ORCH_MAX_ITEMS)
    max_items = min(max_items, settings.ORCH_MAX_ITEMS)
    return tool, query, max_items, {"openrouter_raw": data, "plan": plan}


def run_tool(tool_name: str, query: str, req: OrchestrateRequest, max_items: int):
    input_payload = NewsToolInput(query=query, event=req.event, max_items=max_items)
    if tool_name == "apify":
        return ApifyTool().run(input_payload)
    if tool_name == "exa":
        return ExaTool().run(input_payload)
    return InternalNewsTool().run(input_payload)


async def orchestrate(req: OrchestrateRequest) -> OrchestrateResponse:
    # Plan with OpenRouter if key is set; else fallback to local selection
    plan_meta: Dict = {}
    # If caller specifies a tool, respect it and skip planning
    if req.preferred_tool:
        tool_name, query, max_items = _choose_tool_locally(req)
    elif settings.OPENROUTER_KEY:
        try:
            tool_name, query, max_items, plan_meta = await plan_with_openrouter(req)
        except Exception:
            tool_name, query, max_items = _choose_tool_locally(req)
    else:
        tool_name, query, max_items = _choose_tool_locally(req)

    tool_output = run_tool(tool_name, query, req, max_items)

    # Transform to article payload (take up to max_items)
    articles: List[ArticleResult] = [
        ArticleResult(title=i.title, url=i.url, source=i.source, published_at=i.published_at, summary=i.summary)
        for i in tool_output.items[:max_items]
    ]

    run_id = f"run_{uuid.uuid4().hex[:12]}"
    return OrchestrateResponse(
        run_id=run_id,
        event_id=req.event.id,
        tool_used=tool_output.tool_name,
        news_count=len(articles),
        articles=articles,
        next_actions=["render_graphs"],
        diagnostics={"plan": plan_meta.get("plan") if isinstance(plan_meta, dict) else None, "tool": tool_output.diagnostics},
    )
