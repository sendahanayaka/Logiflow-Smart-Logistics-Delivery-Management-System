# [S3] Load & Dispatch Validation — frozen JSON I/O contract.
# Deterministic safety gate: rule engines decide pass/fail/revise, not the LLM.
from __future__ import annotations

from typing import Any, Literal

from pydantic import BaseModel, Field, model_validator

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
    result: Literal["PASS", "FAIL", "REVISE"]
    rule_results: list[RuleResult] = Field(default_factory=list)
    approved_batch: BatchCandidate | None = None
    rejection_reasons: list[str] = Field(default_factory=list)
    explanation: str | None = None

    @model_validator(mode="after")
    def non_passing_results_cannot_approve_a_batch(self) -> "ValidationOutput":
        """Keep the public validation contract aligned with the safety gate."""
        if self.result != "PASS" and self.approved_batch is not None:
            raise ValueError("only PASS validation results may include approved_batch")
        return self
