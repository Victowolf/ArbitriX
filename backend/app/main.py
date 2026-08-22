import asyncio
from contextlib import asynccontextmanager

from fastapi import FastAPI

from app.config import settings
from app.database import close_mongo_connection, connect_to_mongo
from app.routers import agents, gateway, keys, purchase
from app.services.keepalive_service import keepalive_loop

# The AI helper endpoints (recommender + chatbot) live in their own
# top-level package, separate from app/ (the database-backed gateway),
# per the project's folder layout. See ai_agents/README.md.
from ai_agents.recommend_agent import router as recommend_router
from ai_agents.chatbot_agent import router as chatbot_router


@asynccontextmanager
async def lifespan(app: FastAPI):
    await connect_to_mongo()

    keepalive_task = asyncio.create_task(keepalive_loop())

    yield

    keepalive_task.cancel()
    await close_mongo_connection()


app = FastAPI(
    title=settings.app_name,
    version=settings.app_version,
    description=(
        "One gateway server in front of many AI agents. Add an agent, "
        "issue an API key, and call `/agent/{agent_id}` — auth, token "
        "quotas, expiry, and proxying are all handled here.\n\n"
        "Try every endpoint from this Swagger UI (`/docs`)."
    ),
    lifespan=lifespan,
)

app.include_router(agents.router)
app.include_router(keys.router)
app.include_router(purchase.router)
app.include_router(gateway.router)
app.include_router(recommend_router)
app.include_router(chatbot_router)


@app.get("/", tags=["Health"])
async def root():
    return {"status": "ok", "service": settings.app_name}