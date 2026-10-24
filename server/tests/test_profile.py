from fastapi.testclient import TestClient

from app.main import app
from app.scale import load_scale

client = TestClient(app)

REQUEST = {
    "student": {"name": "Peter", "stage": "School", "stage_detail": "Grade 10", "interests": "Minecraft"},
    "goal": {"type": "Finish homework", "in_their_words": ""},
    "material": {"topic": "Linear equations", "text": "", "files": []},
    "preferences": {"likes_learning_with": ["Short videos"], "notes": "Timers stress me out."},
}


def instructions(category_id, band):
    return next(c for c in load_scale()["categories"] if c["id"] == category_id)["bands"][band]["ai_instructions"]


def test_profile_returns_the_student_json_with_only_their_instructions():
    # Attention: worst answer everywhere (reversed items at 5, at2 at 1). Every other category skipped.
    answers = {"at1": 5, "at2": 1, "at3": 5, "at4": 5}

    response = client.post("/api/profile", json={**REQUEST, "answers": answers})

    assert response.status_code == 200
    assert response.json() == {
        "scale_version": load_scale()["version"],
        **REQUEST,
        "learning_instructions": {"attention": instructions("attention", "low")},
    }


def test_profile_rejects_unknown_items_and_out_of_range_answers():
    unknown = client.post("/api/profile", json={**REQUEST, "answers": {"zz1": 3}})
    out_of_range = client.post("/api/profile", json={**REQUEST, "answers": {"at1": 9}})

    assert unknown.status_code == 422
    assert out_of_range.status_code == 422
