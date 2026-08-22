from typing import Any

from fastapi import APIRouter, Body, Depends, Header
from motor.motor_asyncio import AsyncIOMotorDatabase

from app.database import get_db
from app.services import agent_service, key_service, proxy_service

router = APIRouter(tags=["Gateway"])

TOKENS_PER_CALL = 10


@router.post("/agent/{agent_id}")
async def call_agent(
    agent_id: str,
    payload: dict[str, Any] = Body(
        ...,
        examples=[
            {"text": "Translate this to French: Hello"},
            {
                "origin": "Mumbai",
                "destinations": ["Rotterdam"],
                "preferred_transport": "Waterways",
                "sector": "Energy",
            },
        ],
    ),
    x_api_key: str = Header(..., alias="x-api-key"),
    db: AsyncIOMotorDatabase = Depends(get_db),
):
    """
    Pure passthrough: forwards whatever JSON body is sent to the
    agent's real hosted URL, returns whatever JSON the agent replies
    with, with tokens_left added on.
    """
    key_doc = await key_service.validate_key(db, x_api_key)
    agent = await agent_service.get_agent_or_404(db, agent_id)

    agent_response = await proxy_service.forward_to_agent(
        agent["real_hosted_url"],
        payload,
    )

    tokens_left = await key_service.deduct_tokens(
        db, key_doc["api_key"], amount=TOKENS_PER_CALL
    )

    if isinstance(agent_response, dict):
        return {**agent_response, "tokens_left": tokens_left}

    return {"result": agent_response, "tokens_left": tokens_left}