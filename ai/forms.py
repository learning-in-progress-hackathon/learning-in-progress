"""Form JSON in -> Claude -> filled output template out.

Expected form JSON (see examples/sample_form.json):

    {
      "form_id": "website-brief-v1",
      "answers": [
        {"id": "business_name", "question": "What is your business called?", "answer": "..."},
        ...
      ],
      "file": "path/to/logo.png"            # optional: a path, or
                                            # {"name": ..., "data": "<base64>", "media_type": ...}
    }

`answers` may also be a plain {"question": "answer"} mapping.
"""

import json
from pathlib import Path
from xml.sax.saxutils import escape

from .claude_client import ask_json
from .prompts import (
    describe_fields,
    fill_output,
    load_output_template,
    load_prompt,
    output_schema,
)


def load_form(form: dict | str | Path) -> dict:
    """Accept a dict, a JSON string, or a path to a .json file."""
    if isinstance(form, dict):
        return form
    if isinstance(form, Path) or (isinstance(form, str) and form.strip().endswith(".json")):
        return json.loads(Path(form).read_text(encoding="utf-8"))
    return json.loads(form)


def format_answers(answers: list[dict] | dict[str, str]) -> str:
    """Render answers as XML so open-text replies can't be confused with instructions."""
    if isinstance(answers, dict):
        answers = [{"question": q, "answer": a} for q, a in answers.items()]
    items = []
    for i, a in enumerate(answers, start=1):
        qid = escape(str(a.get("id", f"q{i}")), {'"': "&quot;"})
        items.append(
            f'<answer id="{qid}">\n'
            f"<question>{escape(str(a.get('question', '')))}</question>\n"
            f"<response>{escape(str(a.get('answer', '')))}</response>\n"
            f"</answer>"
        )
    return "<form_answers>\n" + "\n".join(items) + "\n</form_answers>"


def generate_from_form(
    form: dict | str | Path,
    *,
    input_prompt: str = "form_to_website",
    output_template: str = "website.html",
    **extra_values: object,
) -> str:
    """Run the whole pipeline and return the filled output template as a string.

    input_prompt:    prompts/<name>.md - what Claude is asked to do with the answers
    output_template: templates/output/<name> - its {{placeholders}} are what Claude must return
    extra_values:    any additional {{placeholders}} you add to the input prompt
    """
    form = load_form(form)
    prompt = load_prompt(input_prompt)
    template = load_output_template(output_template)

    text = prompt.render(
        form_id=form.get("form_id", "form"),
        answers=format_answers(form.get("answers", [])),
        has_file="yes" if form.get("file") else "no",
        output_fields=describe_fields(template),
        output_format=template.meta["format"],
        **extra_values,
    )
    files = [form["file"]] if form.get("file") else None

    values = ask_json(text, output_schema(template), system=prompt.system, files=files)
    return fill_output(template, values)
