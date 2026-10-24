from fastapi import APIRouter
from pydantic import BaseModel, Field, field_validator

from app.scale import evaluate, item_ids, load_scale

router = APIRouter(tags=["profile"])


class Student(BaseModel):
    name: str
    stage: str = ""
    stage_detail: str = ""
    interests: str = ""


class Goal(BaseModel):
    type: str = ""
    in_their_words: str = ""


class Material(BaseModel):
    topic: str
    text: str = ""
    files: list[str] = Field(default=[], description="File names only; uploads aren't supported yet.")


class Preferences(BaseModel):
    likes_learning_with: list[str] = []
    notes: str = ""


class ProfileRequest(BaseModel):
    student: Student
    goal: Goal
    material: Material
    answers: dict[str, int] = Field(description="Survey answers by item id, from 1 to 5. Skipped items are left out.")
    preferences: Preferences = Preferences()

    @field_validator("answers")
    @classmethod
    def check_answers(cls, answers: dict[str, int]) -> dict[str, int]:
        scale = load_scale()["response_scale"]
        unknown = set(answers) - item_ids()
        if unknown:
            raise ValueError(f"Unknown survey items: {', '.join(sorted(unknown))}")
        out_of_range = [k for k, v in answers.items() if not scale["min"] <= v <= scale["max"]]
        if out_of_range:
            raise ValueError(f"Answers must be {scale['min']}-{scale['max']}: {', '.join(sorted(out_of_range))}")
        return answers


class StudentProfile(BaseModel):
    scale_version: str
    student: Student
    goal: Goal
    material: Material
    learning_instructions: dict[str, list[str]] = Field(
        description="The prompts chosen for this student, by category. Skipped categories are left out."
    )
    preferences: Preferences


# Scores the survey answers and returns the student's profile JSON: what they told us, plus only the
# instructions that apply to them. No raw answers or scores. Nothing is stored.
@router.post("/profile")
async def create_profile(request: ProfileRequest) -> StudentProfile:
    results = evaluate(request.answers)
    return StudentProfile(
        scale_version=load_scale()["version"],
        student=request.student,
        goal=request.goal,
        material=request.material,
        learning_instructions={r.id: r.ai_instructions for r in results if r.band != "unknown"},
        preferences=request.preferences,
    )
