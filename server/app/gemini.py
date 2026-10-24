from functools import cache

from google import genai
from pydantic import BaseModel

# Default text model for every Gemini call; see https://ai.google.dev/gemini-api/docs/models for current IDs.
MODEL = "gemini-3.8-flash"


# Shares one Gemini client across requests. Created on first use so the server still starts without an API key.
@cache
def get_client() -> genai.Client:
    # Reads GEMINI_API_KEY from the environment.
    return genai.Client()


# Asks Gemini for a reply that matches `schema` and returns it as that Pydantic model.
async def generate_json[T: BaseModel](prompt: str, schema: type[T], system_instruction: str | None = None) -> T:
    options = {"system_instruction": system_instruction} if system_instruction else {}
    interaction = await get_client().aio.interactions.create(
        model=MODEL,
        input=prompt,
        response_format={
            "type": "text",
            "mime_type": "application/json",
            "schema": schema.model_json_schema(),
        },
        **options,
    )
    return schema.model_validate_json(interaction.output_text)
