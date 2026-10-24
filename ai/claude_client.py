"""Function 1: send input to Claude, get output back.

ask()      -> plain text
ask_json() -> dict that matches a JSON schema (used to fill output templates)

Both accept optional RAG `context` chunks and `files` (PDF, image, or text).
"""

import base64
import json
import mimetypes
from functools import lru_cache
from pathlib import Path
from typing import Sequence

import anthropic

from .config import get_settings

# Server-side fallback: if a safety classifier declines a benign request,
# the API re-runs it on Anthropic's recommended fallback model instead of failing.
FALLBACK_BETA = "server-side-fallback-2026-07-01"

IMAGE_TYPES = {"image/png", "image/jpeg", "image/gif", "image/webp"}
TEXT_SUFFIXES = {".txt", ".md", ".csv", ".json", ".html", ".xml", ".yaml", ".yml"}


class ClaudeError(RuntimeError):
    pass


@lru_cache(maxsize=1)
def _client() -> anthropic.Anthropic:
    return anthropic.Anthropic(api_key=get_settings().api_key)

def _format_context(context: Sequence[str | dict]) -> str:
    """Wrap retrieved chunks in XML tags so Claude can tell sources apart from the question.

    Each item is either a plain string or {"content": ..., "source": ...}.
    """
    docs = []
    for i, item in enumerate(context, start=1):
        if isinstance(item, str):
            item = {"content": item}
        source = item.get("source", f"doc-{i}")
        docs.append(
            f'<document index="{i}">\n<source>{source}</source>\n'
            f"<content>\n{item['content']}\n</content>\n</document>"
        )
    return "<documents>\n" + "\n".join(docs) + "\n</documents>"

def file_block(file: str | Path | dict) -> dict:
    """Turn a file into a Claude content block.

    `file` is either a path, or an uploaded file as
    {"name": "menu.pdf", "data": "<base64>", "media_type": "application/pdf"} (media_type optional).
    """
    if isinstance(file, dict):
        name = file["name"]
        raw = base64.b64decode(file["data"])
        media_type = file.get("media_type") or mimetypes.guess_type(name)[0]
    else:
        path = Path(file)
        name = path.name
        raw = path.read_bytes()
        media_type = mimetypes.guess_type(name)[0]

    if media_type == "application/pdf":
        data = base64.standard_b64encode(raw).decode()
        return {"type": "document", "title": name,
                "source": {"type": "base64", "media_type": media_type, "data": data}}
    if media_type in IMAGE_TYPES:
        data = base64.standard_b64encode(raw).decode()
        return {"type": "image", "source": {"type": "base64", "media_type": media_type, "data": data}}
    if Path(name).suffix.lower() in TEXT_SUFFIXES or (media_type or "").startswith("text/"):
        return {"type": "document", "title": name,
                "source": {"type": "text", "media_type": "text/plain", "data": raw.decode("utf-8")}}
    raise ClaudeError(f"Unsupported file type for {name!r} ({media_type}). Use PDF, image, or text.")

def _send(
    prompt: str,
    *,
    system: str | None,
    context: Sequence[str | dict] | None,
    files: Sequence[str | Path | dict] | None,
    schema: dict | None,
    model: str | None,
    effort: str | None,
    max_tokens: int,
) -> str:
    settings = get_settings()

    text = prompt if not context else f"{_format_context(context)}\n\n{prompt}"
    # Files go before the text: Claude handles documents best when they come first.
    content = [file_block(f) for f in files or []] + [{"type": "text", "text": text}]

    output_config: dict = {"effort": effort or settings.effort}
    if schema:
        output_config["format"] = {"type": "json_schema", "schema": schema}

    params: dict = {
        "model": model or settings.model,
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
        with _client().beta.messages.stream(**params) as stream:
            response = stream.get_final_message()
    except anthropic.AuthenticationError as e:
        raise ClaudeError("Invalid API key - check ai/.env") from e
    except anthropic.RateLimitError as e:
        raise ClaudeError("Rate limited by the Claude API, retry later") from e
    except anthropic.APIStatusError as e:
        raise ClaudeError(f"Claude API error {e.status_code}: {e.message}") from e
    except anthropic.APIConnectionError as e:
        raise ClaudeError("Could not reach the Claude API") from e

    if response.stop_reason == "refusal":
        category = response.stop_details.category if response.stop_details else None
        raise ClaudeError(f"Request was declined (category: {category})")
    if response.stop_reason == "max_tokens":
        raise ClaudeError(f"Output was cut off at max_tokens={max_tokens}; raise the limit")

    return "".join(block.text for block in response.content if block.type == "text")

def ask(
    prompt: str,
    *,
    system: str | None = None,
    context: Sequence[str | dict] | None = None,
    files: Sequence[str | Path | dict] | None = None,
    model: str | None = None,
    effort: str | None = None,
    max_tokens: int = 64000,
) -> str:
    """Send `prompt` to Claude and return the text response."""
    return _send(prompt, system=system, context=context, files=files, schema=None,
                 model=model, effort=effort, max_tokens=max_tokens)

def ask_json(
    prompt: str,
    schema: dict,
    *,
    system: str | None = None,
    context: Sequence[str | dict] | None = None,
    files: Sequence[str | Path | dict] | None = None,
    model: str | None = None,
    effort: str | None = None,
    max_tokens: int = 64000,
) -> dict:
    """Like ask(), but the response is guaranteed to be JSON matching `schema`."""
    text = _send(prompt, system=system, context=context, files=files, schema=schema,
                 model=model, effort=effort, max_tokens=max_tokens)
    return json.loads(text)
