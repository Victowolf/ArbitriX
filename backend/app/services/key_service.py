from datetime import datetime, timedelta, timezone

from fastapi import HTTPException, status
from motor.motor_asyncio import AsyncIOMotorDatabase

from app.config import settings
from app.utils.security import generate_api_key


async def create_key(db: AsyncIOMotorDatabase, username: str) -> dict:
    api_key = generate_api_key()
    now = datetime.now(timezone.utc)
    expires_on = now + timedelta(days=settings.default_expiry_days)

    doc = {
        "api_key": api_key,
        "username": username,
        "tokens_left": settings.default_tokens,
        "created_at": now,
        "expires_on": expires_on,
        "status": "active",
    }

    await db.api_keys.insert_one(doc)
    return doc


async def regenerate_key(db: AsyncIOMotorDatabase, username: str) -> dict:
    """
    Marks the user's current active key inactive and issues a new one.
    Remaining tokens carry over so the user doesn't lose their quota.
    """
    old_key = await db.api_keys.find_one(
        {"username": username, "status": "active"},
        sort=[("created_at", -1)],
    )

    carried_over_tokens = (
        old_key["tokens_left"] if old_key else settings.default_tokens
    )

    if old_key:
        await db.api_keys.update_one(
            {"_id": old_key["_id"]},
            {"$set": {"status": "inactive"}},
        )

    new_key = generate_api_key()
    now = datetime.now(timezone.utc)
    expires_on = now + timedelta(days=settings.default_expiry_days)

    doc = {
        "api_key": new_key,
        "username": username,
        "tokens_left": carried_over_tokens,
        "created_at": now,
        "expires_on": expires_on,
        "status": "active",
    }

    await db.api_keys.insert_one(doc)
    return doc


async def get_or_create_key(db: AsyncIOMotorDatabase, username: str) -> dict:
    """
    Used by the "purchase agent" flow: reuse the user's current active
    key if they have one (so buying a second agent doesn't hand them a
    pile of different keys), otherwise mint a fresh one.
    """
    existing = await db.api_keys.find_one(
        {"username": username, "status": "active"},
        sort=[("created_at", -1)],
    )
    if existing:
        return existing
    return await create_key(db, username)


async def record_purchase(
    db: AsyncIOMotorDatabase, username: str, agent_id: str
) -> None:
    """
    Upserts a (username, agent_id) row so "My Agents" can list what a
    buyer has already unlocked. Kept idempotent — buying the same agent
    twice just refreshes the timestamp instead of erroring.
    """
    from datetime import datetime, timezone

    await db.subscriptions.update_one(
        {"username": username, "agent_id": agent_id},
        {"$set": {"purchased_at": datetime.now(timezone.utc)}},
        upsert=True,
    )


async def list_purchased_agent_ids(db: AsyncIOMotorDatabase, username: str) -> list[str]:
    docs = await db.subscriptions.find({"username": username}).to_list(length=None)
    return [d["agent_id"] for d in docs]


async def validate_key(db: AsyncIOMotorDatabase, api_key: str) -> dict:
    """
    Runs every check a request needs before it's allowed to reach an
    agent: exists -> active -> not expired -> has tokens left.
    """
    key_doc = await db.api_keys.find_one({"api_key": api_key})

    if not key_doc or key_doc["status"] != "active":
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Invalid API key.",
        )

    now = datetime.now(timezone.utc)
    expires_on = key_doc["expires_on"]

    if expires_on.tzinfo is None:
        expires_on = expires_on.replace(tzinfo=timezone.utc)

    if expires_on < now:
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="API key has expired.",
        )

    if key_doc["tokens_left"] <= 0:
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="Token limit exceeded. Please upgrade or regenerate your key.",
        )

    return key_doc


async def deduct_tokens(
    db: AsyncIOMotorDatabase,
    api_key: str,
    amount: int = 10,
) -> int:
    result = await db.api_keys.find_one_and_update(
        {"api_key": api_key},
        {"$inc": {"tokens_left": -amount}},
        return_document=True,
    )
    return max(result["tokens_left"], 0)
