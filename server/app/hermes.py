import os
from collections.abc import AsyncIterator
from functools import cache
from typing import Literal

import httpx
from openai import AsyncOpenAI

# Hermes always serves its configured model under this name; the real LLM is set on the VPS.
MODEL = "hermes-agent"

# An agent turn can run tools for several minutes.
TIMEOUT_SECONDS = 600


class HermesError(Exception):
    pass


# Shares one Hermes client across requests. Created on first use so the server still starts without the env vars.
@cache
def get_client() -> AsyncOpenAI:
    return AsyncOpenAI(
        base_url=os.environ["HERMES_BASE_URL"],
        api_key=os.environ["HERMES_API_KEY"],
        timeout=TIMEOUT_SECONDS,
    )


# Sends one message to the Hermes agent and returns its reply.
# Hermes keeps the history per session_id, so send only the new message. Prefix IDs (e.g. "lip-peter-1") because the team shares one Hermes.
async def ask_hermes(message: str, session_id: str | None = None) -> str:
    headers = {"X-Hermes-Session-Id": session_id} if session_id else {}
    response = await get_client().chat.completions.create(
        model=MODEL,
        messages=[{"role": "user", "content": message}],
        extra_headers=headers,
    )
    choice = response.choices[0]
    if choice.finish_reason in ("error", "cancelled"):
        raise HermesError(f"Hermes turn {choice.finish_reason}: {choice.message.content}")
    # "length" means Hermes ran out of steps; the partial answer is still usable.
    return choice.message.content or ""


# Hermes sends a keepalive every 10 seconds while it works, so this long a silence means it has stopped.
STALL_SECONDS = 120


# Streams one Hermes turn as ("reasoning" | "text", piece) pairs, so callers can show progress while the agent works.
async def stream_hermes(
    message: str, session_id: str | None = None
) -> AsyncIterator[tuple[Literal["reasoning", "text"], str]]:
    headers = {"X-Hermes-Session-Id": session_id} if session_id else {}
    stream = await get_client().chat.completions.create(
        model=MODEL,
        messages=[{"role": "user", "content": message}],
        extra_headers=headers,
        stream=True,
        timeout=httpx.Timeout(TIMEOUT_SECONDS, read=STALL_SECONDS),
    )
    async for chunk in stream:
        if not chunk.choices:
            continue
        choice = chunk.choices[0]
        # Reasoning isn't part of the OpenAI schema; Hermes sends it as an extra field on some models.
        reasoning = getattr(choice.delta, "reasoning_content", None) or getattr(choice.delta, "reasoning", None)
        if reasoning:
            yield "reasoning", reasoning
        if choice.delta.content:
            yield "text", choice.delta.content
        if choice.finish_reason in ("error", "cancelled"):
            raise HermesError(f"Hermes turn {choice.finish_reason}")
