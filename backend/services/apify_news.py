"""Apify news scraping service for Google News integration."""

import os
import time
import random
import json
from urllib.parse import urlencode
from typing import Dict, List, Optional, Any
import requests
import logging

logger = logging.getLogger(__name__)

APIFY_BASE_URL = "https://api.apify.com/v2"
DEFAULT_ACTOR_ID = "lhotanova~google-news-scraper"


class ApifyNewsService:
    """Service for scraping news using Apify Google News scraper."""
    
    def __init__(self):
        self._token = None
    
    @property
    def token(self) -> str:
        """Get Apify token, loading it lazily."""
        if self._token is None:
            self._token = self._get_apify_token()
        return self._token
    
    def _get_apify_token(self) -> str:
        """Get Apify token from environment variables."""
        token = os.getenv('APIFY_TOKEN')
        if not token:
            raise ValueError("Missing APIFY_TOKEN environment variable")
        return token
    
    def start_actor_run(self, actor_id: str, run_input: Dict[str, Any]) -> Dict[str, Any]:
        """Start an Apify actor run."""
        url = f"{APIFY_BASE_URL}/acts/{actor_id}/runs?token={self.token}"
        response = requests.post(
            url,
            headers={'Content-Type': 'application/json'},
            json=run_input if run_input else {}
        )
        if not response.ok:
            raise Exception(f"Failed to start run ({response.status_code}): {response.text}")
        return response.json()['data']  # run object
    
    def get_run(self, run_id: str) -> Dict[str, Any]:
        """Get the status of an Apify actor run."""
        url = f"{APIFY_BASE_URL}/actor-runs/{run_id}?token={self.token}"
        response = requests.get(url)
        if not response.ok:
            raise Exception(f"Failed to get run ({response.status_code}): {response.text}")
        return response.json()['data']  # run object
    
    def wait_for_run_to_finish(
        self, 
        run_id: str, 
        options: Optional[Dict[str, Any]] = None
    ) -> Dict[str, Any]:
        """Wait for an Apify actor run to finish."""
        if options is None:
            options = {}
        
        delay_ms = options.get('initialDelayMs', 1000)
        max_delay_ms = options.get('maxDelayMs', 20000)
        timeout_ms = options.get('timeoutMs', 420000)  # 7 minutes
        start_ts = time.time() * 1000
        
        while True:
            run = self.get_run(run_id)
            if run['status'] in ['SUCCEEDED', 'FAILED', 'ABORTED', 'TIMED-OUT']:
                return run
            
            if (time.time() * 1000) - start_ts > timeout_ms:
                raise Exception(f"Run {run_id} did not finish within {timeout_ms}ms (last status: {run['status']})")
            
            jitter = random.randint(0, delay_ms)
            time.sleep(jitter / 1000.0)
            delay_ms = min(delay_ms * 2, max_delay_ms)
    
    def fetch_dataset_items(
        self, 
        dataset_id: str, 
        query: Optional[Dict[str, Any]] = None
    ) -> List[Dict[str, Any]]:
        """Fetch items from an Apify dataset."""
        if query is None:
            query = {}
        
        params = {'token': self.token}
        if 'limit' in query:
            params['limit'] = str(query['limit'])
        if 'offset' in query:
            params['offset'] = str(query['offset'])
        if 'clean' in query:
            params['clean'] = 'true' if query['clean'] else 'false'
        
        url = f"{APIFY_BASE_URL}/datasets/{dataset_id}/items?{urlencode(params)}"
        response = requests.get(url, headers={'Accept': 'application/json'})
        if not response.ok:
            raise Exception(f"Failed to fetch dataset items ({response.status_code}): {response.text}")
        return response.json()  # array of items
    
    async def scrape_news(
        self, 
        query: str = "Tesla",
        max_items: int = 10,
        language: str = "US:en",
        time_range: str = "1h",
        fetch_details: bool = True,
        actor_id: Optional[str] = None
    ) -> Dict[str, Any]:
        """
        Scrape news using Apify Google News scraper.
        
        Args:
            query: Search query for news
            max_items: Maximum number of news items to fetch
            language: Language and region (e.g., "US:en")
            time_range: Time range for news (e.g., "1h", "1d", "1w")
            fetch_details: Whether to fetch full article details
            actor_id: Custom actor ID (uses default if None)
        
        Returns:
            Dictionary with run results and news items
        """
        if actor_id is None:
            actor_id = DEFAULT_ACTOR_ID
        
        run_input = {
            "query": query,
            "topics": [],
            "topicsHashed": [],
            "language": language,
            "maxItems": max_items,
            "openEndedDateRange": time_range,
            "fetchArticleDetails": fetch_details,
            "proxyConfiguration": {"useApifyProxy": True}
        }
        
        logger.info(f"Starting Apify news scrape for query: {query}")
        
        # Start the run
        run = self.start_actor_run(actor_id, run_input)
        run_id = run['id']
        
        logger.info(f"Apify run started with ID: {run_id}")
        
        # Wait for completion
        finished_run = self.wait_for_run_to_finish(run_id)
        
        if finished_run['status'] != 'SUCCEEDED':
            logger.error(f"Apify run failed with status: {finished_run['status']}")
            return {
                'status': finished_run['status'],
                'message': finished_run.get('statusMessage', 'Actor did not succeed'),
                'runId': finished_run['id'],
                'items': []
            }
        
        # Fetch the results
        items = self.fetch_dataset_items(finished_run['defaultDatasetId'], {
            'limit': max_items,
            'clean': True
        })
        
        logger.info(f"Apify run completed successfully, fetched {len(items)} items")
        
        return {
            'runId': finished_run['id'],
            'status': finished_run['status'],
            'itemCount': len(items) if isinstance(items, list) else 0,
            'items': items
        }


# Global service instance
apify_news_service = ApifyNewsService()
