# ai/

Form JSON in → Claude → filled HTML page out.

## 1. Add your API key

1. Create a key at https://platform.claude.com → **Settings → API Keys → Create Key** (copy it, it's shown once).
2. Copy `ai/.env.example` to `ai/.env` and paste the key:
   ```
   ANTHROPIC_API_KEY=sk-ant-...
   ```

`ai/.env` is git-ignored. Never commit it or put the key in frontend code. If it leaks, revoke it in the Console.

## 2. Define your prompts

| File | What to put there |
|---|---|
| `prompts/form_to_website.md` | Instructions for Claude. `system:` in the header sets the system prompt. `{{answers}}` is replaced with the form answers. |
| `templates/output/website.html` | The page layout. Each `{{name}}` is a field Claude fills in. Describe each one in the header as `field.name: ...`. |
| `examples/sample_form.json` | A sample form input to test with. |

Text inside `<!-- -->` comments is ignored.

## 3. Run

From the `ai` folder:

```powershell
pip install -r requirements.txt
python example.py
```

The result is written to `ai/output/website.html`.
