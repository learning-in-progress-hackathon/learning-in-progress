"""Loads settings from ai/.env (or the real environment) without ever exposing the key."""

import os
from dataclasses import dataclass, field
from pathlib import Path

from dotenv import load_dotenv

AI_DIR = Path(__file__).resolve().parent

# Real environment variables win over .env, so production can inject secrets directly.
load_dotenv(AI_DIR / ".env", override=False)


@dataclass(frozen=True)
class Settings:
    # repr=False keeps the key out of print(), logs and tracebacks.
    api_key: str = field(repr=False)
    model: str = "claude-opus-5-5"
    effort: str = "medium"


def get_settings() -> Settings:
    api_key = os.getenv("ANTHROPIC_API_KEY", "").strip()
    if not api_key or "REPLACE_ME" in api_key:
        raise RuntimeError(
            "ANTHROPIC_API_KEY is not set. Copy ai/.env.example to ai/.env and add your key "
            "(see ai/README.md)."
        )
    return Settings(
        api_key=api_key,
        model=os.getenv("CLAUDE_MODEL", "claude-opus-5-5"),
        effort=os.getenv("CLAUDE_EFFORT", "medium"),
    )
