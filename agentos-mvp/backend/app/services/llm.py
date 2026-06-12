import os
import json
import logging

logger = logging.getLogger("agentos.llm")

GEMINI_API_KEY = os.getenv("GEMINI_API_KEY", "")
GROQ_API_KEY = os.getenv("GROQ_API_KEY", "")

_gemini_model = None
_groq_client = None

if GEMINI_API_KEY:
    try:
        import google.generativeai as genai
        genai.configure(api_key=GEMINI_API_KEY)
        _gemini_model = genai.GenerativeModel("gemini-2.0-flash")
    except Exception as e:
        logger.warning(f"Gemini init failed: {e}")

if GROQ_API_KEY:
    try:
        from groq import Groq
        _groq_client = Groq(api_key=GROQ_API_KEY)
    except Exception as e:
        logger.warning(f"Groq init failed: {e}")


class LLMError(Exception):
    pass


def _call_gemini(prompt: str, system: str = "") -> str:
    if not _gemini_model:
        raise LLMError("Gemini not configured")
    full_prompt = f"{system}\n\n{prompt}" if system else prompt
    response = _gemini_model.generate_content(full_prompt)
    return response.text


def _call_groq(prompt: str, system: str = "") -> str:
    if not _groq_client:
        raise LLMError("Groq not configured")
    messages = []
    if system:
        messages.append({"role": "system", "content": system})
    messages.append({"role": "user", "content": prompt})
    response = _groq_client.chat.completions.create(
        model="llama-3.3-70b-versatile",
        messages=messages,
        temperature=0.7,
    )
    return response.choices[0].message.content


def generate(prompt: str, system: str = "", json_mode: bool = False) -> str:
    """
    Call Gemini first, fall back to Groq on any failure.
    If json_mode is True, instruct the model to return only JSON
    and strip markdown fences from the result.
    """
    if json_mode:
        system = (system + "\n\n" if system else "") + (
            "Respond with ONLY valid JSON. No markdown fences, no preamble, no commentary."
        )

    text = None
    last_error = None

    for fn, name in [(_call_gemini, "gemini"), (_call_groq, "groq")]:
        try:
            text = fn(prompt, system)
            break
        except Exception as e:
            last_error = e
            logger.warning(f"{name} call failed: {e}")
            continue

    if text is None:
        raise LLMError(f"All LLM providers failed. Last error: {last_error}")

    if json_mode:
        text = text.strip()
        if text.startswith("```"):
            text = text.split("```")[1]
            if text.startswith("json"):
                text = text[4:]
        text = text.strip().strip("`").strip()

    return text


def generate_json(prompt: str, system: str = "") -> dict:
    raw = generate(prompt, system=system, json_mode=True)
    try:
        return json.loads(raw)
    except json.JSONDecodeError as e:
        logger.error(f"Failed to parse JSON from LLM: {raw[:500]}")
        raise LLMError(f"LLM returned invalid JSON: {e}")
