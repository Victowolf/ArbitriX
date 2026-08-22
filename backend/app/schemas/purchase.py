from datetime import datetime

from pydantic import BaseModel, Field


class PurchaseAgentRequest(BaseModel):
    """
    Sent when the buyer hits "Generate API Key" in SubscriptionModal.tsx
    for an agent (as opposed to a subscription-priced model).
    """

    username: str = Field(..., examples=["raj"])
    agent_id: str = Field(..., examples=["agent_001"])


class PurchaseAgentResponse(BaseModel):
    agent_id: str
    agent_name: str
    proxy_url: str
    api_key: str
    tokens_left: int
    expires_on: datetime


class MyAgentOut(BaseModel):
    agent_id: str
    agent_name: str
    proxy_url: str
    purchased_at: datetime
