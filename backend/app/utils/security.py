import secrets

from motor.motor_asyncio import AsyncIOMotorDatabase


async def _next_sequence(db: AsyncIOMotorDatabase, name: str) -> int:
    """
    Atomic auto-incrementing counter, stored in its own collection.
    Used to generate human-readable, sequential agent_ids
    (agent_001, agent_002, ...) instead of random ids.
    """
    result = await db.counters.find_one_and_update(
        {"name": name},
        {"$inc": {"value": 1}},
        upsert=True,
        return_document=True,
    )
    return result["value"]


async def generate_agent_id(db: AsyncIOMotorDatabase) -> str:
    seq = await _next_sequence(db, "agent_id")
    return f"agent_{seq:03d}"


def generate_api_key() -> str:
    return f"sk_{secrets.token_hex(8)}"
