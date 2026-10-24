"""Run:  python example.py   (from ai/)   or   python ai/example.py   (from the repo root)"""

import sys
from pathlib import Path

AI_DIR = Path(__file__).resolve().parent
# Make the `ai` package importable no matter which folder this is run from.
sys.path.insert(0, str(AI_DIR.parent))

from ai.forms import generate_from_form  # noqa: E402

html = generate_from_form(
    AI_DIR / "examples" / "sample_form.json",
    input_prompt="form_to_website",      # ai/prompts/form_to_website.md
    output_template="website.html",      # ai/templates/output/website.html
)

output = AI_DIR / "output" / "website.html"
output.parent.mkdir(exist_ok=True)
output.write_text(html, encoding="utf-8")
print(f"Wrote {output}")
