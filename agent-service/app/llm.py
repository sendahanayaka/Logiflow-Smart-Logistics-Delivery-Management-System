# [Shared/S2] Ollama LLM client for structured JSON generation.
from __future__ import annotations

import json
from typing import Any

import httpx

from app.config import OLLAMA_BASE_URL, OLLAMA_MODEL


def call_ollama_json(
    prompt: str,
    system_prompt: str = "",
    model: str | None = None,
    base_url: str | None = None,
    timeout: float = 15.0,
) -> dict[str, Any]:
    """
    Call Ollama API with format='json' and return parsed dict.
    Raises exception on network failure, HTTP error, timeout, or malformed JSON.
    """
    url = f"{(base_url or OLLAMA_BASE_URL).rstrip('/')}/api/chat"
    target_model = model or OLLAMA_MODEL

    messages = []
    if system_prompt:
        messages.append({"role": "system", "content": system_prompt})
    messages.append({"role": "user", "content": prompt})

    payload = {
        "model": target_model,
        "messages": messages,
        "format": "json",
        "stream": False,
    }

    response = httpx.post(url, json=payload, timeout=timeout)
    response.raise_for_status()

    data = response.json()
    content = data.get("message", {}).get("content", "")
    return json.loads(content)
