"""Function 2: parse prompt files and render them into templates.

A prompt file is Markdown with an optional frontmatter header:

    ---
    name: summarize
    system: You are a concise technical writer.
    ---
    Summarize the following for {{audience}}:

    {{text}}

Placeholders use {{name}}. Rendering fails loudly if a placeholder has no value,
so a half-filled prompt never reaches the API.

Output templates (templates/output/) work the other way round: their placeholders are
the fields Claude must produce. See output_schema() and fill_output().
"""

import html
import re
from dataclasses import dataclass, field
from pathlib import Path

from .config import AI_DIR

PROMPTS_DIR = AI_DIR / "prompts"
TEMPLATES_DIR = AI_DIR / "templates"
OUTPUT_TEMPLATES_DIR = TEMPLATES_DIR / "output"

_PLACEHOLDER = re.compile(r"\{\{\s*([a-zA-Z_][a-zA-Z0-9_]*)\s*\}\}")
_FRONTMATTER = re.compile(r"\A---\s*\n(.*?)\n---\s*\n?", re.DOTALL)
_COMMENT = re.compile(r"<!--.*?-->\s*", re.DOTALL)


@dataclass
class Prompt:
    name: str
    body: str
    meta: dict[str, str] = field(default_factory=dict)

    @property
    def variables(self) -> list[str]:
        """Placeholder names in order of first appearance."""
        return list(dict.fromkeys(_PLACEHOLDER.findall(self.body)))

    @property
    def system(self) -> str | None:
        return self.meta.get("system")

    def render(self, **values: object) -> str:
        return render(self.body, **values)


def parse_prompt(text: str, name: str = "inline") -> Prompt:
    """Split frontmatter (simple `key: value` lines) from the body."""
    meta: dict[str, str] = {}
    match = _FRONTMATTER.match(text)
    if match:
        for line in match.group(1).splitlines():
            if ":" in line and not line.lstrip().startswith("#"):
                key, value = line.split(":", 1)
                meta[key.strip()] = value.strip()
        text = text[match.end():]
    # <!-- ... --> comments are notes for whoever edits the file; they never reach Claude or the output.
    text = _COMMENT.sub("", text)
    return Prompt(name=meta.get("name", name), body=text.strip(), meta=meta)


def load_prompt(name_or_path: str | Path, directory: Path = PROMPTS_DIR) -> Prompt:
    """Load `prompts/<name>.md`, or an explicit file path."""
    path = Path(name_or_path)
    if not path.suffix:
        path = directory / f"{path}.md"
    elif not path.is_absolute() and not path.exists():
        path = directory / path
    return parse_prompt(path.read_text(encoding="utf-8"), name=path.stem)


def render(template: str, **values: object) -> str:
    """Replace every {{name}} with values[name]; raise if any are missing."""
    missing = set(_PLACEHOLDER.findall(template)) - values.keys()
    if missing:
        raise KeyError(f"Missing template values: {', '.join(sorted(missing))}")
    return _PLACEHOLDER.sub(lambda m: str(values[m.group(1)]), template)


def render_into(template_name: str, prompt: Prompt | str, **values: object) -> str:
    """Render a prompt, then place it inside a wrapper template from templates/.

    The wrapper receives the rendered prompt as {{prompt}} plus the same values,
    e.g. templates/rag.md can wrap any task prompt with retrieval instructions.
    """
    if isinstance(prompt, str):
        prompt = load_prompt(prompt)
    wrapper = load_prompt(template_name, directory=TEMPLATES_DIR)
    return wrapper.render(**values, prompt=prompt.render(**values))


# --- Output templates -------------------------------------------------------------
#
# Frontmatter keys an output template understands:
#   field.<name>: what Claude should write for {{name}}   (sent to Claude as instructions)
#   raw: name1, name2                                      (inserted without HTML escaping)


def load_output_template(name_or_path: str | Path) -> Prompt:
    """Load `templates/output/<name>` (e.g. "website.html"), or an explicit path."""
    template = load_prompt(name_or_path, directory=OUTPUT_TEMPLATES_DIR)
    # format defaults to the file extension: website.html -> "html"
    template.meta.setdefault("format", Path(name_or_path).suffix.lstrip(".") or "md")
    return template


def field_descriptions(template: Prompt) -> dict[str, str]:
    return {
        name: template.meta.get(f"field.{name}", f"Content for the '{name}' placeholder")
        for name in template.variables
    }


def output_schema(template: Prompt) -> dict:
    """JSON schema with one required string per placeholder, for structured output."""
    return {
        "type": "object",
        "properties": {
            name: {"type": "string", "description": desc}
            for name, desc in field_descriptions(template).items()
        },
        "required": template.variables,
        "additionalProperties": False,
    }


def describe_fields(template: Prompt) -> str:
    """Bullet list of the fields to fill, for embedding in the input prompt."""
    return "\n".join(f"- {name}: {desc}" for name, desc in field_descriptions(template).items())


def fill_output(template: Prompt, values: dict[str, object]) -> str:
    """Insert Claude's values into the output template.

    For .html templates every value is HTML-escaped unless its field is listed in `raw:`,
    so model output can't break the page structure by accident.
    """
    raw = {f.strip() for f in template.meta.get("raw", "").split(",") if f.strip()}
    is_html = template.meta.get("format", "").lower() == "html"
    safe = {
        k: (str(v) if not is_html or k in raw else html.escape(str(v)))
        for k, v in values.items()
    }
    return render(template.body, **safe)
