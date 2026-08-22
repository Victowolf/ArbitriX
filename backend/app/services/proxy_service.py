from typing import Any

import httpx
from fastapi import HTTPException, status

from app.config import settings


async def forward_to_agent(real_hosted_url: str, payload: dict[str, Any]) -> Any:
    """
    Forwards the caller's JSON body to the real agent URL, unchanged,
    and returns whatever JSON the agent responds with, unchanged.

    Different agents in the marketplace can have completely different
    request/response shapes (e.g. {"text": "..."} vs. {"origin": ...,
    "destinations": [...], ...}) — this gateway doesn't enforce a
    contract, it's a pure passthrough.
    """
    try:
        async with httpx.AsyncClient(timeout=settings.proxy_timeout_seconds) as client:
            response = await client.post(real_hosted_url, json=payload)
            response.raise_for_status()
    except httpx.TimeoutException:
        raise HTTPException(
            status_code=status.HTTP_504_GATEWAY_TIMEOUT,
            detail="The agent took too long to respond.",
        )
    except httpx.HTTPStatusError as exc:
        raise HTTPException(
            status_code=status.HTTP_502_BAD_GATEWAY,
            detail=f"Agent returned an error: {exc.response.status_code} — {exc.response.text[:300]}",
        )
    except httpx.RequestError:
        raise HTTPException(
            status_code=status.HTTP_502_BAD_GATEWAY,
            detail="Could not reach the agent's real hosted URL.",
        )

    try:
        return response.json()
    except ValueError:
        raise HTTPException(
            status_code=status.HTTP_502_BAD_GATEWAY,
            detail="Agent response was not valid JSON.",
        )