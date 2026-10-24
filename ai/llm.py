"""Function 1: send input to the AI, get output back. Works with Claude or OpenAI.

ask()      -> plain text
ask_json() -> dict that matches a JSON schema (used to fill output templates)

Both accept optional RAG `context` chunks and `files` (PDF, image, or text).
The provider is picked from ai/.env, see config.py. Anything that isn't Claude
goes through the OpenAI-compatible Chat Completions API.
"""

import base64
import json
import mimetypes
from dataclasses import dataclass
from pathlib import Path
from typing import Sequence

from .config import Settings, get_settings

IMAGE_TYPES = {"image/png", "image/jpeg", "image/gif", "image/webp"}
TEXT_SUFFIXES = {".txt", ".md", ".csv", ".json", ".html", ".xml", ".yaml", ".yml"}

FileInput = str | Path | dict


class AIError(RuntimeError):
    pass


@dataclass
class LoadedFile:
    name: str
    raw: bytes
    media_type: str
    kind: str  # "pdf" | "image" | "text"

    @property
    def b64(self) -> str:
        return base64.standard_b64encode(self.raw).decode()

    @property
    def text(self) -> str:
        return self.raw.decode("utf-8")


def load_file(file: FileInput) -> LoadedFile:
    """Read a file given as a path, or as an upload
    {"name": "notes.pdf", "data": "<base64>", "media_type": "application/pdf"} (media_type optional).
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
        return LoadedFile(name, raw, media_type, "pdf")
    if media_type in IMAGE_TYPES:
        return LoadedFile(name, raw, media_type, "image")
    if Path(name).suffix.lower() in TEXT_SUFFIXES or (media_type or "").startswith("text/"):
        return LoadedFile(name, raw, "text/plain", "text")
    raise AIError(f"Unsupported file type for {name!r} ({media_type}). Use PDF, image, or text.")


def format_context(context: Sequence[str | dict]) -> str:
    """Wrap retrieved chunks in XML tags so the model can tell sources apart from the question.

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


def _send(prompt: str, *, context, files, schema, system, settings: Settings | None,
          max_tokens: int | None) -> str:
    settings = settings or get_settings()
    # None = provider default (Claude: 64000; OpenAI-compatible: the model's own limit).
    max_tokens = max_tokens or settings.max_tokens
    text = prompt if not context else f"{format_context(context)}\n\n{prompt}"
    loaded = [load_file(f) for f in files or []]

    # Imported lazily so the other provider's SDK doesn't need to be installed.
    if settings.provider == "claude":
        from .claude_client import send
    else:
        from .openai_client import send
    return send(text, files=loaded, system=system, schema=schema,
                settings=settings, max_tokens=max_tokens)


def ask(
    prompt: str,
    *,
    system: str | None = None,
    context: Sequence[str | dict] | None = None,
    files: Sequence[FileInput] | None = None,
    settings: Settings | None = None,
    max_tokens: int | None = None,
) -> str:
    """Send `prompt` and return the text response."""
    return _send(prompt, context=context, files=files, schema=None, system=system,
                 settings=settings, max_tokens=max_tokens)


def ask_json(
    prompt: str,
    schema: dict,
    *,
    system: str | None = None,
    context: Sequence[str | dict] | None = None,
    files: Sequence[FileInput] | None = None,
    settings: Settings | None = None,
    max_tokens: int | None = None,
) -> dict:
    """Like ask(), but the response is guaranteed to be JSON matching `schema`."""
    text = _send(prompt, context=context, files=files, schema=schema, system=system,
                 settings=settings, max_tokens=max_tokens)
    # Claude and OpenAI enforce the schema; some OpenAI-compatible models only follow it loosely.
    try:
        data = json.loads(text)
    except json.JSONDecodeError as e:
        raise AIError(f"Model did not return valid JSON: {text[:200]!r}") from e
    missing = set(schema.get("required", [])) - set(data) if isinstance(data, dict) else {"(object)"}
    if missing:
        raise AIError(f"Model's JSON is missing fields: {', '.join(sorted(missing))}")
    return data
