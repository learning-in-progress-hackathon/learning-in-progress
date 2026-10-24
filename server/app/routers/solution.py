import asyncio
import json
import logging
import time
import uuid
from pathlib import Path
from typing import Any

import openai
from fastapi import APIRouter, HTTPException
from openai import OpenAIError
from pydantic import BaseModel, Field

from app import hermes

router = APIRouter(tags=["solution"])

logger = logging.getLogger("uvicorn.error")

# Rules for the page Hermes writes; the {{...}} placeholders are filled with the student's data.
PROMPT = (Path(__file__).parent.parent / "prompts" / "generate_solution_page.txt").read_text(encoding="utf-8")

# The React app that receives the generated files, seen from the repo root on this server.
# Only used to verify the file after the run; the prompt itself uses a repo-relative path
# so Hermes stays correct on any machine.
REPO_ROOT = Path(__file__).parents[3]
GENERATED_DIR = REPO_ROOT / "client" / "src" / "features" / "application" / "generated"

# Upper limit for one generation, even if Hermes keeps sending keepalives.
SOLUTION_TIMEOUT_SECONDS = 900


class SolutionRequest(BaseModel):
    profile: dict[str, Any] = Field(description="The student's profile JSON, as returned by POST /api/profile.")


class SolutionReply(BaseModel):
    url: str


def fill_prompt(request: SolutionRequest, file_name: str) -> str:
    return (
        PROMPT.replace("{{FILE_NAME}}", file_name)
        .replace("{{PROFILE}}", json.dumps(request.profile, ensure_ascii=False, indent=2))
    )


# Has Hermes write the Solution Page as a React component and returns the URL it is served at.
@router.post("/solution")
async def create_solution(request: SolutionRequest) -> SolutionReply:
    page_id = uuid.uuid4()
    file_name = f"{page_id}.tsx"
    target = GENERATED_DIR / file_name
    started = time.monotonic()

    GENERATED_DIR.mkdir(parents=True, exist_ok=True)
    if target.exists():  # practically impossible with a fresh uuid
        raise HTTPException(status_code=500, detail="Could not allocate a page id")

    try:
        async with asyncio.timeout(SOLUTION_TIMEOUT_SECONDS):
            await hermes.ask_hermes(
                fill_prompt(request, file_name),
                session_id=f"lip-solution-{page_id}",
            )
    except TimeoutError:
        logger.warning("Solution generation timed out after %.0fs", time.monotonic() - started)
        raise HTTPException(status_code=504, detail="Hermes took too long. Try again.")
    except openai.AuthenticationError:
        # Not retryable: the HERMES_API_KEY in server/.env was rejected by the Hermes gateway.
        logger.error("Hermes rejected the API key — check HERMES_API_KEY in server/.env")
        raise HTTPException(
            status_code=502,
            detail="Hermes rejected our API key. The server's HERMES_API_KEY needs to be updated.",
        )
    except (hermes.HermesError, OpenAIError):
        logger.exception("Solution generation failed after %.0fs", time.monotonic() - started)
        raise HTTPException(status_code=502, detail="Hermes stopped responding. Try again.")

    if not target.exists():
        logger.warning("Hermes did not create %s", target)
        raise HTTPException(status_code=502, detail="Hermes did not create the page. Try again.")

    logger.info("Solution page %s.tsx written in %.0fs", page_id, time.monotonic() - started)
    return SolutionReply(url=f"/solution/{page_id}")
