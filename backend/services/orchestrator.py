"""Event click orchestrator launching news and asset agents in parallel."""

import logging
from typing import Dict, List, Any
from datetime import datetime

from models import PolymarketEvent
from services.news_agents import news_agent_service

logger = logging.getLogger(__name__)


class OrchestratorService:
    """Service for orchestrating event detail analysis."""
    
    def __init__(self):
        self.news_service = news_agent_service
    
    async def orchestrate_event_detail(
        self, 
        event: PolymarketEvent,
        include_news: bool = True,
        news_max_items: int = 6,
        news_time_range: str = "1d"
    ) -> Dict[str, Any]:
        """
        Orchestrate the analysis of a Polymarket event.
        
        Args:
            event: The Polymarket event to analyze
            include_news: Whether to fetch news articles
            news_max_items: Maximum number of news articles to fetch
            news_time_range: Time range for news articles
            
        Returns:
            Dictionary containing analysis results
        """
        logger.info(f"Starting orchestration for event: {event.title}")
        
        results = {
            "event": event,
            "status": "processing",
            "news": [],
            "tickers": [],  # Placeholder for future ticker integration
            "stock_data": {},  # Placeholder for future stock data integration
            "timestamp": datetime.now().isoformat()
        }
        
        try:
            if include_news:
                logger.info("Fetching news articles...")
                news_articles = await self.news_service.get_news_for_event(
                    event_title=event.title,
                    event_tags=[],  # Placeholder for future tag extraction
                    max_items=news_max_items,
                    time_range=news_time_range
                )
                results["news"] = news_articles
                logger.info(f"Fetched {len(news_articles)} news articles")
            
            # TODO: Add ticker mapping service integration
            # TODO: Add stock data fetching integration
            
            results["status"] = "complete"
            logger.info(f"Orchestration complete for event: {event.title}")
            
        except Exception as e:
            logger.error(f"Orchestration failed for event {event.title}: {e}")
            results["status"] = "error"
            results["error"] = str(e)
        
        return results
    
    async def get_event_news(
        self, 
        event: PolymarketEvent,
        max_items: int = 6,
        time_range: str = "1d"
    ) -> List[Dict[str, Any]]:
        """
        Get news articles for a specific event.
        
        Args:
            event: The Polymarket event
            max_items: Maximum number of articles
            time_range: Time range for articles
            
        Returns:
            List of news articles
        """
        return await self.news_service.get_news_for_event(
            event_title=event.title,
            event_tags=[],
            max_items=max_items,
            time_range=time_range
        )


# Global instance
orchestrator_service = OrchestratorService()
