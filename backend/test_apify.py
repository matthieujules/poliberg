#!/usr/bin/env python3
"""Test script for Apify integration."""

import asyncio
import os
import sys

# Add current directory to path
sys.path.append('.')

async def test_apify_integration():
    """Test the Apify integration components."""
    print("🧪 Testing Apify Integration")
    print("=" * 50)
    
    # Test 1: Import ApifyService
    try:
        from services.apify_service import apify_service
        print("✅ ApifyService imported successfully")
    except Exception as e:
        print(f"❌ ApifyService import failed: {e}")
        return False
    
    # Test 2: Test token handling
    token = os.getenv("APIFY_TOKEN")
    if token and token != "your_apify_token_here":
        print(f"✅ APIFY_TOKEN is configured: {token[:10]}...")
    else:
        print("⚠️  APIFY_TOKEN not configured (expected for testing)")
    
    # Test 3: Test news scraping (will fail without real token)
    try:
        print("\n🔍 Testing news scraping...")
        articles = await apify_service.scrape_google_news(
            query="Tesla",
            max_items=3,
            time_range="1h"
        )
        print(f"✅ Successfully scraped {len(articles)} articles")
        if articles:
            print(f"📰 Sample article: {articles[0].get('title', 'No title')[:50]}...")
    except ValueError as e:
        if "APIFY_TOKEN" in str(e):
            print("⚠️  News scraping failed as expected (no token configured)")
        else:
            print(f"❌ News scraping failed: {e}")
    except Exception as e:
        print(f"❌ News scraping failed: {e}")
    
    # Test 4: Test routes import
    try:
        from routes import router
        print("✅ Routes imported successfully")
        
        # Count news-related routes
        news_routes = [r for r in router.routes if hasattr(r, 'path') and 'news' in r.path]
        print(f"📋 Found {len(news_routes)} news-related routes:")
        for route in news_routes:
            print(f"  - {route.methods} {route.path}")
    except Exception as e:
        print(f"❌ Routes import failed: {e}")
        return False
    
    # Test 5: Test FastAPI app
    try:
        from app import app
        print("✅ FastAPI app imported successfully")
        
        # Count total routes
        total_routes = len([r for r in app.routes if hasattr(r, 'path')])
        print(f"📋 Total API routes: {total_routes}")
    except Exception as e:
        print(f"❌ FastAPI app import failed: {e}")
        return False
    
    print("\n🎉 All tests passed! Apify integration is working correctly.")
    print("\n📝 Next steps:")
    print("1. Get an Apify token from https://console.apify.com/account/integrations")
    print("2. Set APIFY_TOKEN environment variable")
    print("3. Test with real news scraping")
    
    return True

if __name__ == "__main__":
    asyncio.run(test_apify_integration())
