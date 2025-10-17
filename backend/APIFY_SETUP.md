# Apify Integration Setup

This document explains how to set up the Apify integration for news scraping in the Polymarket backend.

## Environment Variables

Create a `.env` file in the backend directory with the following variables:

```bash
# Required: Apify Token
APIFY_TOKEN=your_apify_token_here
```

## Getting an Apify Token

1. Go to [Apify Console](https://console.apify.com/)
2. Sign up for a free account
3. Navigate to [Account Integrations](https://console.apify.com/account/integrations)
4. Copy your API token
5. Add it to your `.env` file

## Usage

The Apify integration provides two main ways to fetch news:

### 1. Direct API Endpoints

**POST /api/news/scrape**
```json
{
  "query": "Tesla stock news",
  "max_items": 10,
  "language": "US:en",
  "time_range": "1d",
  "fetch_article_details": true
}
```

**GET /api/news/scrape**
```
GET /api/news/scrape?query=Tesla&max_items=5&time_range=1h
```

### 2. Programmatic Usage

```python
from services.news_agents import news_agent_service

# Fetch news for a Polymarket event
news = await news_agent_service.get_news_for_event(
    event_title="Will Bitcoin reach $100,000?",
    event_tags=["crypto", "bitcoin"],
    max_items=6,
    time_range="1d"
)

# Fetch news for a general query
news = await news_agent_service.get_news_for_query(
    query="Tesla earnings",
    max_items=10,
    time_range="1w"
)
```

## Features

- **Google News Scraping**: Uses Apify's Google News scraper actor
- **Relevance Scoring**: Automatically scores articles based on event keywords
- **Sentiment Analysis**: Basic sentiment analysis (positive/negative/neutral)
- **Time Range Filtering**: Support for 1h, 1d, 1w time ranges
- **Article Details**: Fetches full article content when enabled
- **Error Handling**: Graceful fallbacks when scraping fails

## Rate Limits

Apify free tier includes:
- 1,000 compute units per month
- Each news scraping run typically uses 1-2 compute units
- Monitor usage in the [Apify Console](https://console.apify.com/account/usage)

## Integration with Polymarket Events

The news service is designed to work seamlessly with Polymarket events:

1. **Event-based News**: Automatically generates search queries from event titles and tags
2. **Relevance Filtering**: Scores articles based on how relevant they are to the event
3. **Orchestrator Integration**: Can be called from the orchestrator service for event details

## Example Response

```json
{
  "status": "success",
  "query": "Bitcoin price prediction",
  "item_count": 5,
  "items": [
    {
      "id": "news_0_1234",
      "title": "Bitcoin Surges Past $50,000 as Institutional Adoption Grows",
      "snippet": "Bitcoin reached new heights today as major institutions...",
      "source": "CoinDesk",
      "publishedAt": "2024-01-17T10:30:00Z",
      "url": "https://coindesk.com/...",
      "relevanceScore": 0.85,
      "sentiment": "positive"
    }
  ]
}
```
