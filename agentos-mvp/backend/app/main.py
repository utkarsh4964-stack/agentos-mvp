import logging
from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware

from app.database import Base, engine
from app.routers import auth, pipelines

logging.basicConfig(level=logging.INFO)

# Create tables on startup (MVP — for production use Alembic migrations)
Base.metadata.create_all(bind=engine)

app = FastAPI(
    title="AgentOS API",
    description="Natural-language AI workflow platform — MVP backend",
    version="1.0.0",
)

app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],  # tighten in production to your frontend domain
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

app.include_router(auth.router)
app.include_router(pipelines.router)


@app.get("/")
def root():
    return {"status": "ok", "service": "AgentOS API", "version": "1.0.0"}


@app.get("/health")
def health():
    return {"status": "healthy"}
