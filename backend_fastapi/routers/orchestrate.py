from __future__ import annotations

from fastapi import APIRouter

from ..models import OrchestrateRequest, OrchestrateResponse
from ..orchestrator.engine import orchestrate


router = APIRouter()


@router.post("/orchestrate", response_model=OrchestrateResponse)
async def post_orchestrate(body: OrchestrateRequest) -> OrchestrateResponse:
    return await orchestrate(body)

