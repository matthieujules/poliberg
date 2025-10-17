# News Scraping Flow Diagram

## Complete Flow Overview

```
┌─────────────────┐    ┌─────────────────┐    ┌─────────────────┐
│   Frontend      │    │   Backend API   │    │   Apify Service │
│   (React/Next)  │    │   (FastAPI)     │    │   (Google News) │
└─────────────────┘    └─────────────────┘    └─────────────────┘
         │                       │                       │
         │                       │                       │
    ┌────▼────┐              ┌───▼───┐              ┌────▼────┐
    │ User    │              │Routes │              │Apify API│
    │ Request │              │Layer  │              │Actor    │
    └────┬────┘              └───┬───┘              └────┬────┘
         │                       │                       │
         │                       │                       │
    ┌────▼────┐              ┌───▼───┐              ┌────▼────┐
    │ API     │              │Orchestrator│         │Google   │
    │ Service │              │Service    │         │News     │
    └────┬────┘              └───┬───┘              └────┬────┘
         │                       │                       │
         │                       │                       │
    ┌────▼────┐              ┌───▼───┐              ┌────▼────┐
    │ HTTP    │              │News   │              │News     │
    │ Request │              │Agent  │              │Articles │
    └─────────┘              └───┬───┘              └────┬────┘
                                 │                       │
                                 │                       │
                            ┌────▼────┐              ┌────▼────┐
                            │Apify    │              │Formatted│
                            │Service  │              │Response │
                            └────┬────┘              └────┬────┘
                                 │                       │
                                 │                       │
                            ┌────▼────┐              ┌────▼────┐
                            │Apify    │              │JSON     │
                            │Actor    │              │Response │
                            │Run      │              └─────────┘
                            └─────────┘
```

## Detailed Flow Steps

### 1. Frontend Request
- User interacts with frontend (React/Next.js)
- Frontend makes API call to backend
- Two main entry points:
  - Direct news scraping: `POST /api/news/scrape`
  - Event-specific news: `GET /api/events/{event_id}/news`

### 2. Backend API Layer (routes.py)
- Receives HTTP request
- Validates parameters
- Routes to appropriate service

### 3. Orchestrator Service (orchestrator.py)
- Coordinates multiple services
- For event news: calls NewsAgentService
- Manages error handling and response formatting

### 4. News Agent Service (news_agents.py)
- Builds search query from event title
- Calls ApifyService to scrape news
- Formats and scores articles for relevance
- Returns processed news articles

### 5. Apify Service (apify_service.py)
- Manages Apify API integration
- Starts Google News scraper actor
- Waits for completion
- Fetches results from Apify dataset

### 6. Apify Google News Actor
- External service that scrapes Google News
- Uses the query to search for relevant articles
- Returns raw news data

### 7. Response Processing
- Raw articles are formatted and scored
- Articles are sorted by relevance
- Final response is returned to frontend

## Key Data Transformations

### Query Construction
```
Event Title: "Will Tesla stock reach $300 by end of 2024?"
↓
Search Query: "Will Tesla stock reach $300 by end of 2024?"
↓
Apify Input: {
  "query": "Will Tesla stock reach $300 by end of 2024?",
  "maxItems": 12,
  "timeRange": "1d",
  "language": "US:en"
}
```

### Article Processing
```
Raw Apify Article → Formatted Article
{
  "title": "Tesla Stock Analysis...",
  "url": "https://...",
  "publishedAt": "2024-01-15T10:30:00Z"
}
↓
{
  "title": "Tesla Stock Analysis...",
  "url": "https://...",
  "publishedAt": "2024-01-15T10:30:00Z",
  "relevanceScore": 0.85,
  "formattedDate": "Jan 15, 2024",
  "eventTitle": "Will Tesla stock reach $300 by end of 2024?",
  "eventTags": [],
  "rawData": {...}
}
```

## Error Handling Flow

```
Request → Validation → Service Call → Apify API → Response
    ↓         ↓           ↓            ↓          ↓
  400      400/422      500          500        200
  Bad     Invalid      Service      Apify      Success
 Request  Params      Error        Error
```

## Configuration Dependencies

- **APIFY_TOKEN**: Required environment variable
- **Apify Actor ID**: `lhotanova~google-news-scraper`
- **Rate Limits**: Handled by Apify service
- **Timeout**: 7 minutes for actor completion
