from typing import Optional

from motor.motor_asyncio import AsyncIOMotorClient, AsyncIOMotorDatabase

from app.config import settings

client: Optional[AsyncIOMotorClient] = None
db: Optional[AsyncIOMotorDatabase] = None


async def connect_to_mongo() -> None:
    """
    Opens the connection to MongoDB Atlas and makes sure the indexes
    this app relies on exist. Runs once, at startup.
    """
    global client, db

    client = AsyncIOMotorClient(settings.mongo_uri)
    db = client[settings.db_name]

    # Indexes keep lookups fast as the collections grow.
    await db.agents.create_index("agent_id", unique=True)
    await db.api_keys.create_index("api_key", unique=True)
    await db.api_keys.create_index("username")
    await db.counters.create_index("name", unique=True)
    await db.subscriptions.create_index(
        [("username", 1), ("agent_id", 1)], unique=True
    )


async def close_mongo_connection() -> None:
    if client:
        client.close()


def get_db() -> AsyncIOMotorDatabase:
    """
    FastAPI dependency — import this in routers with `Depends(get_db)`.
    """
    if db is None:
        raise RuntimeError("Database not initialized. Did startup run?")
    return db
