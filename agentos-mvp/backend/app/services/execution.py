import re
import time
import logging
from app.services.llm import generate, LLMError
from app.services.agent_library import get_agent_info

logger = logging.getLogger("agentos.execution")

MAX_RETRIES = 2
STEP_TIMEOUT_HINT = 30  # seconds, informational — real timeout enforced via httpx in llm layer if needed


def _eval_condition(condition: str, context: dict) -> tuple[bool, str]:
    """
    Evaluate simple conditions like 'output_length > 500'.
    Supported variables: output_length (length of previous step's output text).
    Returns (should_run, reason_if_skipped).
    """
    if not condition:
        return True, ""

    output_length = context.get("output_length", 0)

    # Only allow a tiny, safe grammar: "output_length" <op> <number>
    match = re.match(r"\s*output_length\s*(>=|<=|==|!=|>|<)\s*(\d+)\s*$", condition)
    if not match:
        # Unknown condition format — fail open (run the step) but log it
        logger.warning(f"Unrecognized condition '{condition}', running step anyway")
        return True, ""

    op, value = match.group(1), int(match.group(2))
    value_map = {
        ">": output_length > value,
        "<": output_length < value,
        ">=": output_length >= value,
        "<=": output_length <= value,
        "==": output_length == value,
        "!=": output_length != value,
    }
    result = value_map[op]
    reason = "" if result else f"Condition '{condition}' not met (output_length={output_length})"
    return result, reason


def _format_input(input_data: dict, previous_output: str | None) -> str:
    parts = []
    if input_data:
        for k, v in input_data.items():
            parts.append(f"{k}: {v}")
    if previous_output:
        parts.append(f"\nPrevious step output:\n{previous_output}")
    return "\n".join(parts) if parts else "(no input)"


def run_pipeline(agent_graph: list[dict], input_data: dict) -> dict:
    """
    Executes a pipeline sequentially. Each step's output feeds the next step.
    Returns: {status, output_data, step_logs, duration_ms, error_message}
    """
    start_time = time.time()
    step_logs = []
    previous_output = None
    final_output = None
    error_message = None
    status = "COMPLETED"

    for step in agent_graph:
        step_id = step["id"]
        step_type = step.get("type", "custom")
        step_name = step.get("name", get_agent_info(step_type)["name"])
        instructions = step.get("instructions", get_agent_info(step_type)["default_instructions"])
        condition = step.get("condition")

        # Evaluate condition based on previous output
        output_length = len(previous_output) if previous_output else 0
        should_run, skip_reason = _eval_condition(condition, {"output_length": output_length})

        if not should_run:
            step_logs.append({
                "agent_id": step_id,
                "agent_name": step_name,
                "agent_type": step_type,
                "status": "SKIPPED",
                "input_preview": "",
                "output": "",
                "latency_ms": 0,
                "skipped": True,
                "skip_reason": skip_reason,
            })
            continue

        step_input = _format_input(input_data, previous_output)
        step_start = time.time()

        last_error = None
        output_text = None
        for attempt in range(MAX_RETRIES + 1):
            try:
                output_text = generate(
                    prompt=f"Task input:\n{step_input}",
                    system=instructions,
                )
                break
            except LLMError as e:
                last_error = e
                logger.warning(f"Step {step_id} attempt {attempt+1} failed: {e}")
                continue

        latency_ms = int((time.time() - step_start) * 1000)

        if output_text is None:
            step_logs.append({
                "agent_id": step_id,
                "agent_name": step_name,
                "agent_type": step_type,
                "status": "FAILED",
                "input_preview": step_input[:300],
                "output": "",
                "latency_ms": latency_ms,
                "skipped": False,
                "skip_reason": None,
            })
            status = "FAILED"
            error_message = (
                f"Your {step_name} failed after {MAX_RETRIES} retries. "
                f"Try again or reduce the input length. ({last_error})"
            )
            break

        step_logs.append({
            "agent_id": step_id,
            "agent_name": step_name,
            "agent_type": step_type,
            "status": "COMPLETED",
            "input_preview": step_input[:300],
            "output": output_text,
            "latency_ms": latency_ms,
            "skipped": False,
            "skip_reason": None,
        })

        previous_output = output_text
        final_output = output_text

    duration_ms = int((time.time() - start_time) * 1000)

    return {
        "status": status,
        "output_data": {"result": final_output or ""},
        "step_logs": step_logs,
        "duration_ms": duration_ms,
        "error_message": error_message,
    }
