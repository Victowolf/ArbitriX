from fastapi import APIRouter, Depends, Request
from motor.motor_asyncio import AsyncIOMotorDatabase

from app.database import get_db
from app.schemas.purchase import PurchaseAgentRequest, PurchaseAgentResponse
from app.services import agent_service, key_service

router = APIRouter(tags=["Purchase"])


@router.post("/purchase-agent", response_model=PurchaseAgentResponse)
async def purchase_agent(
    payload: PurchaseAgentRequest,
    request: Request,
    db: AsyncIOMotorDatabase = Depends(get_db),
):
    """
    Wired to the "Generate API Key" button in SubscriptionModal.tsx.

    1. Confirms the agent exists.
    2. Reuses the buyer's active key, or mints a new one.
    3. Records the purchase (for a future "My Agents" list).
    4. Returns the api_key together with the proxy_url for THIS agent —
       that pair is everything the buyer needs to start calling it.
    """
    base_url = str(request.base_url)
    agent = await agent_service.get_agent_public(db, payload.agent_id, base_url)

    key_doc = await key_service.get_or_create_key(db, payload.username)
    await key_service.record_purchase(db, payload.username, payload.agent_id)

    return PurchaseAgentResponse(
        agent_id=agent["agent_id"],
        agent_name=agent["agent_name"],
        proxy_url=agent["proxy_url"],
        api_key=key_doc["api_key"],
        tokens_left=key_doc["tokens_left"],
        expires_on=key_doc["expires_on"],
    )
