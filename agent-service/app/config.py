# [S4] Runtime configuration, read from environment (.env is git-ignored).
from __future__ import annotations

import os

try:
    from dotenv import load_dotenv

    load_dotenv()
except Exception:  # dotenv optional; env vars may be provided by the OS/CI
    pass

# LLM (Ollama, local, free — satisfies the no-paid-service rule)
OLLAMA_BASE_URL: str = os.getenv("OLLAMA_BASE_URL", "http://localhost:11434")
OLLAMA_MODEL: str = os.getenv("OLLAMA_MODEL", "llama3.2:3b")

# The ASP.NET Core backend the agents reach for allow-listed tool endpoints.
BACKEND_API_BASE_URL: str = os.getenv("BACKEND_API_BASE_URL", "http://localhost:5080")

# Shared secret so ONLY the backend can call this internal service. When unset
# (local dev) the guard is disabled; set it in staging/demo.
AGENT_SERVICE_API_KEY: str | None = os.getenv("AGENT_SERVICE_API_KEY") or None
