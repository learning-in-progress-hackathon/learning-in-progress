from typing import Any

from fastapi import APIRouter
from pydantic import BaseModel, Field

from app.gemini import generate_json

router = APIRouter(tags=["assess"])

# Upper limit on questions per student, so the assessment always ends.
MAX_QUESTIONS = 5

SYSTEM_INSTRUCTION = f"""\
You help find out how a student learns best, so their learning material can be reshaped to fit them.
You get the student's profile (it may include challenges such as ADHD or dyslexia, goals, interests, \
and what already works for them) and the questions already answered.
Ask the single most useful next question. Keep it short and friendly, and offer 2 to 4 answer options.
Don't repeat earlier questions or ask about anything the profile already answers.
Set done to true once you know enough, or after {MAX_QUESTIONS} questions.
Write in the same language as the student profile."""


class Answer(BaseModel):
    question: str
    answer: str


class AssessRequest(BaseModel):
    profile: dict[str, Any] = Field(description="Student profile, e.g. a persona file or intake form data.")
    answers: list[Answer] = []


class NextQuestion(BaseModel):
    done: bool = Field(description="True when no more questions are needed.")
    question: str = Field(description="The next question for the student. Empty when done.")
    options: list[str] = Field(description="2 to 4 short answer options. Empty when done.")


# Returns the next question to ask the student, or done once the assessment is complete.
@router.post("/assess")
async def assess(request: AssessRequest) -> NextQuestion:
    finished = NextQuestion(done=True, question="", options=[])
    if len(request.answers) >= MAX_QUESTIONS:
        return finished

    result = await generate_json(
        prompt=request.model_dump_json(),
        schema=NextQuestion,
        system_instruction=SYSTEM_INSTRUCTION,
    )
    # Treat a missing question or options as done, so the client never gets a question it can't show.
    if result.done or not result.question.strip() or not result.options:
        return finished
    return result
