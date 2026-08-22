from fastapi import APIRouter, Depends
from motor.motor_asyncio import AsyncIOMotorDatabase

from app.database import get_db
from app.schemas.api_key import GenerateKeyRequest, KeyResponse, RegenerateKeyRequest
from app.services import key_service

router = APIRouter(tags=["API Keys"])


@router.post("/generate-key", response_model=KeyResponse)
async def generate_key(
    payload: GenerateKeyRequest,
    db: AsyncIOMotorDatabase = Depends(get_db),
):
    """Issue a brand-new API key for a user, with the default token quota."""
    doc = await key_service.create_key(db, payload.username)
    return KeyResponse(**doc)


@router.post("/regenerate-key", response_model=KeyResponse)
async def regenerate_key(
    payload: RegenerateKeyRequest,
    db: AsyncIOMotorDatabase = Depends(get_db),
):
    """
    Invalidate a user's current key and issue a new one.
    Remaining tokens carry over; the old key stops working immediately.
    """
    doc = await key_service.regenerate_key(db, payload.username)
    return KeyResponse(**doc)
