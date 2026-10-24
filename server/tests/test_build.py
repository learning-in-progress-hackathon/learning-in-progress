import json

import httpx
from fastapi.testclient import TestClient
from openai import APIConnectionError

from app import hermes
from app.main import app
from app.routers import build

client = TestClient(app)

PAGE = "<!DOCTYPE html><html><body><h1>Osmose</h1></body></html>"
REQUEST = {
    "profile": {"name": "Peter", "challenges": ["ADHD"], "interests": ["Minecraft"]},
    "answers": [{"question": "Reading or doing?", "answer": "Doing"}],
    "material": "Osmose ist die Diffusion von Wasser durch eine Membran.",
}


def fake_stream(monkeypatch, pieces, error=None):
    calls = []

    async def stream_hermes(message, session_id=None):
        calls.append({"message": message, "session_id": session_id})
        for piece in pieces:
            yield piece
        if error:
            raise error

    monkeypatch.setattr(build.hermes, "stream_hermes", stream_hermes)
    return calls


# Posts a build and returns its server-sent events as (event, data) pairs.
def events():
    response = client.post("/api/build", json=REQUEST)
    assert response.headers["content-type"].startswith("text/event-stream")
    parsed = []
    for block in response.text.strip().split("\n\n"):
        event, data = block.split("\n")
        parsed.append((event.removeprefix("event: "), json.loads(data.removeprefix("data: "))))
    return parsed


def test_build_streams_progress_then_page_with_csp(monkeypatch):
    fake_stream(
        monkeypatch,
        [("reasoning", "Let me think"), ("text", "🔍 web_search: ADHD learning\n"), ("text", PAGE)],
    )

    assert events() == [
        ("status", {"text": "Sending your profile to Hermes…"}),
        ("status", {"text": "Thinking…"}),
        ("status", {"text": "🔍 web_search: ADHD learning"}),
        ("status", {"text": "Writing the page… 0 KB"}),
        ("done", {"html": "<!DOCTYPE html>" + build.CSP + "<html><body><h1>Osmose</h1></body></html>"}),
    ]


def test_build_sends_status_only_when_it_changes(monkeypatch):
    fake_stream(monkeypatch, [("reasoning", "a"), ("reasoning", "b"), ("text", PAGE)])

    statuses = [data["text"] for event, data in events() if event == "status"]

    assert statuses.count("Thinking…") == 1


def test_build_puts_profile_answers_and_material_into_prompt(monkeypatch):
    calls = fake_stream(monkeypatch, [("text", PAGE)])

    events()

    prompt = calls[0]["message"]
    assert '"challenges": [\n    "ADHD"\n  ]' in prompt
    assert '"answer": "Doing"' in prompt
    assert "<material>\nOsmose ist die Diffusion von Wasser durch eine Membran.\n</material>" in prompt
    assert "{{" not in prompt


def test_build_starts_a_new_prefixed_session_each_time(monkeypatch):
    calls = fake_stream(monkeypatch, [("text", PAGE)])

    events()
    events()

    assert calls[0]["session_id"].startswith("lip-build-")
    assert calls[0]["session_id"] != calls[1]["session_id"]


def test_build_strips_text_and_fences_around_page(monkeypatch):
    fake_stream(monkeypatch, [("text", f"Here is your page:\n```html\n{PAGE}\n```\nEnjoy!")])

    event, data = events()[-1]

    assert event == "done"
    assert data["html"].startswith("<!DOCTYPE html>")
    assert data["html"].endswith("</html>")


def test_build_reports_reply_without_page(monkeypatch):
    fake_stream(monkeypatch, [("text", "Sorry, I hit a rate limit.")])

    assert events()[-1] == ("error", {"message": "Hermes did not return a page. Try again."})


def test_build_reports_hermes_failure(monkeypatch):
    fake_stream(
        monkeypatch,
        [("text", "Working")],
        error=APIConnectionError(request=httpx.Request("POST", "http://hermes")),
    )

    assert events()[-1] == ("error", {"message": "Hermes stopped responding. Try again."})


def test_build_reports_failed_hermes_turn(monkeypatch):
    fake_stream(monkeypatch, [], error=hermes.HermesError("Hermes turn error"))

    assert events()[-1] == ("error", {"message": "Hermes stopped responding. Try again."})


def test_build_rejects_empty_material():
    response = client.post("/api/build", json={**REQUEST, "material": ""})

    assert response.status_code == 422
