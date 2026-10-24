"""OpenAI-compatible backend for llm.py. Use llm.ask() / llm.ask_json() instead of calling this directly.

Uses the Chat Completions API (/v1/chat/completions), the format that OpenAI-compatible
providers (OpenRouter, Groq, Gemini, Ollama, LM Studio, ...) implement. Point it at one
with AI_BASE_URL.
"""

import json
from functools import lru_cache

import openai

from .config import Settings
from .llm import AIError, LoadedFile


@lru_cache(maxsize=4)
def _client(api_key: str, base_url: str | None) -> openai.OpenAI:
    return openai.OpenAI(api_key=api_key, base_url=base_url)


def _file_part(f: LoadedFile) -> dict:
    if f.kind == "pdf":
        # Supported by OpenAI and OpenRouter; other providers may reject PDFs.
        return {"type": "file", "file": {"filename": f.name,
                                         "file_data": f"data:{f.media_type};base64,{f.b64}"}}
    if f.kind == "image":
        return {"type": "image_url", "image_url": {"url": f"data:{f.media_type};base64,{f.b64}"}}
    return {"type": "text", "text": f'<file name="{f.name}">\n{f.text}\n</file>'}


def _schema_instructions(schema: dict) -> str:
    return ("Respond with only a JSON object (no markdown, no extra text) matching this JSON schema:\n"
            + json.dumps(schema, indent=2))


def _strip_fences(text: str) -> str:
    """Some models wrap JSON in ```json fences even when asked not to."""
    text = text.strip()
    if text.startswith("```"):
        text = text.split("\n", 1)[1] if "\n" in text else ""
        text = text.rsplit("```", 1)[0]
    return text.strip()


def _create(client: openai.OpenAI, params: dict):
    try:
        return client.chat.completions.create(**params)
    except openai.AuthenticationError as e:
        raise AIError(f"API key rejected by {client.base_url} - check ai/.env ({e.message})") from e
    except openai.RateLimitError as e:
        # OpenAI uses 429 both for real rate limits and for an account with no credit.
        if e.code == "insufficient_quota":
            raise AIError("Account has no credit left - add billing with your provider") from e
        raise AIError(f"Rate limited, retry later ({e.message})") from e
    except openai.APIConnectionError as e:
        raise AIError("Could not reach the API - check AI_BASE_URL") from e


def send(text: str, *, files: list[LoadedFile], system: str | None, schema: dict | None,
         settings: Settings, max_tokens: int | None) -> str:
    content = [_file_part(f) for f in files] + [{"type": "text", "text": text}]
    messages = ([{"role": "system", "content": system}] if system else []) + [
        {"role": "user", "content": content}
    ]

    params: dict = {"model": settings.model, "messages": messages}
    if max_tokens:
        params["max_tokens"] = max_tokens
    if settings.effort:
        # Only reasoning models accept this, so it's sent only when AI_EFFORT is set.
        params["reasoning_effort"] = settings.effort
    if schema:
        params["response_format"] = {
            "type": "json_schema",
            "json_schema": {"name": "output", "schema": schema, "strict": True},
        }

    client = _client(settings.api_key, settings.base_url)
    try:
        response = _create(client, params)
    except openai.BadRequestError as e:
        if not schema:
            raise AIError(f"API error 400: {e.message}") from e
        # Not every compatible provider/model supports json_schema: fall back to asking
        # for JSON in the prompt, which nearly all of them handle.
        params.pop("response_format")
        params["messages"] = messages[:-1] + [{
            "role": "user",
            "content": content + [{"type": "text", "text": _schema_instructions(schema)}],
        }]
        try:
            response = _create(client, params)
        except openai.APIStatusError as e2:
            raise AIError(f"API error {e2.status_code}: {e2.message}") from e2
    except openai.APIStatusError as e:
        raise AIError(f"API error {e.status_code}: {e.message}") from e

    if not response.choices:
        raise AIError("The API returned no answer")
    choice = response.choices[0]
    if getattr(choice.message, "refusal", None):
        raise AIError(f"Request was declined: {choice.message.refusal}")
    if choice.finish_reason == "length":
        raise AIError("Output was cut off; raise AI_MAX_TOKENS or use a model with longer output")

    answer = choice.message.content or ""
    return _strip_fences(answer) if schema else answer
