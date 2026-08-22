from datetime import datetime
from typing import Any, Optional

from pydantic import BaseModel, Field, HttpUrl


class AddAgentRequest(BaseModel):
    """
    Matches the "Add Agent" form on the frontend (workspace/AddAgentForm.tsx):
    name, description, sector, real hosted URL, example input/output JSON
    and a token price per call.
    """

    agent_name: str = Field(..., examples=["Route Optimizer"])
    description: str = Field(..., examples=["Finds the fastest shipping route between two ports."])
    sector: str = Field(..., examples=["Logistics"])
    real_hosted_url: HttpUrl = Field(
        ..., examples=["https://friend1-agent.com/predict"]
    )
    owner: str = Field(..., examples=["Priya"])

    # Docker upload / GitHub connect both resolve to a real_hosted_url too —
    # the gateway does not care how the agent was deployed, only where it
    # can be reached.
    input_example: dict[str, Any] = Field(default_factory=dict)
    output_example: dict[str, Any] = Field(default_factory=dict)
    price_per_call: float = Field(default=0.0, ge=0)


class AddAgentResponse(BaseModel):
    agent_id: str
    proxy_url: str


class AgentOut(BaseModel):
    """
    Public-facing agent info shown on Discover / Deployments.

    Notice `real_hosted_url` is NOT included here — that's the whole
    point of the gateway. Only `proxy_url` is ever exposed.
    """

    agent_id: str
    agent_name: str
    description: str
    sector: str
    owner: str
    proxy_url: str
    price_per_call: float
    input_example: dict[str, Any] = Field(default_factory=dict)
    output_example: dict[str, Any] = Field(default_factory=dict)
    created_at: datetime


class AgentSummary(BaseModel):
    """Lightweight shape used internally by the ai_agents recommender."""

    agent_id: str
    agent_name: str
    description: str
    sector: str
    price_per_call: float
    proxy_url: str
