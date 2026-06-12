from typing import Optional, Any
from pydantic import BaseModel, EmailStr
from datetime import datetime


# ---- Auth ----
class UserCreate(BaseModel):
    email: EmailStr
    password: str
    name: Optional[str] = None


class UserLogin(BaseModel):
    email: EmailStr
    password: str


class UserOut(BaseModel):
    id: str
    email: str
    name: Optional[str]
    plan_tier: str
    api_key: str

    class Config:
        from_attributes = True


class Token(BaseModel):
    access_token: str
    token_type: str = "bearer"
    user: UserOut


# ---- Agent step ----
class AgentStep(BaseModel):
    id: str
    type: str  # writer, summarizer, fact_checker, seo_analyzer, code_reviewer, image_describer, data_extractor, email_drafter, custom
    name: str
    instructions: str
    condition: Optional[str] = None  # e.g. "output_length > 500"


# ---- Pipeline ----
class PipelineBuildRequest(BaseModel):
    prompt: str
    existing_graph: Optional[list[AgentStep]] = None


class PipelineBuildResponse(BaseModel):
    agent_graph: list[AgentStep]
    explanation: str
    pipeline_name: str
    input_schema: dict


class PipelineCreate(BaseModel):
    name: str
    description: str = ""
    agent_graph: list[AgentStep]
    input_schema: dict = {}


class PipelineOut(BaseModel):
    id: str
    name: str
    description: str
    version: int
    agent_graph: list[dict]
    input_schema: dict
    is_published: bool
    created_at: datetime
    updated_at: datetime

    class Config:
        from_attributes = True


# ---- Run ----
class RunCreate(BaseModel):
    input_data: dict[str, Any]


class StepLog(BaseModel):
    agent_id: str
    agent_name: str
    agent_type: str
    status: str
    input_preview: str
    output: str
    latency_ms: int
    skipped: bool = False
    skip_reason: Optional[str] = None


class RunOut(BaseModel):
    id: str
    pipeline_id: str
    status: str
    input_data: dict
    output_data: dict
    step_logs: list[dict]
    score: Optional[float]
    score_rationale: Optional[str]
    error_message: Optional[str]
    duration_ms: Optional[int]
    created_at: datetime

    class Config:
        from_attributes = True
