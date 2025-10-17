"""FastAPI entrypoint for the Polymarket volume spike detection backend."""

import asyncio
from contextlib import asynccontextmanager
from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
import logging
from dotenv import load_dotenv

# Load environment variables from .env file
load_dotenv()

from services.ingestion import ingestion_service
from routes import router

logging.basicConfig(level=logging.INFO)
logger = logging.getLogger(__name__)


@asynccontextmanager
async def lifespan(app: FastAPI):
    """Manage application lifecycle"""
    # Startup: Start polling Polymarket API
    logger.info("Starting Polymarket ingestion service...")

    # Do initial fetch
    await ingestion_service.fetch_and_process_markets()

    # Start background polling task
    polling_task = asyncio.create_task(
        ingestion_service.start_polling(interval=7)  # Poll every 7 seconds for demo
    )

    logger.info("Backend started successfully")

    yield

    # Shutdown: Stop polling
    logger.info("Shutting down ingestion service...")
    await ingestion_service.stop_polling()
    polling_task.cancel()
    try:
        await polling_task
    except asyncio.CancelledError:
        pass

    logger.info("Backend shutdown complete")


# Create FastAPI app
app = FastAPI(
    title="Polymarket Volume Spike Detector",
    description="API for detecting volume spikes in Polymarket prediction markets",
    version="1.0.0",
    lifespan=lifespan
)

# Add CORS middleware
app.add_middleware(
    CORSMiddleware,
    allow_origins=["http://localhost:3000", "http://localhost:3001"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# Include routes
app.include_router(router, prefix="/api")


@app.get("/health")
async def health_check():
    """Health check endpoint"""
    event_count = len(ingestion_service.events)
    spike_count = sum(1 for e in ingestion_service.events.values() if e.volumeSpike)

    return {
        "status": "ok",
        "events_tracked": event_count,
        "events_with_spikes": spike_count
    }


if __name__ == "__main__":
    import uvicorn
    uvicorn.run(app, host="0.0.0.0", port=8000)
