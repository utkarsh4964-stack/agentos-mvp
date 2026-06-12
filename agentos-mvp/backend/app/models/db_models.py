import uuid
from datetime import datetime, timezone
from sqlalchemy import Column, String, Integer, Float, DateTime, ForeignKey, JSON, Text, Boolean
from sqlalchemy.orm import relationship
from app.database import Base


def gen_id():
    return str(uuid.uuid4())


def utcnow():
    return datetime.now(timezone.utc)


class User(Base):
    __tablename__ = "users"

    id = Column(String, primary_key=True, default=gen_id)
    email = Column(String, unique=True, index=True, nullable=False)
    hashed_password = Column(String, nullable=False)
    name = Column(String, nullable=True)
    plan_tier = Column(String, default="free")
    api_key = Column(String, unique=True, default=gen_id)
    created_at = Column(DateTime, default=utcnow)

    pipelines = relationship("Pipeline", back_populates="owner", cascade="all, delete-orphan")


class Pipeline(Base):
    __tablename__ = "pipelines"

    id = Column(String, primary_key=True, default=gen_id)
    owner_id = Column(String, ForeignKey("users.id"), nullable=False)
    name = Column(String, nullable=False)
    description = Column(Text, default="")
    version = Column(Integer, default=1)
    agent_graph = Column(JSON, nullable=False, default=list)  # list of agent step dicts
    input_schema = Column(JSON, default=dict)
    is_published = Column(Boolean, default=False)
    created_at = Column(DateTime, default=utcnow)
    updated_at = Column(DateTime, default=utcnow, onupdate=utcnow)

    owner = relationship("User", back_populates="pipelines")
    runs = relationship("PipelineRun", back_populates="pipeline", cascade="all, delete-orphan")


class PipelineRun(Base):
    __tablename__ = "pipeline_runs"

    id = Column(String, primary_key=True, default=gen_id)
    pipeline_id = Column(String, ForeignKey("pipelines.id"), nullable=False)
    user_id = Column(String, ForeignKey("users.id"), nullable=False)
    status = Column(String, default="QUEUED")  # QUEUED, RUNNING, COMPLETED, FAILED
    input_data = Column(JSON, default=dict)
    output_data = Column(JSON, default=dict)
    step_logs = Column(JSON, default=list)  # per-agent execution trace
    score = Column(Float, nullable=True)
    score_rationale = Column(Text, nullable=True)
    error_message = Column(Text, nullable=True)
    duration_ms = Column(Integer, nullable=True)
    created_at = Column(DateTime, default=utcnow)

    pipeline = relationship("Pipeline", back_populates="runs")
