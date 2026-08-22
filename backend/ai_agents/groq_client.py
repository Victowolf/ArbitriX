"""
Thin wrapper around Groq's OpenAI-compatible /chat/completions endpoint.

Kept deliberately dependency-free (just httpx, already in
requirements.txt) so this folder never has to import anything from
app/ except settings.
"""

from typing import Any

import httpx
from fastapi import HTTPException, status

from app.config import settings


async def chat_completion(
    messages: list[dict[str, str]],
    *,
    temperature: float = 0.3,
    max_tokens: int = 600,
    response_format_json: bool = False,
) -> str:
    """
    Sends a chat-completion request to Groq using the gpt-oss-20b model
    and returns the assistant's reply text.
    """
    if not settings.groq_api_key:
        raise HTTPException(
            status_code=status.HTTP_503_SERVICE_UNAVAILABLE,
            detail=(
                "GROQ_API_KEY is not configured on the server. "
                "Set it in .env to enable the AI recommender / chatbot."
            ),
        )

    body: dict[str, Any] = {
        "model": settings.groq_model,
        "messages": messages,
        "temperature": temperature,
        "max_tokens": max_tokens,
    }
    if response_format_json:
        body["response_format"] = {"type": "json_object"}

    headers = {
        "Authorization": f"Bearer {settings.groq_api_key}",
        "Content-Type": "application/json",
    }

    try:
        async with httpx.AsyncClient(timeout=30) as client:
            response = await client.post(
                f"{settings.groq_base_url}/chat/completions",
                json=body,
                headers=headers,
            )
            response.raise_for_status()
    except httpx.TimeoutException:
        raise HTTPException(
            status_code=status.HTTP_504_GATEWAY_TIMEOUT,
            detail="The LLM took too long to respond.",
        )
    except httpx.HTTPStatusError as exc:
        raise HTTPException(
            status_code=status.HTTP_502_BAD_GATEWAY,
            detail=f"Groq API error: {exc.response.status_code} — {exc.response.text[:300]}",
        )
    except httpx.RequestError:
        raise HTTPException(
            status_code=status.HTTP_502_BAD_GATEWAY,
            detail="Could not reach the Groq API.",
        )

    data = response.json()
    return data["choices"][0]["message"]["content"]
