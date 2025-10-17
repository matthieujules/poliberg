"""News agent service for fetching and processing news articles."""

import logging
from typing import List, Dict, Any
from datetime import datetime

from services.apify_service import apify_service

logger = logging.getLogger(__name__)


class NewsAgentService:
    """Service for fetching news articles using Apify's Google News scraper."""
    
    def __init__(self):
        self.apify_service = apify_service
    
    def _extract_keywords(self, text: str) -> List[str]:
        """Extract keywords from text for relevance scoring."""
        # Simple keyword extraction - can be enhanced with NLP
        words = text.lower().split()
        # Filter out common words and keep meaningful terms
        stop_words = {'the', 'a', 'an', 'and', 'or', 'but', 'in', 'on', 'at', 'to', 'for', 'of', 'with', 'by', 'is', 'are', 'was', 'were', 'be', 'been', 'have', 'has', 'had', 'do', 'does', 'did', 'will', 'would', 'could', 'should', 'may', 'might', 'must', 'can', 'this', 'that', 'these', 'those'}
        keywords = [word for word in words if len(word) > 3 and word not in stop_words]
        return keywords[:10]  # Limit to top 10 keywords
    
    def _calculate_relevance_score(self, article: Dict[str, Any], event_title: str, event_tags: List[str]) -> float:
        """Calculate relevance score for an article based on event context."""
        title = article.get('title', '').lower()
        source = article.get('source', '').lower()
        
        # Extract keywords from event title
        event_keywords = self._extract_keywords(event_title)
        
        # Calculate score based on keyword matches
        score = 0.0
        for keyword in event_keywords:
            if keyword in title:
                score += 0.1
        
        # Boost score for reputable sources
        reputable_sources = ['reuters', 'bloomberg', 'cnn', 'bbc', 'wsj', 'nytimes', 'ap', 'associated press']
        if any(source_name in source for source_name in reputable_sources):
            score += 0.2
        
        # Normalize score to 0-1 range
        return min(score, 1.0)
    
    def _analyze_sentiment(self, title: str) -> str:
        """Simple sentiment analysis based on keywords."""
        positive_words = ['up', 'rise', 'gain', 'positive', 'good', 'strong', 'win', 'success', 'profit', 'growth']
        negative_words = ['down', 'fall', 'drop', 'negative', 'bad', 'weak', 'loss', 'fail', 'decline', 'crash']
        
        title_lower = title.lower()
        positive_count = sum(1 for word in positive_words if word in title_lower)
        negative_count = sum(1 for word in negative_words if word in title_lower)
        
        if positive_count > negative_count:
            return 'positive'
        elif negative_count > positive_count:
            return 'negative'
        else:
            return 'neutral'
    
    def _format_article(self, article: Dict[str, Any], event_title: str, event_tags: List[str]) -> Dict[str, Any]:
        """Format an article into a NewsCard-like structure."""
        relevance_score = self._calculate_relevance_score(article, event_title, event_tags)
        sentiment = self._analyze_sentiment(article.get('title', ''))
        
        return {
            'id': article.get('guid', ''),
            'title': article.get('title', ''),
            'snippet': article.get('title', '')[:200] + '...',  # Simple snippet from title
            'source': article.get('source', ''),
            'publishedAt': article.get('publishedAt', ''),
            'url': article.get('link', ''),
            'relevanceScore': relevance_score,
            'sentiment': sentiment,
            'image': article.get('image', ''),
            'raw_data': article  # Keep original data for debugging
        }
    
    async def get_news_for_event(
        self,
        event_title: str,
        event_tags: List[str] = None,
        max_items: int = 6,
        time_range: str = "1d"
    ) -> List[Dict[str, Any]]:
        """
        Fetch news articles related to a Polymarket event.
        
        Args:
            event_title: The title/question of the event
            event_tags: List of tags associated with the event
            max_items: Maximum number of articles to return
            time_range: Time range for news (1h, 1d, 1w)
            
        Returns:
            List of formatted news articles
        """
        if event_tags is None:
            event_tags = []
        
        logger.info(f"Fetching news for event: {event_title}")
        
        try:
            # Use the event title as the search query
            articles = await self.apify_service.scrape_google_news(
                query=event_title,
                max_items=max_items * 2,  # Fetch more to filter for relevance
                time_range=time_range
            )
            
            # Format and score articles
            formatted_articles = []
            for article in articles:
                formatted = self._format_article(article, event_title, event_tags)
                formatted_articles.append(formatted)
            
            # Sort by relevance score and return top articles
            formatted_articles.sort(key=lambda x: x['relevanceScore'], reverse=True)
            
            result = formatted_articles[:max_items]
            logger.info(f"Returning {len(result)} news articles for event: {event_title}")
            return result
            
        except Exception as e:
            logger.error(f"Failed to fetch news for event {event_title}: {e}")
            return []
    
    async def get_news_for_query(
        self,
        query: str,
        max_items: int = 10,
        time_range: str = "1d"
    ) -> List[Dict[str, Any]]:
        """
        Fetch news articles for a general query.
        
        Args:
            query: Search query
            max_items: Maximum number of articles
            time_range: Time range for news
            
        Returns:
            List of formatted news articles
        """
        logger.info(f"Fetching news for query: {query}")
        
        try:
            articles = await self.apify_service.scrape_google_news(
                query=query,
                max_items=max_items,
                time_range=time_range
            )
            
            # Format articles
            formatted_articles = []
            for article in articles:
                formatted = self._format_article(article, query, [])
                formatted_articles.append(formatted)
            
            logger.info(f"Returning {len(formatted_articles)} news articles for query: {query}")
            return formatted_articles
            
        except Exception as e:
            logger.error(f"Failed to fetch news for query {query}: {e}")
            return []


# Global instance
news_agent_service = NewsAgentService()
