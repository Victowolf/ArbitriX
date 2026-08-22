from fastapi import APIRouter
from pydantic import BaseModel, Field

router = APIRouter(prefix="/ai", tags=["AI · Project Chatbot"])


class ChatTurn(BaseModel):
    role: str = Field(..., examples=["user"])  # "user" or "assistant"
    text: str


class ChatbotRequest(BaseModel):
    message: str = Field(..., examples=["How do I add my own agent?"])
    history: list[ChatTurn] = Field(default_factory=list)


class ChatbotResponse(BaseModel):
    reply: str


# Base instructions for the widget seen in layout/ArbitirixChatbot.tsx.
# Edit this block to change what the chatbot knows about the product —
# nothing else in this file needs to change.
BASE_INSTRUCTIONS = """You are the Arbitirix in-app assistant, shown as \
a chat panel in the bottom-right corner of the Arbitirix workspace.

Arbitirix is a blockchain-backed AI agent marketplace. Key concepts a \
user may ask about:
- Workspace → "Deploy a Model": sellers register an agent three ways —
  "Add Agent" (fill in a JSON contract by hand), "Upload Docker" (zip a
  model package), or "Connect GitHub" (deploy straight from a repo).
  Whichever route is used, the agent ends up with one public proxy_url;
  the real hosted backend URL is never shown to buyers.
- Deployed Models: a table of the seller's live agents (status, users,
  API calls, revenue in ETH, created date) with View / Manage / Withdraw
  actions.
- Discover: where buyers browse agents by sector/description and
  purchase access.
- Purchasing an agent generates an API key and that agent's proxy_url —
  buyers call the proxy_url with an `x-api-key` header and it forwards
  their request straight to the real agent, tokens get deducted per call.
- API Access: view/regenerate a personal API key, see token quota and
  usage.
- Portfolio: subscriptions, transaction history, wallet balance.
- Payments run over a connected crypto wallet (e.g. ETH on a testnet).

Answer questions about navigating these features, how the gateway/proxy
model works, and general guidance. Keep replies short (2-4 sentences),
friendly, and specific to Arbitirix. If asked something unrelated to the
product, answer briefly and steer back to how Arbitirix can help.
"""


@router.post("/chatbot", response_model=ChatbotResponse)
async def chatbot(payload: ChatbotRequest):
    """
    Backs the "Chat with Arbitirix" widget. Fed with the project's base
    instructions as a system prompt plus the running conversation, and
    answers with Groq · gpt-oss-20b.
    """
    from ai_agents.groq_client import chat_completion

    messages = [{"role": "system", "content": BASE_INSTRUCTIONS}]
    for turn in payload.history[-10:]:
        role = "assistant" if turn.role == "assistant" else "user"
        messages.append({"role": role, "content": turn.text})
    messages.append({"role": "user", "content": payload.message})

    reply = await chat_completion(messages, temperature=0.4, max_tokens=300)
    return ChatbotResponse(reply=reply.strip())
