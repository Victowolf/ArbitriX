# ai_agents/

Two "meta" AI agents for the platform itself, kept in their own
top-level folder — deliberately **separate from `app/`**, which is the
database-backed gateway (agents, keys, purchases, proxying).

```
ai_agents/
├── groq_client.py       # shared Groq (gpt-oss-20b) chat-completion call
├── recommend_agent.py   # POST /ai/recommend-agent
├── chatbot_agent.py     # POST /ai/chatbot
└── __init__.py
```

Both endpoints are wired into the same FastAPI app in `app/main.py`, so
they show up in the same `/docs` — this folder is just where their code
lives, to keep "marketplace data" and "AI helper logic" from mixing.

## 1. `POST /ai/recommend-agent`

Input: `{"query": "I need something to optimize shipping routes"}`

Reads every agent's name/description/sector/price from MongoDB (via
`app.services.agent_service`, read-only), hands that catalog plus the
query to the LLM, and asks it to pick the single best match. Returns
that agent's `agent_id`, `agent_name`, `proxy_url`, and a one-line
reason, plus up to two runner-up ids.

## 2. `POST /ai/chatbot`

Input: `{"message": "...", "history": [{"role": "user"|"assistant", "text": "..."}]}`

Backs the "Chat with Arbitirix" widget (`layout/ArbitirixChatbot.tsx`).
`BASE_INSTRUCTIONS` at the top of `chatbot_agent.py` is the system
prompt describing the product (Workspace, Discover, proxy/API-key
model, Portfolio, wallet payments, etc.) — edit that block to change
what the bot knows; nothing else needs to change.

## LLM

Both endpoints call **Groq**, model `openai/gpt-oss-20b`, via the plain
`/chat/completions` REST endpoint (no extra SDK — just `httpx`, already
in `requirements.txt`). Configure in `.env`:

```
GROQ_API_KEY=gsk_...
GROQ_MODEL=openai/gpt-oss-20b        # optional, this is the default
GROQ_BASE_URL=https://api.groq.com/openai/v1   # optional
```

Get a key at https://console.groq.com/keys.
