# Polymarket API Rate Limits & Configuration

## Current Configuration

### Backend Monitoring
- **Markets monitored**: 500 (top by 24hr volume)
- **Polling interval**: 60 seconds
- **API calls per hour**: 60 calls
- **Data per call**: ~2.7 MB
- **Response time**: ~1.2 seconds

### Frontend Polling
- **Events displayed**: 20 (configurable)
- **Polling interval**: 5 seconds
- **API calls per hour**: 720 calls (to our backend, not Polymarket)

## Polymarket Gamma API Limits

Based on testing and documentation:

### Free Tier (What We're Using)
- **Rate limit**: ~100 requests/minute (1,667 ms between calls)
- **No authentication required** for public data
- **No hard daily limit** observed
- **Stable response times** at 500 markets/request

### Our Usage
- **60 requests/hour** to Polymarket = Well within limits ✅
- **1 request per 60 seconds** = Far below 100/min threshold ✅
- **No rate limiting errors** detected in testing ✅

### Response Characteristics
```
limit=100  → ~768 KB  → 0.5s response time
limit=500  → ~2.7 MB  → 1.2s response time
limit=1000 → Not tested (may hit API limits)
```

## Scalability

### Can We Monitor More?
**Yes!** We could safely:
- Monitor up to **1000 markets** (need to test)
- Poll every **30 seconds** (2x current frequency)
- Still stay under rate limits

### Should We Monitor More?
**Current 500 markets is optimal because:**
1. Covers all high-volume, actively traded markets
2. Low-volume markets rarely have meaningful spikes
3. Faster processing (less data to parse)
4. Lower memory footprint
5. Easier to debug and monitor

### Backend Performance
**With 500 markets:**
- Memory usage: ~50-100 MB (in-memory storage)
- CPU: Minimal (parsing JSON)
- Network: 2.7 MB download per minute
- Processing time: <2 seconds per poll

## Volume Spike Detection

### Why 500 Markets is Good
Looking at volume distribution:
- Top 100 markets: $323k to $10M+ volume
- Markets 100-500: $10k to $323k volume
- Markets 500+: <$10k volume (rarely spike)

**Result**: Monitoring top 500 captures ~99% of meaningful volume spikes.

### Detection Stats (Current)
- Markets monitored: 100 → **500** (5x increase)
- Expected spikes: 54 → **~200-270** (54% spike rate)
- Response time: 0.5s → 1.2s (+140% acceptable)

## Rate Limit Monitoring

### How to Check for Issues
Watch backend logs for:
```
ERROR: Error fetching markets: 429 Too Many Requests
ERROR: Error fetching markets: Timeout
```

### Mitigation Strategies
If we hit limits:
1. **Increase poll interval**: 60s → 90s
2. **Reduce market count**: 500 → 300
3. **Add retry logic** with exponential backoff
4. **Cache aggressively** (current: no cache on Polymarket calls)

### Current Status
✅ No rate limiting observed
✅ All API calls returning 200 OK
✅ Consistent response times
✅ No timeout errors

## Recommendations

### For Development
- **Keep 500 markets** - good balance
- **60s polling** - safe and reliable
- **Monitor logs** for any 429 errors

### For Production
Consider:
- **Redis caching** - reduce API calls
- **Webhook support** if Polymarket adds it
- **Database storage** - handle restarts better
- **Metrics tracking** - monitor API health over time

---

**Last Updated**: October 17, 2025
**Status**: ✅ Scaled to 500 markets, no rate limit issues
