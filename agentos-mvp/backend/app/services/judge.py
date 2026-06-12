from app.services.llm import generate_json, LLMError
import logging

logger = logging.getLogger("agentos.judge")

JUDGE_SYSTEM_PROMPT = """You are the AgentOS Judge — you score the quality of a pipeline's
final output on a scale of 0-100.

Consider: does the output fulfill what the user asked for? Is it well-written, accurate,
and complete? Is it free of obvious errors or placeholder text?

Return ONLY a JSON object: {"score": <int 0-100>, "rationale": "<one sentence>"}
"""


def score_run(input_data: dict, agent_graph: list[dict], output_text: str) -> dict:
    """Returns {score: float|None, rationale: str|None}. Never raises — scoring is best-effort."""
    if not output_text:
        return {"score": None, "rationale": None}

    prompt = (
        f"User input: {input_data}\n\n"
        f"Pipeline steps: {[s.get('name') for s in agent_graph]}\n\n"
        f"Final output:\n{output_text[:4000]}"
    )

    try:
        result = generate_json(prompt, system=JUDGE_SYSTEM_PROMPT)
        score = float(result.get("score", 0))
        score = max(0.0, min(100.0, score))
        return {"score": score, "rationale": result.get("rationale", "")}
    except (LLMError, ValueError, TypeError) as e:
        logger.warning(f"Judge scoring failed (non-fatal): {e}")
        return {"score": None, "rationale": None}
