from datetime import datetime

from pydantic import BaseModel, Field


class GenerateKeyRequest(BaseModel):
    username: str = Field(..., examples=["raj"])


class RegenerateKeyRequest(BaseModel):
    username: str = Field(..., examples=["raj"])


class KeyResponse(BaseModel):
    api_key: str
    username: str
    tokens_left: int
    expires_on: datetime


# Note: there's no AgentCallRequest/AgentCallResponse model anymore —
# app/routers/gateway.py accepts and returns arbitrary JSON, since
# different agents define their own request/response shapes.