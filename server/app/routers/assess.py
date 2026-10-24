import asyncio
import logging
import uuid
from collections.abc import AsyncIterator
from typing import Any, Self

from fastapi import APIRouter
from fastapi.responses import StreamingResponse
from openai import OpenAIError
from pydantic import BaseModel, Field, model_validator

from app import hermes, themes
from app.sse import TextBatch, sse

router = APIRouter(tags=["assess"])

# Uvicorn's logger, so assessment failures show up in the server terminal.
logger = logging.getLogger("uvicorn.error")

# Upper limit on questions per student, so the assessment always ends.
MAX_QUESTIONS = 5

# Upper limit for one question, including a retry, even if Hermes keeps sending keepalives.
ASSESS_TIMEOUT_SECONDS = 300

# Sends a progress update every this many tokens, so the client isn't flooded with events.
TOKENS_PER_UPDATE = 20

STATUS = "Thinking about your answers…"

THEME_SUMMARIES = "\n".join(themes.summary(name) for name in themes.THEMES)

INSTRUCTIONS = f"""\
You help find out how a student learns best, so their learning material can be reshaped to fit them.
You get the student's profile (it may include challenges such as ADHD or dyslexia, goals, interests, and \
learning_instructions chosen by a learning survey) and the questions already answered.
Find out what already helps them learn (e.g. formats, feedback, pace), unless their profile or answers already show it.
Ask the single most useful next question. Keep it short and friendly, and offer 2 to 4 answer options.
Don't repeat earlier questions or ask about anything the profile already answers.
Set done to true once you know enough, or after {MAX_QUESTIONS} questions.
When done, pick the 1 to 3 themes below that fit this student best, best first. Use only these theme names. \
Give each one short reason, addressed to the student, based on what they told you.
Write in the same language as the student profile.
Don't use any tools; answer only from the student data.

Themes:
{THEME_SUMMARIES}"""

# Added to the message once the question limit is reached, so Hermes ends the assessment with themes.
LAST_TURN = "This is the last turn: set done to true and pick the themes."

class Answer(BaseModel):
    question: str
    answer: str


class AssessRequest(BaseModel):
    profile: dict[str, Any] = Field(description="Student profile, e.g. a persona file or intake form data.")
    answers: list[Answer] = []


class ThemePick(BaseModel):
    theme: themes.ThemeName = Field(description="One of the theme names listed in the instructions.")
    reason: str = Field(description="One short sentence, addressed to the student, on why this theme fits them.")


class NextQuestion(BaseModel):
    done: bool = Field(description="True when no more questions are needed.")
    question: str = Field(description="The next question for the student. Empty when done.")
    options: list[str] = Field(description="2 to 4 short answer options. Empty when done.")
    themes: list[ThemePick] = Field(
        default=[], description="When done: the 1 to 3 best themes for this student, best first. Empty otherwise."
    )

    # Rejects a finished reply without a usable theme pick, so Hermes gets asked again.
    @model_validator(mode="after")
    def check_themes(self) -> Self:
        names = [pick.theme for pick in self.themes]
        if self.done and not 1 <= len(names) <= 3:
            raise ValueError("when done is true, themes must list 1 to 3 themes")
        if len(set(names)) != len(names):
            raise ValueError("themes must not repeat")
        return self


# Ends the assessment with Hermes's theme picks, or the default theme when there are none.
def finished(picks: list[ThemePick]) -> NextQuestion:
    picks = picks or [ThemePick(theme=themes.DEFAULT_THEME, reason="")]
    return NextQuestion(done=True, question="", options=[], themes=picks)


# Asks Hermes for the next question and yields server-sent events: "status" with a token count and "reasoning"
# (Hermes thinking, in chunks) while it works, then "done" or "error".
async def assess_events(request: AssessRequest) -> AsyncIterator[str]:
    last_turn = len(request.answers) >= MAX_QUESTIONS
    message = f"Student data:\n{request.model_dump_json()}"
    if last_turn:
        message += f"\n\n{LAST_TURN}"

    yield sse("status", {"text": STATUS})
    reasoning = TextBatch()
    try:
        async with asyncio.timeout(ASSESS_TIMEOUT_SECONDS):
            async for kind, value in hermes.stream_hermes_json(
                message,
                schema=NextQuestion,
                instructions=INSTRUCTIONS,
                # A fresh session per question, prefixed because the team shares one Hermes.
                session_id=f"lip-assess-{uuid.uuid4()}",
            ):
                if kind == "reasoning" and (text := reasoning.add(value)):
                    yield sse("reasoning", {"text": text})
                if kind == "tokens" and value % TOKENS_PER_UPDATE == 0:
                    yield sse("status", {"text": f"{STATUS} ~{value} tokens"})
                if kind == "result":
                    result = value
        if text := reasoning.flush():
            yield sse("reasoning", {"text": text})
    except TimeoutError:
        logger.warning("Assess timed out")
        yield sse("error", {"message": "Hermes took too long. Try again."})
        return
    except (hermes.HermesError, OpenAIError):
        # Logs no details, because the reply can repeat the student's needs data.
        logger.warning("Assess failed")
        yield sse("error", {"message": "Hermes didn't answer. Try again."})
        return

    # Ask the question only if it's complete and allowed; otherwise end, so the client never gets a question it can't show.
    if not last_turn and not result.done and result.question.strip() and result.options:
        yield sse("done", result.model_copy(update={"themes": []}).model_dump())
    else:
        yield sse("done", finished(result.themes).model_dump())


# Streams the next question to ask the student, or done with the picked themes once the assessment is complete.
@router.post("/assess")
async def assess(request: AssessRequest) -> StreamingResponse:
    return StreamingResponse(assess_events(request), media_type="text/event-stream", headers={"Cache-Control": "no-cache"})
