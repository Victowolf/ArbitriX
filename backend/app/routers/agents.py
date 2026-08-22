from fastapi import APIRouter, Depends, Request
from motor.motor_asyncio import AsyncIOMotorDatabase

from app.database import get_db
from app.schemas.agent import AddAgentRequest, AddAgentResponse, AgentOut
from app.services import agent_service

router = APIRouter(tags=["Agents"])


@router.post("/add-agent", response_model=AddAgentResponse)
async def add_agent(
    payload: AddAgentRequest,
    request: Request,
    db: AsyncIOMotorDatabase = Depends(get_db),
):
    """
    Register a new AI agent behind the gateway.

    The caller gets back a `proxy_url` — that's the ONLY url they
    should ever share publicly. `real_hosted_url` never leaves the
    database.
    """
    base_url = str(request.base_url)
    return await agent_service.create_agent(db, payload, base_url)


@router.get("/agents", response_model=list[AgentOut])
async def get_agents(
    request: Request,
    db: AsyncIOMotorDatabase = Depends(get_db),
):
    """List every agent currently registered — powers the Discover tab."""
    base_url = str(request.base_url)
    return await agent_service.list_agents(db, base_url)


@router.get("/agents/{agent_id}", response_model=AgentOut)
async def get_agent(
    agent_id: str,
    request: Request,
    db: AsyncIOMotorDatabase = Depends(get_db),
):
    """Single agent lookup — powers the ModelDetails / agent detail page."""
    base_url = str(request.base_url)
    return await agent_service.get_agent_public(db, agent_id, base_url)
