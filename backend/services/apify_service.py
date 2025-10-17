"""Apify service for news scraping using Google News scraper actor."""

import asyncio
import json
import os
from typing import Dict, List, Optional, Any
import httpx
import logging

logger = logging.getLogger(__name__)


class ApifyService:
    """Service for interacting with Apify actors, specifically Google News scraper."""
    
    APIFY_BASE_URL = "https://api.apify.com/v2"
    DEFAULT_ACTOR_ID = "lhotanova~google-news-scraper"
    
    def __init__(self):
        self.client = httpx.AsyncClient(timeout=60.0)
        self.token = self._get_apify_token()
    
    def _get_apify_token(self) -> str:
        """Get Apify token from environment variables."""
        token = os.getenv("APIFY_TOKEN")
        if not token:
            logger.warning("Missing APIFY_TOKEN environment variable - Apify features will be disabled")
            return "missing_token"
        return token
    
    async def start_actor_run(
        self, 
        actor_id: str, 
        run_input: Dict[str, Any]
    ) -> Dict[str, Any]:
        """
        Start an Apify actor run.
        
        Args:
            actor_id: The actor ID to run
            run_input: Input parameters for the actor
            
        Returns:
            Run object with run ID and status
        """
        url = f"{self.APIFY_BASE_URL}/acts/{actor_id}/runs?token={self.token}"
        
        try:
            response = await self.client.post(
                url,
                headers={"Content-Type": "application/json"},
                json=run_input
            )
            response.raise_for_status()
            data = response.json()
            return data["data"]  # Return the run object
        except httpx.HTTPError as e:
            logger.error(f"Failed to start Apify run: {e}")
            raise Exception(f"Failed to start run ({response.status_code}): {e}")
    
    async def get_run(self, run_id: str) -> Dict[str, Any]:
        """
        Get the status of an Apify run.
        
        Args:
            run_id: The run ID to check
            
        Returns:
            Run object with current status
        """
        url = f"{self.APIFY_BASE_URL}/actor-runs/{run_id}?token={self.token}"
        
        try:
            response = await self.client.get(url)
            response.raise_for_status()
            data = response.json()
            return data["data"]  # Return the run object
        except httpx.HTTPError as e:
            logger.error(f"Failed to get Apify run {run_id}: {e}")
            raise Exception(f"Failed to get run ({response.status_code}): {e}")
    
    async def wait_for_run_to_finish(
        self, 
        run_id: str, 
        options: Optional[Dict[str, Any]] = None
    ) -> Dict[str, Any]:
        """
        Wait for an Apify run to finish with exponential backoff.
        
        Args:
            run_id: The run ID to wait for
            options: Configuration options for waiting
            
        Returns:
            Final run object with completion status
        """
        if options is None:
            options = {}
            
        delay_ms = options.get("initialDelayMs", 1000)
        max_delay_ms = options.get("maxDelayMs", 20000)
        timeout_ms = options.get("timeoutMs", 420000)  # 7 minutes
        start_ts = asyncio.get_event_loop().time() * 1000
        
        while True:
            run = await self.get_run(run_id)
            
            if run["status"] in ["SUCCEEDED", "FAILED", "ABORTED", "TIMED-OUT"]:
                return run
            
            if (asyncio.get_event_loop().time() * 1000) - start_ts > timeout_ms:
                raise Exception(
                    f"Run {run_id} did not finish within {timeout_ms}ms "
                    f"(last status: {run['status']})"
                )
            
            # Exponential backoff with jitter
            jitter = delay_ms * 0.1 * (0.5 - asyncio.get_event_loop().time() % 1)
            await asyncio.sleep((delay_ms + jitter) / 1000)
            delay_ms = min(delay_ms * 2, max_delay_ms)
    
    async def fetch_dataset_items(
        self, 
        dataset_id: str, 
        query: Optional[Dict[str, Any]] = None
    ) -> List[Dict[str, Any]]:
        """
        Fetch items from an Apify dataset.
        
        Args:
            dataset_id: The dataset ID to fetch from
            query: Query parameters (limit, offset, clean, etc.)
            
        Returns:
            List of dataset items
        """
        if query is None:
            query = {}
            
        params = {"token": self.token}
        if query.get("limit"):
            params["limit"] = str(query["limit"])
        if query.get("offset"):
            params["offset"] = str(query["offset"])
        if query.get("clean"):
            params["clean"] = str(query["clean"])
        
        url = f"{self.APIFY_BASE_URL}/datasets/{dataset_id}/items"
        
        try:
            response = await self.client.get(
                url,
                params=params,
                headers={"Accept": "application/json"}
            )
            response.raise_for_status()
            return response.json()
        except httpx.HTTPError as e:
            logger.error(f"Failed to fetch dataset items: {e}")
            raise Exception(f"Failed to fetch dataset items ({response.status_code}): {e}")
    
    async def scrape_google_news(
        self, 
        query: str,
        max_items: int = 10,
        language: str = "US:en",
        time_range: str = "1h",
        fetch_article_details: bool = True
    ) -> List[Dict[str, Any]]:
        """
        Scrape Google News using Apify's Google News scraper.
        
        Args:
            query: Search query for news
            max_items: Maximum number of articles to fetch
            language: Language and region (e.g., "US:en")
            time_range: Time range for articles (e.g., "1h", "1d", "1w")
            fetch_article_details: Whether to fetch full article content
            
        Returns:
            List of news articles
        """
        if self.token == "missing_token":
            logger.error("Cannot scrape news: APIFY_TOKEN is not configured")
            raise ValueError("APIFY_TOKEN environment variable is required for news scraping")
        run_input = {
            "query": query,
            "topics": [],
            "topicsHashed": [],
            "language": language,
            "maxItems": max_items,
            "openEndedDateRange": time_range,
            "fetchArticleDetails": fetch_article_details,
            "proxyConfiguration": {"useApifyProxy": True}
        }
        
        try:
            # Start the actor run
            run = await self.start_actor_run(self.DEFAULT_ACTOR_ID, run_input)
            logger.info(f"Started Apify run {run['id']} for query: {query}")
            
            # Wait for completion
            finished_run = await self.wait_for_run_to_finish(run["id"])
            
            if finished_run["status"] != "SUCCEEDED":
                raise Exception(
                    f"Actor did not succeed. Status: {finished_run['status']}, "
                    f"Message: {finished_run.get('statusMessage', 'No message')}"
                )
            
            # Fetch the results
            items = await self.fetch_dataset_items(
                finished_run["defaultDatasetId"],
                {"limit": max_items, "clean": True}
            )
            
            logger.info(f"Successfully scraped {len(items)} news articles for query: {query}")
            return items
            
        except Exception as e:
            logger.error(f"Failed to scrape Google News for query '{query}': {e}")
            raise
    
    async def close(self):
        """Close the HTTP client."""
        await self.client.aclose()


# Global instance
apify_service = ApifyService()