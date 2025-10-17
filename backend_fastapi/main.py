from __future__ import annotations

import uvicorn
from fastapi import FastAPI
from dotenv import load_dotenv
from fastapi.middleware.cors import CORSMiddleware

from .config import settings
from .routers.orchestrate import router as orchestrate_router


load_dotenv()
app = FastAPI(title=settings.APP_TITLE)

# Permissive CORS for local dev; tighten in prod
app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)


@app.get("/health")
async def health():
    return {"status": "ok"}


app.include_router(orchestrate_router)


def run():  # for `python -m backend_fastapi.main`
    uvicorn.run("backend_fastapi.main:app", host="0.0.0.0", port=8001, reload=True)


if __name__ == "__main__":
    run()
