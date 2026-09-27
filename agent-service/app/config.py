# [S4] Runtime configuration, read from environment (.env is git-ignored).
from __future__ import annotations

import os


def _env_positive_float(name: str, default: float) -> float:
    """Read a positive float from the environment, falling back on bad input.

    A non-numeric or non-positive value would otherwise crash the haversine
    fallback (ZeroDivisionError) or the module import (ValueError) — defeating the
    whole point of a fallback that must never break. We coerce those to ``default``.
    """
    try:
        value = float(os.getenv(name, str(default)))
    except (TypeError, ValueError):
        return default
    return value if value > 0 else default


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

# Maps / routing for the S4 distance-matrix tool. Speaks the OSRM protocol.
# In production point this at a self-hosted OSRM (or the backend MapsGateway that
# proxies it); the default public demo server is for local dev only. Whenever OSRM
# is unreachable the tool falls back to straight-line haversine (FALLBACK_AVG_SPEED
# turns that distance into a duration), so the workflow never breaks — free either
# way, satisfying the no-paid-service rule.
OSRM_BASE_URL: str = os.getenv("OSRM_BASE_URL", "http://router.project-osrm.org")
FALLBACK_AVG_SPEED_KMH: float = _env_positive_float("FALLBACK_AVG_SPEED_KMH", 40.0)

# Shared secret so ONLY the backend can call this internal service. When unset
# (local dev) the guard is disabled; set it in staging/demo.
AGENT_SERVICE_API_KEY: str | None = os.getenv("AGENT_SERVICE_API_KEY") or None
