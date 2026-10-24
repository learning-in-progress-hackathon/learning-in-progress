import asyncio
from types import SimpleNamespace

import pytest

from app import hermes


def fake_client(monkeypatch, content, finish_reason="stop"):
    calls = []

    async def create(**kwargs):
        calls.append(kwargs)
        message = SimpleNamespace(content=content)
        return SimpleNamespace(choices=[SimpleNamespace(message=message, finish_reason=finish_reason)])

    client = SimpleNamespace(chat=SimpleNamespace(completions=SimpleNamespace(create=create)))
    monkeypatch.setattr(hermes, "get_client", lambda: client)
    return calls


def test_ask_hermes_sends_only_the_new_message_with_session(monkeypatch):
    calls = fake_client(monkeypatch, "API_OK")

    reply = asyncio.run(hermes.ask_hermes("Reply with exactly: API_OK", session_id="lip-test-1"))

    assert reply == "API_OK"
    assert calls[0]["model"] == "hermes-agent"
    assert calls[0]["messages"] == [{"role": "user", "content": "Reply with exactly: API_OK"}]
    assert calls[0]["extra_headers"] == {"X-Hermes-Session-Id": "lip-test-1"}


def test_ask_hermes_sends_no_session_header_without_session(monkeypatch):
    calls = fake_client(monkeypatch, "Hi")

    asyncio.run(hermes.ask_hermes("Hello"))

    assert calls[0]["extra_headers"] == {}


def test_ask_hermes_returns_partial_answer_when_out_of_steps(monkeypatch):
    fake_client(monkeypatch, "Partial answer", finish_reason="length")

    assert asyncio.run(hermes.ask_hermes("Hello")) == "Partial answer"


@pytest.mark.parametrize("finish_reason", ["error", "cancelled"])
def test_ask_hermes_raises_on_failed_turn(monkeypatch, finish_reason):
    fake_client(monkeypatch, "Tool crashed", finish_reason=finish_reason)

    with pytest.raises(hermes.HermesError, match=f"Hermes turn {finish_reason}: Tool crashed"):
        asyncio.run(hermes.ask_hermes("Hello"))


def fake_stream_client(monkeypatch, chunks):
    calls = []

    async def create(**kwargs):
        calls.append(kwargs)

        async def stream():
            for chunk in chunks:
                yield chunk

        return stream()

    client = SimpleNamespace(chat=SimpleNamespace(completions=SimpleNamespace(create=create)))
    monkeypatch.setattr(hermes, "get_client", lambda: client)
    return calls


def chunk(content=None, reasoning=None, finish_reason=None):
    delta = SimpleNamespace(content=content, reasoning_content=reasoning)
    return SimpleNamespace(choices=[SimpleNamespace(delta=delta, finish_reason=finish_reason)])


async def collect(stream):
    return [piece async for piece in stream]


def test_stream_hermes_yields_reasoning_and_text(monkeypatch):
    calls = fake_stream_client(
        monkeypatch,
        [chunk(reasoning="Hmm"), SimpleNamespace(choices=[]), chunk(content="<!doctype"), chunk(finish_reason="stop")],
    )

    pieces = asyncio.run(collect(hermes.stream_hermes("Build", session_id="lip-test-1")))

    assert pieces == [("reasoning", "Hmm"), ("text", "<!doctype")]
    assert calls[0]["stream"] is True
    assert calls[0]["extra_headers"] == {"X-Hermes-Session-Id": "lip-test-1"}


def test_stream_hermes_raises_on_failed_turn(monkeypatch):
    fake_stream_client(monkeypatch, [chunk(content="Partial"), chunk(finish_reason="error")])

    with pytest.raises(hermes.HermesError, match="Hermes turn error"):
        asyncio.run(collect(hermes.stream_hermes("Build")))
