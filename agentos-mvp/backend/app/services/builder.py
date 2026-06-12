import uuid
from app.services.llm import generate_json, LLMError
from app.services.agent_library import library_summary, AGENT_LIBRARY


BUILDER_SYSTEM_PROMPT = f"""You are the AgentOS Natural Language Pipeline Builder.

Your job: convert a user's plain-English description of a workflow into a structured
pipeline graph — a sequential list of agent steps.

Available agent types:
{library_summary()}

You can also create a "custom" agent type for anything not covered above — give it
clear instructions describing exactly what it should do.

Rules:
- Output a sequential pipeline: a list of steps executed in order, each step's output
  feeding into the next step's input.
- Each step needs: id (short slug like "step_1"), type (one of the agent types above),
  name (human readable), instructions (specific instructions for this agent in this
  pipeline, tailored to the user's request), and condition (optional — a simple
  expression like "output_length > 500" that determines if this step runs; null if
  the step always runs).
- If the user is modifying an existing pipeline (existing_graph provided), apply the
  modification to that graph and return the FULL updated graph, not just the diff.
- Infer a short pipeline_name (3-6 words) and a one-sentence explanation of what the
  pipeline does.
- Infer an input_schema: a JSON object describing the expected input fields for running
  this pipeline, e.g. {{"topic": "string", "tone": "string"}}. Keep it minimal — usually
  1-2 fields.

Return ONLY a JSON object with this exact shape:
{{
  "pipeline_name": "...",
  "explanation": "...",
  "agent_graph": [
    {{"id": "step_1", "type": "writer", "name": "...", "instructions": "...", "condition": null}}
  ],
  "input_schema": {{"field_name": "string"}}
}}
"""


def build_pipeline(prompt: str, existing_graph: list[dict] | None = None) -> dict:
    user_prompt = f"User request: {prompt}"
    if existing_graph:
        user_prompt += f"\n\nExisting pipeline graph (modify this):\n{existing_graph}"

    try:
        result = generate_json(user_prompt, system=BUILDER_SYSTEM_PROMPT)
    except LLMError as e:
        raise

    # Validate and normalize
    agent_graph = result.get("agent_graph", [])
    normalized = []
    for i, step in enumerate(agent_graph):
        step_type = step.get("type", "custom")
        if step_type not in AGENT_LIBRARY:
            step_type = "custom"
        normalized.append({
            "id": step.get("id") or f"step_{i+1}_{uuid.uuid4().hex[:6]}",
            "type": step_type,
            "name": step.get("name") or AGENT_LIBRARY[step_type]["name"],
            "instructions": step.get("instructions") or AGENT_LIBRARY[step_type]["default_instructions"],
            "condition": step.get("condition"),
        })

    return {
        "pipeline_name": result.get("pipeline_name", "Untitled Pipeline"),
        "explanation": result.get("explanation", ""),
        "agent_graph": normalized,
        "input_schema": result.get("input_schema", {"input": "string"}),
    }
