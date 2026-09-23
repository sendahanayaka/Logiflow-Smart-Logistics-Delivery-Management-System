# [S3] Load & Dispatch Validation — frozen JSON I/O contract.
# Deterministic safety gate: rule engines decide pass/fail/revise, not the LLM.
from __future__ import annotations

from typing import Any

from pydantic import BaseModel, Field

from app.schemas.common import BatchCandidate


class ValidationInput(BaseModel):
    workflow_id: str
    proposed_allocation: dict[str, Any]
    batch: BatchCandidate


class RuleResult(BaseModel):
    rule: str
    passed: bool
    detail: str | None = None


class ValidationOutput(BaseModel):
    workflow_id: str
    result: str  # PASS | FAIL | REVISE
    rule_results: list[RuleResult] = Field(default_factory=list)
    approved_batch: BatchCandidate | None = None
    rejection_reasons: list[str] = Field(default_factory=list)
    explanation: str | None = None
