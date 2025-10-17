from __future__ import annotations

from datetime import datetime, timezone
from typing import Any, Dict, List, Optional
import re
from urllib.parse import urlparse

from exa_py import Exa

from ..config import settings
from ..models import NewsItem, NewsToolInput, NewsToolOutput


class ExaTool:
    name = "exa"

    def _get_client(self) -> Exa:
        api_key = settings.__dict__.get("EXA_KEY") or None  # not set in Settings; read from env via Exa SDK
        # Exa SDK reads EXA_API_KEY or uses explicit key; rely on env EXA_KEY
        # The SDK expects api_key argument to be named 'api_key'
        return Exa(api_key=(api_key or None))

    def _build_query(self, tool_input: NewsToolInput) -> str:
        if tool_input.event.category and tool_input.event.category.lower() == "politics":
            base_terms = ["election", "poll", "ballot", "campaign", "debate", "turnout"]
        else:
            base_terms = ["breaking", "analysis", "market", "impact", "update"]
        sites = [
            "site:reuters.com",
            "site:bloomberg.com",
            "site:wsj.com",
            "site:ft.com",
            "site:cnbc.com",
        ]
        hint = tool_input.event.title
        return f"(\"{hint}\" OR {tool_input.query}) (" + " OR ".join(base_terms) + ") (" + " OR ".join(sites) + ")"

    def _parse_dt(self, value: Optional[str]) -> Optional[datetime]:
        if not value:
            return None
        try:
            return datetime.fromisoformat(value.replace("Z", "+00:00"))
        except Exception:
            return None

    def _domain_from_url(self, url: Optional[str]) -> Optional[str]:
        if not url:
            return None
        try:
            netloc = urlparse(url).netloc
            return netloc.replace("www.", "") if netloc else None
        except Exception:
            return None

    def _clean_text(self, text: Optional[str], max_chars: int = 420) -> Optional[str]:
        if not text:
            return None
        t = text
        # Remove HTML tags
        t = re.sub(r"<[^>]+>", " ", t)
        # Convert markdown links [text](url) to text
        t = re.sub(r"\[([^\]]+)\]\([^\)]+\)", r"\1", t)
        # Remove markdown headers like ## or ###
        t = re.sub(r"\s*#{1,6}\s*", " ", t)
        # Remove javascript:void(0) and similar artifacts
        t = t.replace("javascript:void(0)", "")
        # Drop common boilerplate phrases
        boilerplate = [
            "Skip to main content",
            "Accept All Cookies",
            "Cookie Policy",
            "Subscribe",
            "Sign up",
            "Read Next",
            "Recommended Videos",
            "Trending",
            "Advertisement",
            "Share SaveComment",
        ]
        for b in boilerplate:
            t = t.replace(b, " ")
        # Collapse whitespace
        t = re.sub(r"\s+", " ", t).strip()
        # Prefer first 1-3 sentences up to max_chars
        sentences = re.split(r"(?<=[\.\?!])\s+", t)
        acc = []
        total = 0
        for s in sentences:
            if not s:
                continue
            if total + len(s) + (1 if acc else 0) > max_chars:
                break
            acc.append(s)
            total += len(s) + (1 if acc else 0)
            if len(acc) >= 3:
                break
        if acc:
            t = " ".join(acc)
        # Final guard: hard truncate if still too long
        if len(t) > max_chars:
            t = t[: max_chars].rsplit(" ", 1)[0] + "…"
        return t

    def run(self, tool_input: NewsToolInput) -> NewsToolOutput:
        # Ensure EXA_KEY set; fallback to stub if allowed
        import os

        exa_key = os.environ.get("EXA_KEY") or os.environ.get("EXA_API_KEY")
        if not exa_key:
            return self._stub(tool_input, diagnostics={"reason": "missing_exa_key"})

        try:
            exa = Exa(api_key=exa_key)
            query = tool_input.query or tool_input.event.title
            # Build a richer query but prioritize provided query
            final_query = query if tool_input.query else self._build_query(tool_input)
            result = exa.search_and_contents(final_query, text=True, type="auto")

            raw_items: List[Dict[str, Any]] = []
            # The SDK may return an object with .results or a dict with 'results'
            if hasattr(result, "results") and isinstance(result.results, list):
                raw_items = result.results
            elif isinstance(result, dict) and isinstance(result.get("results"), list):
                raw_items = result.get("results")
            else:
                # Try list directly
                if isinstance(result, list):
                    raw_items = result

            items: List[NewsItem] = []
            for idx, r in enumerate(raw_items[: tool_input.max_items]):
                # Exa result fields: title, url, text, published_date (varies)
                title = getattr(r, "title", None) or (r.get("title") if isinstance(r, dict) else None) or "Untitled"
                url = getattr(r, "url", None) or (r.get("url") if isinstance(r, dict) else None) or "https://example.com"
                text = getattr(r, "text", None) or (r.get("text") if isinstance(r, dict) else None)
                published = getattr(r, "published_date", None) or (r.get("published_date") if isinstance(r, dict) else None)
                clean_summary = self._clean_text(text)
                source = self._domain_from_url(url) or "exa"
                items.append(
                    NewsItem(
                        id=f"exa_{idx}",
                        source=source,
                        title=title,
                        summary=clean_summary,
                        url=url,
                        published_at=self._parse_dt(published) if isinstance(published, str) else None,
                        raw=r if isinstance(r, dict) else None,
                    )
                )

            return NewsToolOutput(items=items, tool_name=self.name, diagnostics={"query": final_query, "count": len(items)})
        except Exception as e:
            return self._stub(tool_input, diagnostics={"error": str(e)})

    def _stub(self, tool_input: NewsToolInput, diagnostics: Dict[str, Any]) -> NewsToolOutput:
        from datetime import datetime, timezone
        items: List[NewsItem] = []
        if settings.ALLOW_STUB_RESULTS:
            now = datetime.now(timezone.utc)
            base = "https://news.example"
            for i in range(min(tool_input.max_items, 6)):
                items.append(
                    NewsItem(
                        id=f"exa_stub_{i}",
                        source="exa-stub",
                        title=f"{tool_input.event.title}: related update {i+1}",
                        summary=f"Stubbed summary for query '{tool_input.query}'.",
                        url=f"{base}/{i+1}",
                        published_at=now,
                        raw={"stub": True},
                    )
                )
        if not items and not settings.ALLOW_STUB_RESULTS:
            raise RuntimeError(f"Exa call failed and stubs disabled. Diagnostics: {diagnostics}")
        diagnostics.update({"note": "exa stub"})
        return NewsToolOutput(items=items, tool_name=self.name, diagnostics=diagnostics)
