import json

from fastapi import APIRouter, Depends, HTTPException, Request, status
from motor.motor_asyncio import AsyncIOMotorDatabase
from pydantic import BaseModel, Field

from app.database import get_db
from app.services import agent_service

router = APIRouter(prefix="/ai", tags=["AI · Agent Recommender"])


class RecommendRequest(BaseModel):
    query: str = Field(..., examples=["I need something to optimize shipping routes"])


class RecommendedAgent(BaseModel):
    agent_id: str
    agent_name: str
    proxy_url: str
    reason: str


class RecommendResponse(BaseModel):
    recommended: RecommendedAgent | None
    runner_ups: list[str] = []
    message: str = ""
    raw_query: str


SYSTEM_PROMPT = """You are the agent-matching engine for Arbitirix, an \
AI agent marketplace. You are given a user's request and a JSON list \
of every agent currently registered on the platform (id, name, \
description, sector, price per call). Pick the single best-matching \
agent for the request based on its description and sector.

Reply with ONLY a JSON object, no prose, in exactly this shape:
{"agent_id": "<the best agent's agent_id, or null if none fit>", \
"reason": "<one short sentence a buyer would read, explaining the match>", \
"runner_up_ids": ["<0-2 other agent_ids that could also work>"]}

If no agent is a reasonable fit, set "agent_id" to null and explain why \
in "reason".
"""


@router.post("/recommend-agent", response_model=RecommendResponse)
async def recommend_agent(
    payload: RecommendRequest,
    request: Request,
    db: AsyncIOMotorDatabase = Depends(get_db),
):
    """
    Given a free-text query, looks at every agent's description/sector
    and asks the LLM (Groq · gpt-oss-20b) which one best fits, then
    returns that agent's public proxy_url so the frontend can deep-link
    straight to it.
    """
    from ai_agents.groq_client import chat_completion

    base_url = str(request.base_url)
    agents = await agent_service.list_agents(db, base_url)

    # No agents in the marketplace at all — this is a normal, expected
    # state (empty Discover page), not an error. Return 200 so the
    # frontend can just render `message` inline in search, instead of
    # having to special-case a 404.
    if not agents:
        return RecommendResponse(
            recommended=None,
            message="No agents are registered on the platform yet.",
            runner_ups=[],
            raw_query=payload.query,
        )

    catalog = [
        {
            "agent_id": a["agent_id"],
            "agent_name": a["agent_name"],
            "description": a["description"],
            "sector": a["sector"],
            "price_per_call": a["price_per_call"],
        }
        for a in agents
    ]

    messages = [
        {"role": "system", "content": SYSTEM_PROMPT},
        {
            "role": "user",
            "content": (
                f"User request: {payload.query}\n\n"
                f"Available agents (JSON): {json.dumps(catalog)}"
            ),
        },
    ]

    reply = await chat_completion(messages, temperature=0.2, response_format_json=True)

    try:
        parsed = json.loads(reply)
    except ValueError:
        raise HTTPException(
            status_code=status.HTTP_502_BAD_GATEWAY,
            detail="The recommender model returned an unparseable response.",
        )

    by_id = {a["agent_id"]: a for a in agents}
    chosen_id = parsed.get("agent_id")
    chosen = by_id.get(chosen_id)
    llm_reason = parsed.get("reason", "").strip()

    recommended = None
    if chosen:
        recommended = RecommendedAgent(
            agent_id=chosen["agent_id"],
            agent_name=chosen["agent_name"],
            proxy_url=chosen["proxy_url"],
            reason=llm_reason,
        )
        message = f"Best match: {chosen['agent_name']}."
    else:
        # No registered agent fit this query. Surface the model's own
        # explanation so the frontend has something to show in search
        # instead of silently rendering nothing.
        message = llm_reason or "No registered agent matches this request yet."

    runner_ups = [rid for rid in parsed.get("runner_up_ids", []) if rid in by_id]

    return RecommendResponse(
        recommended=recommended,
        message=message,
        runner_ups=runner_ups,
        raw_query=payload.query,
    )
