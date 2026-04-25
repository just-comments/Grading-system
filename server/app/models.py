from __future__ import annotations

from typing import Any, Literal

from pydantic import BaseModel, Field


class LoginRequest(BaseModel):
    username: str
    password: str


class StatisticalRule(BaseModel):
    grade: str
    k: float = 0.0


class BoundaryRule(BaseModel):
    grade: str
    min: float = 0.0


class GradingDefinition(BaseModel):
    rules: list[StatisticalRule] = Field(default_factory=list)
    boundaries: list[BoundaryRule] = Field(default_factory=list)


class ComputeConfig(BaseModel):
    components: list[str] = Field(default_factory=list)
    weights: dict[str, float] = Field(default_factory=dict)
    mode: Literal["default", "statistical", "custom"] = "default"
    groupStrategy: Literal["shared", "normalized"] = "shared"
    grading: GradingDefinition = Field(default_factory=GradingDefinition)


class ComputeRequest(BaseModel):
    sessionId: str
    config: ComputeConfig


class ExportRequest(BaseModel):
    rows: list[dict[str, Any]] = Field(default_factory=list)
    columns: list[str] = Field(default_factory=list)


class SaveConfigurationRequest(BaseModel):
    name: str
    datasetFingerprint: str | None = None
    config: dict[str, Any]
