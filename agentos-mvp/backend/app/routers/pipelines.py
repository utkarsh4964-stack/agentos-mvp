from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.orm import Session

from app.database import get_db
from app.models.db_models import User, Pipeline, PipelineRun
from app.schemas import (
    PipelineBuildRequest, PipelineBuildResponse, PipelineCreate, PipelineOut,
    RunCreate, RunOut, AgentStep,
)
from app.auth import get_current_user
from app.services.builder import build_pipeline
from app.services.execution import run_pipeline
from app.services.judge import score_run
from app.services.llm import LLMError

router = APIRouter(prefix="/pipelines", tags=["pipelines"])

PLAN_LIMITS = {"free": 3, "pro": 10_000, "team": 10_000}


@router.post("/build", response_model=PipelineBuildResponse)
def build(payload: PipelineBuildRequest, current_user: User = Depends(get_current_user)):
    existing_graph = (
        [step.model_dump() for step in payload.existing_graph] if payload.existing_graph else None
    )
    try:
        result = build_pipeline(payload.prompt, existing_graph)
    except LLMError as e:
        raise HTTPException(status_code=503, detail=f"Pipeline builder is temporarily unavailable: {e}")

    return PipelineBuildResponse(
        agent_graph=[AgentStep(**step) for step in result["agent_graph"]],
        explanation=result["explanation"],
        pipeline_name=result["pipeline_name"],
        input_schema=result["input_schema"],
    )


@router.post("", response_model=PipelineOut)
def create_pipeline(payload: PipelineCreate, current_user: User = Depends(get_current_user), db: Session = Depends(get_db)):
    count = db.query(Pipeline).filter(Pipeline.owner_id == current_user.id).count()
    limit = PLAN_LIMITS.get(current_user.plan_tier, 3)
    if count >= limit:
        raise HTTPException(
            status_code=403,
            detail=f"You've reached your plan's limit of {limit} pipelines. Upgrade to create more.",
        )

    pipeline = Pipeline(
        owner_id=current_user.id,
        name=payload.name,
        description=payload.description,
        agent_graph=[step.model_dump() for step in payload.agent_graph],
        input_schema=payload.input_schema,
    )
    db.add(pipeline)
    db.commit()
    db.refresh(pipeline)
    return pipeline


@router.get("", response_model=list[PipelineOut])
def list_pipelines(current_user: User = Depends(get_current_user), db: Session = Depends(get_db)):
    return db.query(Pipeline).filter(Pipeline.owner_id == current_user.id).order_by(Pipeline.updated_at.desc()).all()


@router.get("/{pipeline_id}", response_model=PipelineOut)
def get_pipeline(pipeline_id: str, current_user: User = Depends(get_current_user), db: Session = Depends(get_db)):
    pipeline = _get_owned_pipeline(pipeline_id, current_user, db)
    return pipeline


@router.put("/{pipeline_id}", response_model=PipelineOut)
def update_pipeline(pipeline_id: str, payload: PipelineCreate, current_user: User = Depends(get_current_user), db: Session = Depends(get_db)):
    pipeline = _get_owned_pipeline(pipeline_id, current_user, db)
    pipeline.name = payload.name
    pipeline.description = payload.description
    pipeline.agent_graph = [step.model_dump() for step in payload.agent_graph]
    pipeline.input_schema = payload.input_schema
    pipeline.version += 1
    db.commit()
    db.refresh(pipeline)
    return pipeline


@router.delete("/{pipeline_id}")
def delete_pipeline(pipeline_id: str, current_user: User = Depends(get_current_user), db: Session = Depends(get_db)):
    pipeline = _get_owned_pipeline(pipeline_id, current_user, db)
    db.delete(pipeline)
    db.commit()
    return {"ok": True}


@router.post("/{pipeline_id}/run", response_model=RunOut)
def run(pipeline_id: str, payload: RunCreate, current_user: User = Depends(get_current_user), db: Session = Depends(get_db)):
    pipeline = _get_owned_pipeline(pipeline_id, current_user, db)

    run_record = PipelineRun(
        pipeline_id=pipeline.id,
        user_id=current_user.id,
        status="RUNNING",
        input_data=payload.input_data,
    )
    db.add(run_record)
    db.commit()
    db.refresh(run_record)

    result = run_pipeline(pipeline.agent_graph, payload.input_data)

    run_record.status = result["status"]
    run_record.output_data = result["output_data"]
    run_record.step_logs = result["step_logs"]
    run_record.duration_ms = result["duration_ms"]
    run_record.error_message = result["error_message"]

    # Async-ish judge scoring — best effort, done inline for MVP simplicity
    if result["status"] == "COMPLETED":
        score_result = score_run(payload.input_data, pipeline.agent_graph, result["output_data"].get("result", ""))
        run_record.score = score_result["score"]
        run_record.score_rationale = score_result["rationale"]

    db.commit()
    db.refresh(run_record)
    return run_record


@router.get("/{pipeline_id}/runs", response_model=list[RunOut])
def list_runs(pipeline_id: str, current_user: User = Depends(get_current_user), db: Session = Depends(get_db)):
    pipeline = _get_owned_pipeline(pipeline_id, current_user, db)
    return db.query(PipelineRun).filter(PipelineRun.pipeline_id == pipeline.id).order_by(PipelineRun.created_at.desc()).limit(50).all()


def _get_owned_pipeline(pipeline_id: str, current_user: User, db: Session) -> Pipeline:
    pipeline = db.query(Pipeline).filter(Pipeline.id == pipeline_id).first()
    if not pipeline:
        raise HTTPException(status_code=404, detail="Pipeline not found.")
    if pipeline.owner_id != current_user.id:
        raise HTTPException(status_code=403, detail="You don't have access to this pipeline.")
    return pipeline
