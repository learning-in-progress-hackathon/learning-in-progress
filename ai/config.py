"""Loads settings from ai/.env (or the real environment) without ever exposing the key.

Which provider is used:
  1. AI_PROVIDER=claude|openai, if set
  2. otherwise detected from the key: "sk-ant-..." is Claude, anything else is OpenAI-compatible
  3. otherwise whichever of ANTHROPIC_API_KEY / OPENAI_API_KEY is the only one set

"openai" means any OpenAI-compatible API (OpenAI, OpenRouter, Groq, Gemini, Ollama, ...).
Set AI_BASE_URL to point at a provider other than OpenAI; a few are recognised from the key.
"""

import os
from dataclasses import dataclass, field
from pathlib import Path

from dotenv import load_dotenv

AI_DIR = Path(__file__).resolve().parent

# Real environment variables win over .env, so production can inject secrets directly.
load_dotenv(AI_DIR / ".env", override=False)

PROVIDERS = ("claude", "openai")
KEY_VARS = {"claude": "ANTHROPIC_API_KEY", "openai": "OPENAI_API_KEY"}
PREFIXES = {"claude": "CLAUDE", "openai": "OPENAI"}  # for CLAUDE_MODEL / OPENAI_MODEL etc.
DEFAULT_MODELS = {"claude": "claude-opus-5-5", "openai": "gpt-5"}

# OpenAI-compatible providers recognisable from their key prefix.
KNOWN_BASE_URLS = {
    "sk-or-": "https://openrouter.ai/api/v1",
    "gsk_": "https://api.groq.com/openai/v1",
    "AIza": "https://generativelanguage.googleapis.com/v1beta/openai/",
    "AQ.": "https://generativelanguage.googleapis.com/v1beta/openai/",  # newer Google AI Studio keys
}


@dataclass(frozen=True)
class Settings:
    provider: str
    # repr=False keeps the key out of print(), logs and tracebacks.
    api_key: str = field(repr=False)
    model: str
    effort: str | None = None
    base_url: str | None = None  # None = official API of the provider
    max_tokens: int | None = None


def _env(name: str) -> str:
    value = os.getenv(name, "").strip()
    return "" if "REPLACE_ME" in value else value


def detect_provider(api_key: str) -> str:
    return "claude" if api_key.startswith("sk-ant-") else "openai"


def _guess_base_url(api_key: str) -> str | None:
    return next((url for prefix, url in KNOWN_BASE_URLS.items() if api_key.startswith(prefix)), None)


def get_settings() -> Settings:
    provider = _env("AI_PROVIDER").lower() or None
    if provider and provider not in PROVIDERS:
        raise RuntimeError(f"AI_PROVIDER must be one of {PROVIDERS}, got {provider!r}")

    api_key = _env("AI_API_KEY")
    if provider:
        api_key = api_key or _env(KEY_VARS[provider])
    elif api_key:
        provider = detect_provider(api_key)
    else:
        found = {p: _env(var) for p, var in KEY_VARS.items() if _env(var)}
        if len(found) > 1:
            raise RuntimeError(
                "Both ANTHROPIC_API_KEY and OPENAI_API_KEY are set. "
                "Set AI_PROVIDER=claude or AI_PROVIDER=openai in ai/.env."
            )
        if found:
            provider, api_key = found.popitem()

    if not api_key:
        raise RuntimeError(
            "No API key found. Copy ai/.env.example to ai/.env and add your key "
            "(see ai/README.md)."
        )

    prefix = PREFIXES[provider]
    base_url = _env("AI_BASE_URL") or (_guess_base_url(api_key) if provider == "openai" else None)
    model = _env("AI_MODEL") or _env(f"{prefix}_MODEL")
    if not model:
        if base_url:
            # Model names differ per provider, so there's no safe default.
            raise RuntimeError(f"Set AI_MODEL in ai/.env to a model available at {base_url}.")
        model = DEFAULT_MODELS[provider]
    max_tokens = _env("AI_MAX_TOKENS")

    return Settings(
        provider=provider,
        api_key=api_key,
        model=model,
        effort=_env("AI_EFFORT") or _env(f"{prefix}_EFFORT") or None,
        base_url=base_url,
        max_tokens=int(max_tokens) if max_tokens else None,
    )
