import asyncio
import json
import logging
import re
import time
import uuid
from collections.abc import AsyncIterator
from pathlib import Path
from typing import Any

from fastapi import APIRouter
from fastapi.responses import StreamingResponse
from openai import OpenAIError
from pydantic import BaseModel, Field

from app import hermes
from app.routers.assess import Answer

router = APIRouter(tags=["build"])

# Uvicorn's logger, so build failures show up in the server terminal.
logger = logging.getLogger("uvicorn.error")

# Rules for the page Hermes writes; the {{...}} placeholders are filled with the student's data.
PROMPT = (Path(__file__).parent.parent / "prompts" / "build_page.txt").read_text(encoding="utf-8")

# Upper limit for a whole build, even if Hermes keeps sending keepalives.
BUILD_TIMEOUT_SECONDS = 900

# Blocks the generated page from loading or sending anything over the network, so it can't leak data.
CSP = (
    '<meta http-equiv="Content-Security-Policy" content="default-src \'none\'; '
    "script-src 'unsafe-inline'; style-src 'unsafe-inline'; img-src data: blob:; "
    "font-src data:; media-src data: blob:; form-action 'none'\">"
)

DOCTYPE = re.compile(r"<!doctype html[^>]*>", re.IGNORECASE)


class BuildRequest(BaseModel):
    profile: dict[str, Any] = Field(description="Student profile from the intake form.")
    answers: list[Answer] = Field(description="Answers from the assessment questions.")
    material: str = Field(min_length=1, description="The learning material, or the topic to learn.")


# Fills the prompt with the student's data.
def fill_prompt(request: BuildRequest) -> str:
    answers = [answer.model_dump() for answer in request.answers]
    return (
        PROMPT.replace("{{PROFILE}}", json.dumps(request.profile, ensure_ascii=False, indent=2))
        .replace("{{ANSWERS}}", json.dumps(answers, ensure_ascii=False, indent=2))
        .replace("{{MATERIAL}}", request.material)
    )


# Pulls the HTML document out of the reply and puts our CSP first, so it applies before any generated script runs.
def prepare_page(reply: str) -> str | None:
    start = DOCTYPE.search(reply)
    end = reply.lower().rfind("</html>")
    if not start or end < start.end():
        return None
    # The CSP goes right after the doctype; anything before the doctype would switch the page to quirks mode.
    return start.group() + CSP + reply[start.end() : end + len("</html>")]


# Turns the reply so far into a short status line for the student.
# Before the page starts, Hermes writes its tool progress as text lines; once the page starts, show how much is written.
def progress_text(reply: str) -> str:
    start = DOCTYPE.search(reply)
    if start:
        return f"Writing the page… {(len(reply) - start.start()) // 1000} KB"
    lines = [line.strip() for line in reply.splitlines() if line.strip()]
    return lines[-1][:200] if lines else "Thinking…"


def sse(event: str, data: dict[str, str]) -> str:
    return f"event: {event}\ndata: {json.dumps(data, ensure_ascii=False)}\n\n"


# Runs one build and yields server-sent events: "status" while Hermes works, then "done" with the page or "error".
async def build_events(request: BuildRequest) -> AsyncIterator[str]:
    started = time.monotonic()
    reply = ""
    status = "Sending your profile to Hermes…"
    yield sse("status", {"text": status})
    try:
        async with asyncio.timeout(BUILD_TIMEOUT_SECONDS):
            # A fresh session per build, prefixed because the team shares one Hermes.
            async for kind, piece in hermes.stream_hermes(fill_prompt(request), session_id=f"lip-build-{uuid.uuid4()}"):
                if kind == "text":
                    reply += piece
                new_status = "Thinking…" if kind == "reasoning" else progress_text(reply)
                if new_status != status:
                    status = new_status
                    yield sse("status", {"text": status})
    except TimeoutError:
        logger.warning("Build timed out after %.0fs", time.monotonic() - started)
        yield sse("error", {"message": "Hermes took too long. Try again."})
        return
    except (hermes.HermesError, OpenAIError):
        logger.exception("Build failed after %.0fs", time.monotonic() - started)
        yield sse("error", {"message": "Hermes stopped responding. Try again."})
        return

    html = prepare_page(reply)
    if html is None:
        # Logs only the size, because the reply can repeat the student's needs data.
        logger.warning("Build returned no page (%d characters)", len(reply))
        yield sse("error", {"message": "Hermes did not return a page. Try again."})
        return
    logger.info("Build done in %.0fs, %d KB", time.monotonic() - started, len(html) // 1000)
    yield sse("done", {"html": html})


# Asks Hermes to research, design and write a learning page for the student, streaming progress while it works.
@router.post("/build")
async def build(request: BuildRequest) -> StreamingResponse:
    return StreamingResponse(build_events(request), media_type="text/event-stream", headers={"Cache-Control": "no-cache"})
