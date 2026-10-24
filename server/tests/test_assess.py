from fastapi.testclient import TestClient

from app.main import app
from app.routers import assess

client = TestClient(app)

PROFILE = {"name": "Peter", "needs": ["ADHD"]}

def test_assess_returns_question_from_gemini(monkeypatch):
    async def fake_generate_json(prompt, schema, system_instruction=None):
        assert "Peter" in prompt
        return schema(done=False, question="Do you prefer listening or reading?", options=["Listening", "Reading"])

    monkeypatch.setattr(assess, "generate_json", fake_generate_json)

    response = client.post("/api/assess", json={"profile": PROFILE, "answers": []})

    assert response.status_code == 200
    assert response.json() == {
        "done": False,
        "question": "Do you prefer listening or reading?",
        "options": ["Listening", "Reading"],
    }


def test_assess_stops_after_max_questions_without_calling_gemini(monkeypatch):
    async def fail_generate_json(*args, **kwargs):
        raise AssertionError("Gemini should not be called")

    monkeypatch.setattr(assess, "generate_json", fail_generate_json)
    answers = [{"question": f"Q{i}", "answer": "A"} for i in range(assess.MAX_QUESTIONS)]

    response = client.post("/api/assess", json={"profile": PROFILE, "answers": answers})

    assert response.json() == {"done": True, "question": "", "options": []}


def test_assess_sends_previous_answers_to_gemini(monkeypatch):
    async def fake_generate_json(prompt, schema, system_instruction=None):
        assert "Do you prefer listening or reading?" in prompt
        assert "Listening" in prompt
        return schema(done=True, question="", options=[])

    monkeypatch.setattr(assess, "generate_json", fake_generate_json)
    answers = [{"question": "Do you prefer listening or reading?", "answer": "Listening"}]

    response = client.post("/api/assess", json={"profile": PROFILE, "answers": answers})

    assert response.json() == {"done": True, "question": "", "options": []}


def test_assess_treats_incomplete_gemini_question_as_done(monkeypatch):
    replies = [
        {"done": False, "question": "", "options": ["A", "B"]},
        {"done": False, "question": "Pick one?", "options": []},
        {"done": True, "question": "Leftover?", "options": ["A", "B"]},
    ]

    for reply in replies:
        async def fake_generate_json(prompt, schema, system_instruction=None, reply=reply):
            return schema(**reply)

        monkeypatch.setattr(assess, "generate_json", fake_generate_json)

        response = client.post("/api/assess", json={"profile": PROFILE, "answers": []})

        assert response.json() == {"done": True, "question": "", "options": []}


def test_assess_rejects_request_without_profile():
    response = client.post("/api/assess", json={"answers": []})

    assert response.status_code == 422
