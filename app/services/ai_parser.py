"""
Azure OpenAI-powered NLP parser for RFQ free-text input.
Converts Swahili/English material requests into structured catalog matches.
"""
import json
import re
import uuid
from typing import Optional

from openai import AzureOpenAI
from sqlalchemy.ext.asyncio import AsyncSession

from app.core.config import settings
from app.repositories import catalog_repository
from app.utils.exceptions import BaseAppException



class ParseFailedError(BaseAppException):
    def __init__(self, message: str = "Could not confidently parse the input. Please try rephrasing or select a catalog item manually."):
        super().__init__(status_code=422, code="PARSE_FAILED", message=message)


def _get_client() -> AzureOpenAI:
    return AzureOpenAI(
        api_key=settings.AZURE_OPENAI_API_KEY,
        azure_endpoint=settings.AZURE_OPENAI_ENDPOINT,
        api_version=settings.AZURE_OPENAI_API_VERSION,
    )


async def parse(db: AsyncSession, raw_text: str) -> dict:
    """
    Parse raw free-text material request using Azure OpenAI GPT-4.1.
    Returns a structured dict with the top match and alternatives.
    Raises ParseFailedError if confidence is too low.
    """
    # 1. Fetch catalog items from DB as grounding context for the model
    catalog_items, _ = await catalog_repository.get_list(db, page=1, page_size=50)
    catalog_context = "\n".join(
        f'- id: {item.id} | name: "{item.name}" | category: {item.category.value} | unit: {item.unit.value}'
        for item in catalog_items
    )

    system_prompt = f"""You are a procurement assistant for a Kenyan B2B marketplace called ProcuLink.
Manufacturers (jua kali fabricators) submit material requests in English or Swahili.
Your job is to parse the request and match it to the best item in the catalog.

CATALOG (available items):
{catalog_context}

Return ONLY valid JSON with this exact structure:
{{
  "material": "<extracted material name in English>",
  "matched_catalog_item_id": "<UUID from catalog or null>",
  "matched_catalog_item_name": "<name from catalog or null>",
  "quantity": <integer or null>,
  "unit": "<one of: SHEET, PIECE, KG, BAG, METER, LITRE, or null>",
  "notes": "<any extra details like gauge, thickness, color, or null>",
  "confidence": <float 0.0-1.0>,
  "alternatives": [
    {{"catalog_item_id": "<UUID>", "catalog_item_name": "<name>", "confidence": <float>}}
  ]
}}

Rules:
- "Nahitaji" means "I need" in Swahili
- "mabati" = iron/steel sheets, "mbao" = timber/planks, "saruji" = cement
- Extract numeric quantities (e.g. "sita" = 6 in Swahili, "nne" = 4)
- confidence = 0.0 if no catalog match, 1.0 if exact match
- Return up to 3 alternatives sorted by confidence descending
- If confidence < 0.35, still return your best guess but keep confidence accurate"""

    user_message = f"Parse this material request: {raw_text}"

    try:
        client = _get_client()
        response = client.chat.completions.create(
            model=settings.AZURE_OPENAI_CHAT_DEPLOYMENT,
            messages=[
                {"role": "system", "content": system_prompt},
                {"role": "user", "content": user_message},
            ],
            temperature=0.1,
            max_tokens=600,
            response_format={"type": "json_object"},
        )
        raw_json = response.choices[0].message.content
        parsed = json.loads(raw_json)
    except json.JSONDecodeError:
        raise ParseFailedError("AI returned malformed JSON. Please try again.")
    except Exception as e:
        raise ParseFailedError(f"AI service error: {str(e)}")

    confidence = float(parsed.get("confidence", 0.0))
    if confidence < 0.35:
        raise ParseFailedError()

    # Build structured result
    matched_id = parsed.get("matched_catalog_item_id")
    alternatives = []
    for alt in parsed.get("alternatives", [])[:3]:
        try:
            alternatives.append({
                "catalog_item_id": uuid.UUID(str(alt["catalog_item_id"])),
                "catalog_item_name": alt["catalog_item_name"],
                "confidence": float(alt["confidence"]),
            })
        except (KeyError, ValueError):
            continue

    return {
        "parsed": {
            "material": parsed.get("material", ""),
            "matched_catalog_item_id": uuid.UUID(matched_id) if matched_id else None,
            "matched_catalog_item_name": parsed.get("matched_catalog_item_name"),
            "quantity": parsed.get("quantity"),
            "unit": parsed.get("unit"),
            "notes": parsed.get("notes"),
        },
        "parse_confidence": confidence,
        "alternative_matches": alternatives,
    }
