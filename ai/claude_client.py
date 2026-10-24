"""Claude backend for llm.py. Use llm.ask() / llm.ask_json() instead of calling this directly."""

from functools import lru_cache

import anthropic

from .config import Settings
from .llm import AIError, LoadedFile

# Server-side fallback: if a safety classifier declines a benign request,
# the API re-runs it on Anthropic's recommended fallback model instead of failing.
FALLBACK_BETA = "server-side-fallback-2026-07-01"


@lru_cache(maxsize=4)
def _client(api_key: str) -> anthropic.Anthropic:
    return anthropic.Anthropic(api_key=api_key)


def _file_block(f: LoadedFile) -> dict:
    if f.kind == "pdf":
        return {"type": "document", "title": f.name,
                "source": {"type": "base64", "media_type": f.media_type, "data": f.b64}}
    if f.kind == "image":
        return {"type": "image", "source": {"type": "base64", "media_type": f.media_type, "data": f.b64}}
    return {"type": "document", "title": f.name,
            "source": {"type": "text", "media_type": "text/plain", "data": f.text}}


def send(text: str, *, files: list[LoadedFile], system: str | None, schema: dict | None,
         settings: Settings, max_tokens: int | None) -> str:
    # Files go before the text: Claude handles documents best when they come first.
    content = [_file_block(f) for f in files] + [{"type": "text", "text": text}]

    output_config: dict = {"effort": settings.effort or "medium"}
    if schema:
        output_config["format"] = {"type": "json_schema", "schema": schema}

    max_tokens = max_tokens or 64000
    params: dict = {
        "model": settings.model,
        "max_tokens": max_tokens,
        "messages": [{"role": "user", "content": content}],
        "output_config": output_config,
        "betas": [FALLBACK_BETA],
        "fallbacks": "default",
    }
    if system:
        # Cache the system prompt: repeated calls with the same system text get cheaper.
        params["system"] = [
            {"type": "text", "text": system, "cache_control": {"type": "ephemeral"}}
        ]

    try:
        # Streaming avoids HTTP timeouts on long inputs / long outputs (e.g. whole web pages).
        with _client(settings.api_key).beta.messages.stream(**params) as stream:
            response = stream.get_final_message()
    except anthropic.AuthenticationError as e:
        raise AIError("Invalid Anthropic API key - check ai/.env") from e
    except anthropic.RateLimitError as e:
        raise AIError("Rate limited by the Claude API, retry later") from e
    except anthropic.APIStatusError as e:
        raise AIError(f"Claude API error {e.status_code}: {e.message}") from e
    except anthropic.APIConnectionError as e:
        raise AIError("Could not reach the Claude API") from e

    if response.stop_reason == "refusal":
        category = response.stop_details.category if response.stop_details else None
        raise AIError(f"Request was declined (category: {category})")
    if response.stop_reason == "max_tokens":
        raise AIError(f"Output was cut off at max_tokens={max_tokens}; raise the limit")

    return "".join(block.text for block in response.content if block.type == "text")
