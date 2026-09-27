# [S4] Runtime configuration, read from environment (.env is git-ignored).
from __future__ import annotations

import os

try:
    from dotenv import load_dotenv

    load_dotenv()
except Exception:
    pass

# LLM (Ollama, local, free)
OLLAMA_BASE_URL: str = os.getenv(
    "OLLAMA_BASE_URL",
    "http://localhost:11434"
)

OLLAMA_MODEL: str = os.getenv(
    "OLLAMA_MODEL",
    "llama3.2:3b"
)

# ASP.NET Core backend
BACKEND_API_BASE_URL: str = os.getenv(
    "BACKEND_API_BASE_URL",
    "http://localhost:5000"
)

# Shared secret for internal agent service
AGENT_SERVICE_API_KEY: str | None = os.getenv(
    "AGENT_SERVICE_API_KEY"
) or None