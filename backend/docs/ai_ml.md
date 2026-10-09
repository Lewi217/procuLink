Version: 1.0 (Draft)
Scope: NLP RFQ parsing module — the platform's AI/ML component
Approach: Pretrained LLM integration via prompt engineering. **No model is trained and no dataset is collected for training in this project.** See "Why there's no training" below before reading further.

## Table of Contents

- [Why there's no training](#why-theres-no-training)
- [Pipeline overview](#pipeline-overview)
- [Requirements](#requirements)
- [1. Prompt design & structured output](#1-prompt-design--structured-output)
- [2. Fuzzy catalog matching](#2-fuzzy-catalog-matching)
- [3. Fallback parser](#3-fallback-parser)
- [4. Confidence scoring](#4-confidence-scoring)
- [5. Internal service contract](#5-internal-service-contract)
- [6. Evaluation methodology](#6-evaluation-methodology)
- [Known limitations](#known-limitations)
- [Error Codes Reference](#error-codes-reference)

## Why there's no training

Training a model requires labeled data at scale (thousands of examples) and produces a set of learned weights you can point to as "the model." This project has neither:

- There is no historical corpus of real RFQ messages to draw from — the platform doesn't exist yet, so no training data exists to collect.
- Fabricating a large synthetic dataset and training on it would produce accuracy numbers that don't reflect real-world performance, and presenting them as if they did would misrepresent the system to examiners.

Instead, this module integrates a **pretrained** LLM (already trained by its provider on a huge general corpus) and adapts it to this specific task through **prompt engineering** — instructions and examples given at request time, not weight updates. This is a legitimate, industry-standard technique (it's how most production LLM features are actually built), but it must be described accurately: nothing here is "trained," and no dataset was acquired or labeled for that purpose. A small hand-written example set is used, but only inside the prompt and inside a separate evaluation set — never as training data.

## Pipeline overview

```
Raw text/voice input
        │
        ▼
 LLM extraction (few-shot prompted, structured output)
        │
        ▼
 Fuzzy match against catalog ──► matched item + confidence
        │
        ▼
 Confidence check ──► low confidence? → surface alternatives / ask user to confirm
        │
        ▼
 Structured RFQ draft returned to POST /api/rfq/parse
```

If the LLM API is unreachable, the pipeline falls back to a regex/keyword parser (see Module 3) so the system degrades instead of failing outright.

## Requirements

| Need | Purpose |
|---|---|
| LLM API account (Claude or OpenAI), billing enabled | The only "model" in this module — pretrained, called via API |
| Python 3.11+ environment | Hosts the parsing service |
| `anthropic` or `openai` SDK | LLM API calls |
| `pydantic` | Validates the LLM's structured output against our schema |
| `rapidfuzz` | Fuzzy string matching against catalog item names |
| `re` (standard library) | Fallback keyword/pattern parser |
| Hand-written few-shot example set (10–20 examples) | Goes inside the prompt, not a training run |
| Hand-labeled evaluation set (50–100 examples) | Used only for testing/scoring, never sent to the model as training data |
| Read access to `CatalogItem` table | Fuzzy matching needs real catalog data to match against |

## 1. Prompt design & structured output

The LLM is called with a system prompt fixing its role and output format, plus a handful of few-shot examples covering English, Swahili, and Sheng phrasing. The response is requested as JSON matching a fixed schema (via structured output / tool-use / function-calling, depending on provider) so the service never has to parse free text out of the model's reply.

**Output schema (Pydantic model):**

```python
class ParsedRFQ(BaseModel):
    material: str
    quantity: float
    unit: str
    notes: str | None = None
    confidence: float  # 0.0–1.0, model's own self-estimate
```

**Example few-shot pair (one of several included in the prompt):**

```
Input: "Nahitaji mabati sita nzito na hinges nne kwa job ya gate"
Output: {
  "material": "corrugated iron sheets",
  "quantity": 6,
  "unit": "sheet",
  "notes": "heavy gauge; also needs 4 hinges",
  "confidence": 0.9
}
```

The prompt explicitly instructs the model to lower its `confidence` value when quantity, unit, or material is ambiguous, rather than guessing silently — this is what feeds Module 4.

## 2. Fuzzy catalog matching

The LLM's `material` string is free text and won't exactly match catalog item names (`"mabati"` vs `"Mild steel sheets, 3mm"`). `rapidfuzz` scores the extracted material against every `CatalogItem.name` (scoped to the relevant `category` when the LLM also infers one) and returns the best match plus a similarity score. This step is plain string-similarity math — not machine learning, and not something that requires any data beyond the catalog itself.

```python
from rapidfuzz import process

match, score, catalog_id = process.extractOne(
    parsed.material, catalog_names, score_cutoff=60
)
```

A match below the cutoff is treated as "no confident match" and returned to the client as `alternativeMatches` instead of a single resolved item (see `POST /api/rfq/parse` in the backend doc).

## 3. Fallback parser

A small set of hand-written regex/keyword rules covers the most common, simplest phrasings (e.g. `"<number> <unit-word> of <material-keyword>"`) for use when the LLM API is unreachable or times out. It is deliberately narrow — it exists so the system degrades gracefully, not to replace the LLM. This is straightforward pattern matching, with no learning component.

## 4. Confidence scoring

Final confidence returned to the client combines two signals, not just the model's self-report:

```python
final_confidence = min(llm_confidence, fuzzy_match_score / 100)
```

Below a set threshold (e.g. 0.6), the client is expected to show the manufacturer the parsed draft plus `alternativeMatches` for manual confirmation rather than auto-submitting. This threshold is a tunable constant, not a learned parameter.

## 5. Internal service contract

This module is called internally by the backend's `POST /api/rfq/parse` endpoint (see `API_DOCUMENTATION.md`). It is not exposed as a separate public API, but documented here as the function-level contract between the backend and this service.

```python
def parse_rfq(raw_text: str, input_channel: str) -> ParsedRFQResult:
    """
    Returns:
      ParsedRFQResult(
        parsed: ParsedRFQ,
        matched_catalog_item_id: str | None,
        confidence: float,
        alternative_matches: list[CatalogMatch]
      )
    Raises:
      ParseFailedError  — LLM and fallback parser both failed to extract usable fields
    """
```

`ParseFailedError` maps to the backend's `422 PARSE_FAILED` response.

## 6. Evaluation methodology

This replaces the "model training and validation" chapter a trained-model project would have. Since there's no training curve to report, the methodology is a straightforward test-and-score exercise:

1. Write 50–100 realistic RFQ phrases by hand — mix of English, Swahili, Sheng, and code-switched sentences, covering clear cases and deliberately ambiguous ones.
2. For each, write down the expected `{material, quantity, unit}` yourself.
3. Run the full pipeline (LLM + fuzzy match) against every phrase.
4. Score against the expected output:
   - **Field-level accuracy** — % of phrases where material, quantity, and unit were all extracted correctly
   - **Precision/recall** on material extraction specifically (since this is the hardest field)
   - **Fallback-parser-only accuracy** — run the same set with the LLM disabled, to quantify how much the fallback alone can handle
5. Report failure cases explicitly in the documentation — which phrasings failed and why (ambiguous quantity, unfamiliar slang, mixed units). This qualitative analysis is what stands in for a results/discussion chapter.

Report these numbers as **evaluation results on a hand-built test set**, not as generalizable real-world accuracy — that distinction matters and should be stated plainly in the final write-up.

## Known limitations

- Parsing quality depends on the LLM provider's API being available and affordable at scale — a cost/rate-limit discussion belongs in your documentation's limitations section.
- The few-shot and evaluation sets are both hand-written by one person (you) — they won't cover every real phrasing a live user base would produce. This is an honest limitation to state, not something to hide.
- No mechanism in this version improves the parser over time from real usage (that would require a feedback/labeling loop, which is out of scope here).

## Error Codes Reference

| HTTP Status | Code | Meaning |
|---|---|---|
| 422 | `PARSE_FAILED` | Both the LLM and fallback parser failed to extract usable fields |
| 502 | `LLM_API_UNAVAILABLE` | LLM provider API unreachable or timed out — fallback parser engaged |
| 400 | `NO_MATCHING_CATALOG_ITEM` | Extracted material scored below the fuzzy-match confidence cutoff |