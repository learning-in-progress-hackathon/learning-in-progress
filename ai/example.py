"""Run:  python example.py   (from ai/)   or   python ai/example.py   (from the repo root)"""

import json
import sys
from pathlib import Path

AI_DIR = Path(__file__).resolve().parent
# Make the `ai` package importable no matter which folder this is run from.
sys.path.insert(0, str(AI_DIR.parent))

from ai.forms import generate_from_form  # noqa: E402

EXAMPLES = AI_DIR / "examples"

form = json.loads((EXAMPLES / "sample_form.json").read_text(encoding="utf-8"))

# Attach a file (optional). PDF, image or text. Either a path:
form["file"] = str(EXAMPLES / "curriculum.txt")
# ...or an upload from the frontend as base64:
# form["file"] = {"name": "curriculum.pdf", "data": "<base64 string>", "media_type": "application/pdf"}

html = generate_from_form(
    form,
    input_prompt="form_to_website",      # ai/prompts/form_to_website.md
    output_template="website.html",      # ai/templates/output/website.html
)

output = AI_DIR / "output" / "website.html"
output.parent.mkdir(exist_ok=True)
output.write_text(html, encoding="utf-8")
print(f"Wrote {output}")
