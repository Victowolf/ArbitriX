from datetime import datetime, timezone

from fastapi import HTTPException, status
from motor.motor_asyncio import AsyncIOMotorDatabase

from app.schemas.agent import AddAgentRequest
from app.utils.security import generate_agent_id


def _proxy_url(base_url: str, agent_id: str) -> str:
    return f"{base_url.rstrip('/')}/agent/{agent_id}"


async def create_agent(
    db: AsyncIOMotorDatabase,
    payload: AddAgentRequest,
    base_url: str,
) -> dict:
    """
    Stores one agent document. `real_hosted_url` is whatever the caller
    gave us — it makes no difference to this gateway whether that URL
    came from "Upload Docker" (a container endpoint), "Connect GitHub"
    (a deployed service URL) or a manually pasted API endpoint. All
    three land here as the same field.
    """
    agent_id = await generate_agent_id(db)

    doc = {
        "agent_id": agent_id,
        "agent_name": payload.agent_name,
        "description": payload.description,
        "sector": payload.sector,
        "real_hosted_url": str(payload.real_hosted_url),
        "owner": payload.owner,
        "input_example": payload.input_example,
        "output_example": payload.output_example,
        "price_per_call": payload.price_per_call,
        "created_at": datetime.now(timezone.utc),
    }

    await db.agents.insert_one(doc)

    return {
        "agent_id": agent_id,
        "proxy_url": _proxy_url(base_url, agent_id),
    }


async def get_agent_or_404(db: AsyncIOMotorDatabase, agent_id: str) -> dict:
    agent = await db.agents.find_one({"agent_id": agent_id})

    if not agent:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail=f"No agent found with agent_id '{agent_id}'.",
        )

    return agent


def _public_shape(agent: dict, base_url: str) -> dict:
    return {
        "agent_id": agent["agent_id"],
        "agent_name": agent["agent_name"],
        "description": agent.get("description", ""),
        "sector": agent.get("sector", ""),
        "owner": agent["owner"],
        "proxy_url": _proxy_url(base_url, agent["agent_id"]),
        "price_per_call": agent.get("price_per_call", 0.0),
        "input_example": agent.get("input_example", {}),
        "output_example": agent.get("output_example", {}),
        "created_at": agent["created_at"],
    }


async def list_agents(db: AsyncIOMotorDatabase, base_url: str) -> list[dict]:
    agents = await db.agents.find().to_list(length=None)
    return [_public_shape(a, base_url) for a in agents]


async def get_agent_public(
    db: AsyncIOMotorDatabase, agent_id: str, base_url: str
) -> dict:
    agent = await get_agent_or_404(db, agent_id)
    return _public_shape(agent, base_url)
