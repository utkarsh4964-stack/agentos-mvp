"""
Pre-built agent library — matches AgentOS PRD section 5.2.
Each agent has a type, default instructions, and is invoked through the LLM service.
"""

AGENT_LIBRARY = {
    "writer": {
        "name": "Writer Agent",
        "description": "Writes original content based on a topic or brief.",
        "default_instructions": (
            "You are a skilled content writer. Write clear, engaging, well-structured "
            "content based on the input provided. Match the tone and length implied by "
            "the request."
        ),
    },
    "summarizer": {
        "name": "Summarizer Agent",
        "description": "Condenses input text into a concise summary.",
        "default_instructions": (
            "You are a summarization expert. Read the input and produce a concise, "
            "accurate summary that captures the key points without losing important detail."
        ),
    },
    "fact_checker": {
        "name": "Fact-Check Agent",
        "description": "Reviews content for factual accuracy and flags issues.",
        "default_instructions": (
            "You are a fact-checking assistant. Review the input content for factual claims. "
            "Flag any claims that seem dubious, unverifiable, or potentially incorrect, and "
            "note them clearly. Then return the content with any necessary corrections or "
            "caveats added. If everything checks out, say so briefly and return the content unchanged."
        ),
    },
    "seo_analyzer": {
        "name": "SEO Analyzer Agent",
        "description": "Optimizes content for search engines.",
        "default_instructions": (
            "You are an SEO specialist. Optimize the input content for search engines: "
            "improve headings, suggest a meta description, naturally incorporate likely "
            "keywords, and improve readability. Return the optimized content followed by "
            "a short 'SEO Notes' section."
        ),
    },
    "code_reviewer": {
        "name": "Code Reviewer Agent",
        "description": "Reviews code for bugs, style, and improvements.",
        "default_instructions": (
            "You are a senior code reviewer. Review the input code for bugs, security issues, "
            "style problems, and opportunities for improvement. Provide specific, actionable feedback."
        ),
    },
    "image_describer": {
        "name": "Image Describer Agent",
        "description": "Generates descriptive text for images based on a description or context.",
        "default_instructions": (
            "You are an image description specialist. Based on the input context, generate a "
            "vivid, accurate description suitable for alt text or a caption."
        ),
    },
    "data_extractor": {
        "name": "Data Extractor Agent",
        "description": "Extracts structured data from unstructured text.",
        "default_instructions": (
            "You are a data extraction specialist. Read the input text and extract relevant "
            "structured data (key facts, entities, numbers, dates) and present it as a clear, "
            "organized list or table."
        ),
    },
    "email_drafter": {
        "name": "Email Drafter Agent",
        "description": "Drafts professional emails based on a brief.",
        "default_instructions": (
            "You are a professional communication assistant. Draft a clear, well-structured email "
            "based on the input. Include an appropriate subject line, greeting, body, and closing."
        ),
    },
    "custom": {
        "name": "Custom Agent",
        "description": "A user-defined agent with custom instructions.",
        "default_instructions": "Follow the custom instructions provided exactly.",
    },
}


def get_agent_info(agent_type: str) -> dict:
    return AGENT_LIBRARY.get(agent_type, AGENT_LIBRARY["custom"])


def library_summary() -> str:
    lines = []
    for key, info in AGENT_LIBRARY.items():
        if key == "custom":
            continue
        lines.append(f'- "{key}": {info["name"]} — {info["description"]}')
    return "\n".join(lines)
