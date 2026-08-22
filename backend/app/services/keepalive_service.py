import asyncio
import logging
import os

import httpx

from app.config import settings

logger = logging.getLogger("keepalive")

PING_INTERVAL_SECONDS = 9 * 60  # 9 minutes


def _resolve_self_url() -> str | None:
    return settings.self_url or os.environ.get("RENDER_EXTERNAL_URL")


async def _ping_self(url: str) -> None:
    target = url.rstrip("/") + "/"

    try:
        async with httpx.AsyncClient(timeout=10) as client:
            response = await client.get(target)
            logger.info("Keep-alive ping to %s -> %s", target, response.status_code)
    except httpx.RequestError as exc:
        logger.warning("Keep-alive ping to %s failed: %s", target, exc)


async def keepalive_loop() -> None:
    url = _resolve_self_url()

    if not url:
        logger.info(
            "No self URL configured (SELF_URL / RENDER_EXTERNAL_URL) — "
            "keep-alive pinger is idle."
        )

    while True:
        await asyncio.sleep(PING_INTERVAL_SECONDS)
        url = _resolve_self_url()

        if url:
            await _ping_self(url)