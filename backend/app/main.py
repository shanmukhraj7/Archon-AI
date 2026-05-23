"""
FastAPI application entry point.
Routes: /api/query, /api/upload, /api/history, /api/report/{id},
        /api/report/{id}/pdf, /api/report/{id}/trace, /api/agents/status,
        /api/report/{id}/stream
"""

import os
import asyncio
import shutil
import json as _json_module
from pathlib import Path
from typing import List, Optional

from fastapi import FastAPI, HTTPException, UploadFile, File, BackgroundTasks, Request, Depends
from fastapi.middleware.cors import CORSMiddleware
from fastapi.responses import Response, FileResponse, StreamingResponse
from fastapi.staticfiles import StaticFiles
from fastapi.security import HTTPBearer, HTTPAuthorizationCredentials
from pydantic import BaseModel, EmailStr, field_validator
from dotenv import load_dotenv

load_dotenv()

from .db.models import (
    init_db,
    get_session_factory,
    create_query,
    update_query,
    get_query,
    list_queries,
    delete_query,
    create_document,
    list_documents,
    create_user,
    get_user_by_email,
    get_user_by_id,
)
from .auth import hash_password, verify_password, create_access_token, decode_token
from .agent.orchestrator import run_research
from .output.formatter import ensure_report_structure, report_metadata
from .output.pdf_export import export_pdf
from .memory.store import get_memory_store
from .rag.ingest import ingest_document

# ── Configuration ─────────────────────────────────────────────────────────────

DB_PATH = os.getenv("SQLITE_DB_PATH", "/tmp/history.db")
CHROMA_DIR = os.getenv("CHROMA_PERSIST_DIR", "/tmp/chroma")
UPLOAD_DIR = Path(os.getenv("UPLOAD_DIR", "/tmp/uploads"))
UPLOAD_DIR.mkdir(parents=True, exist_ok=True)
Path(CHROMA_DIR).mkdir(parents=True, exist_ok=True)

# ── App ───────────────────────────────────────────────────────────────────────

app = FastAPI(
    title="Archon AI API",
    description="Agentic research tool powered by LLM + RAG + Web search",
    version="1.0.0",
)

app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)


@app.on_event("startup")
async def startup():
    await init_db(DB_PATH)


def get_db():
    factory = get_session_factory(DB_PATH)
    return factory


# ── Schemas ───────────────────────────────────────────────────────────────────

class QueryRequest(BaseModel):
    query: str


class QueryResponse(BaseModel):
    id: str
    status: str
    query: str


class ReportResponse(BaseModel):
    id: str
    query: str
    status: str
    report_markdown: Optional[str]
    metadata: Optional[dict]
    created_at: str


class HistoryItem(BaseModel):
    id: str
    query: str
    status: str
    summary: Optional[str]
    created_at: str


class DocumentResponse(BaseModel):
    id: str
    filename: str
    chunk_count: int
    created_at: str


# ── Auth Schemas ───────────────────────────────────────────────────────────────

class RegisterRequest(BaseModel):
    username: str
    email: str
    password: str


class LoginRequest(BaseModel):
    email: str
    password: str


class TokenResponse(BaseModel):
    access_token: str
    token_type: str = "bearer"
    user: dict


class UserResponse(BaseModel):
    id: str
    username: str
    email: str
    created_at: str


# Bearer token dependency
_bearer = HTTPBearer(auto_error=False)


def get_current_user_payload(
    credentials: HTTPAuthorizationCredentials = Depends(_bearer),
) -> dict:
    """Decode Bearer token; raise 401 if missing or invalid."""
    if not credentials:
        raise HTTPException(status_code=401, detail="Not authenticated")
    payload = decode_token(credentials.credentials)
    if not payload:
        raise HTTPException(status_code=401, detail="Invalid or expired token")
    return payload


# ── Background task ───────────────────────────────────────────────────────────

async def run_research_task(record_id: str, query: str):
    """Background task: run the 6-agent pipeline and update the DB record."""
    factory = get_db()
    async with factory() as session:
        await update_query(session, record_id, status="running")

    try:
        # Inject session memory as extra context
        memory = get_memory_store()
        enriched_query = query
        memory_ctx = memory.get_context_string()
        if memory_ctx:
            enriched_query = f"{query}\n\n{memory_ctx}"

        # run_research now returns a rich dict (report + agent metadata)
        result = await run_research(enriched_query, job_id=record_id)
        
        if result.get("error"):
            raise RuntimeError(result["error"])
            
        raw_report  = result["report"]
        final_report = ensure_report_structure(raw_report, query)

        # Compute RAGAS-style evaluation metrics
        eval_scores: dict = {}
        try:
            from .evaluation.metrics import compute_all_metrics
            eval_scores = compute_all_metrics(
                query=query,
                report=final_report,
                web_context=result.get("web_context", ""),
                rag_context=result.get("rag_context", ""),
                sub_queries=result.get("sub_queries", []),
            )
        except Exception as eval_err:
            import logging
            logging.getLogger(__name__).warning(f"Eval metrics failed: {eval_err}")

        # Build agent_meta to surface in the API response
        agent_meta = {
            "source_quality_score": result.get("source_quality_score"),
            "validation_result":    result.get("validation_result"),
            "review_score":         result.get("review_score"),
            "review_passed":        result.get("review_passed"),
            "review_feedback":      result.get("review_feedback"),
            "loop_count":           result.get("loop_count"),
            "eval_scores":          eval_scores,
        }

        # Store in memory for future context
        memory.add(query, final_report)

        async with factory() as session:
            await update_query(
                session,
                record_id,
                status="done",
                report_markdown=final_report,
                metadata=agent_meta,
            )
    except Exception as e:
        async with factory() as session:
            await update_query(
                session,
                record_id,
                status="error",
                error_message=str(e),
            )


# ── Auth Routes ───────────────────────────────────────────────────────────────

@app.post("/api/auth/register", response_model=TokenResponse)
async def register(request: RegisterRequest):
    """Register a new user and return a JWT access token."""
    username = request.username.strip()
    email = request.email.lower().strip()
    password = request.password

    if len(username) < 2:
        raise HTTPException(status_code=400, detail="Username must be at least 2 characters")
    if "@" not in email:
        raise HTTPException(status_code=400, detail="Invalid email address")
    if len(password) < 6:
        raise HTTPException(status_code=400, detail="Password must be at least 6 characters")

    factory = get_db()
    async with factory() as session:
        existing = await get_user_by_email(session, email)
        if existing:
            raise HTTPException(status_code=409, detail="An account with this email already exists")
        password_hash = hash_password(password)
        user = await create_user(session, username, email, password_hash)

    token = create_access_token(user.id, user.email, user.username)
    return TokenResponse(
        access_token=token,
        user={"id": user.id, "username": user.username, "email": user.email,
              "created_at": user.created_at.isoformat()},
    )


@app.post("/api/auth/login", response_model=TokenResponse)
async def login(request: LoginRequest):
    """Authenticate with email + password and return a JWT access token."""
    email = request.email.lower().strip()

    factory = get_db()
    async with factory() as session:
        user = await get_user_by_email(session, email)

    if not user or not verify_password(request.password, user.password_hash):
        raise HTTPException(status_code=401, detail="Incorrect email or password")

    token = create_access_token(user.id, user.email, user.username)
    return TokenResponse(
        access_token=token,
        user={"id": user.id, "username": user.username, "email": user.email,
              "created_at": user.created_at.isoformat()},
    )


@app.get("/api/auth/me", response_model=UserResponse)
async def get_me(payload: dict = Depends(get_current_user_payload)):
    """Return the currently authenticated user's profile."""
    factory = get_db()
    async with factory() as session:
        user = await get_user_by_id(session, payload["sub"])

    if not user:
        raise HTTPException(status_code=404, detail="User not found")

    return UserResponse(
        id=user.id,
        username=user.username,
        email=user.email,
        created_at=user.created_at.isoformat(),
    )


# ── Research Routes ──────────────────────────────────────────────────────────────

@app.post("/api/query", response_model=QueryResponse)
async def submit_query(request: QueryRequest, background_tasks: BackgroundTasks):
    """Submit a research query. Processing happens in the background."""
    if not request.query.strip():
        raise HTTPException(status_code=400, detail="Query cannot be empty")

    factory = get_db()
    async with factory() as session:
        record = await create_query(session, request.query.strip())

    background_tasks.add_task(run_research_task, record.id, record.query)

    return QueryResponse(id=record.id, status=record.status, query=record.query)


@app.get("/api/report/{report_id}", response_model=ReportResponse)
async def get_report(report_id: str):
    """Get a specific report by ID (poll for status/result)."""
    import json as _json

    factory = get_db()
    async with factory() as session:
        record = await get_query(session, report_id)

    if not record:
        raise HTTPException(status_code=404, detail="Report not found")

    # Merge markdown stats with stored agent metadata
    meta: dict = {}
    if record.report_markdown:
        meta.update(report_metadata(record.report_markdown))
    if record.metadata_json:
        try:
            meta.update(_json.loads(record.metadata_json))
        except Exception:
            pass

    return ReportResponse(
        id=record.id,
        query=record.query,
        status=record.status,
        report_markdown=record.report_markdown or record.error_message,
        metadata=meta or None,
        created_at=record.created_at.isoformat(),
    )


@app.get("/api/report/{report_id}/pdf")
async def download_pdf(report_id: str):
    """Download a completed report as a PDF file."""
    factory = get_db()
    async with factory() as session:
        record = await get_query(session, report_id)

    if not record:
        raise HTTPException(status_code=404, detail="Report not found")
    if record.status != "done" or not record.report_markdown:
        raise HTTPException(status_code=400, detail="Report is not ready yet")

    loop = asyncio.get_event_loop()
    pdf_bytes = await loop.run_in_executor(None, export_pdf, record.report_markdown)

    safe_name = "".join(c if c.isalnum() or c in " -_" else "_" for c in record.query[:40])
    filename = f"research_{safe_name}.pdf"

    return Response(
        content=pdf_bytes,
        media_type="application/pdf",
        headers={"Content-Disposition": f'attachment; filename="{filename}"'},
    )


@app.get("/api/history", response_model=List[HistoryItem])
async def get_history():
    """Return list of all past queries."""
    factory = get_db()
    async with factory() as session:
        records = await list_queries(session)

    items = []
    for r in records:
        summary = None
        if r.report_markdown:
            from .output.formatter import extract_summary
            summary = extract_summary(r.report_markdown)
        items.append(
            HistoryItem(
                id=r.id,
                query=r.query,
                status=r.status,
                summary=summary,
                created_at=r.created_at.isoformat(),
            )
        )
    return items


@app.delete("/api/history/{record_id}")
async def remove_history_item(record_id: str):
    """Delete a past query."""
    factory = get_db()
    async with factory() as session:
        deleted = await delete_query(session, record_id)

    if not deleted:
        raise HTTPException(status_code=404, detail="Record not found")
    return {"deleted": True}


@app.post("/api/upload", response_model=DocumentResponse)
async def upload_document(file: UploadFile = File(...)):
    """Upload a PDF or DOCX file to be indexed for RAG."""
    allowed_ext = {".pdf", ".docx", ".doc"}
    ext = Path(file.filename).suffix.lower()
    if ext not in allowed_ext:
        raise HTTPException(
            status_code=400,
            detail=f"Unsupported file type '{ext}'. Allowed: {allowed_ext}",
        )

    save_path = UPLOAD_DIR / file.filename
    with open(save_path, "wb") as f:
        shutil.copyfileobj(file.file, f)

    # Ingest into ChromaDB (run in executor as it's sync/blocking)
    loop = asyncio.get_event_loop()
    chunk_count = await loop.run_in_executor(None, ingest_document, str(save_path))

    factory = get_db()
    async with factory() as session:
        doc = await create_document(session, file.filename, str(save_path), chunk_count)

    return DocumentResponse(
        id=doc.id,
        filename=doc.filename,
        chunk_count=doc.chunk_count,
        created_at=doc.created_at.isoformat(),
    )


@app.get("/api/documents", response_model=List[DocumentResponse])
async def get_documents():
    """List all uploaded documents."""
    factory = get_db()
    async with factory() as session:
        docs = await list_documents(session)

    return [
        DocumentResponse(
            id=d.id,
            filename=d.filename,
            chunk_count=d.chunk_count,
            created_at=d.created_at.isoformat(),
        )
        for d in docs
    ]


@app.get("/health")
async def health():
    return {"status": "ok"}


@app.get("/api/report/{report_id}/trace")
async def get_report_trace(report_id: str):
    """
    Get the execution trace for a report.
    Demonstrates Session 10: DecisionTrace, audit logging.
    """
    try:
        from .trace import get_trace
        trace = get_trace(report_id)
        if not trace:
            raise HTTPException(status_code=404, detail="Trace not found")
        return trace.to_dict()
    except HTTPException:
        raise
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))


@app.get("/api/agents/status")
async def get_agents_status():
    """
    Returns a health snapshot of the 6-agent pipeline and key stats.
    Concept: Session 14 (LLMOps, production monitoring, dashboards).
    Used by the frontend Pipeline Status panel.
    """
    agents = [
        {"id": "planner",      "name": "Research Planner",  "icon": "", "role": "Decomposes query into sub-questions"},
        {"id": "researcher",   "name": "Retrieval Agent",   "icon": "", "role": "Hybrid BM25 + semantic search"},
        {"id": "validator",    "name": "Source Validator",  "icon": "", "role": "Scores source quality 1–10"},
        {"id": "summarizer",   "name": "Summarizer",        "icon": "", "role": "Extracts key findings"},
        {"id": "report_writer","name": "Report Writer",     "icon": "", "role": "Formats structured report"},
        {"id": "reviewer",     "name": "Reviewer",          "icon": "", "role": "QA gate with ReAct loop"},
    ]

    # Collect aggregate stats from trace store
    try:
        from .trace import _traces
        total_jobs = len(_traces)
        if total_jobs > 0:
            all_traces = list(_traces.values())
            avg_duration = sum(
                t.to_dict().get("total_duration_ms", 0) for t in all_traces
            ) / total_jobs
            all_passed = sum(1 for t in all_traces if t.to_dict().get("all_passed", False))
            success_rate = round(all_passed / total_jobs * 100, 1)
        else:
            avg_duration = 0
            success_rate = 100.0
    except Exception:
        total_jobs = 0
        avg_duration = 0
        success_rate = 100.0

    return {
        "agents": agents,
        "pipeline_topology": {
            "flow": ["planner", "researcher", "validator", "summarizer", "report_writer", "reviewer"],
            "conditional_edge": {"from": "reviewer", "to": "researcher", "condition": "review_score < 7 AND loop < 2"},
            "max_loops": 2,
        },
        "stats": {
            "total_jobs": total_jobs,
            "avg_duration_ms": round(avg_duration, 0),
            "success_rate_pct": success_rate,
        },
    }


@app.get("/api/report/{report_id}/stream")
async def stream_report_progress(report_id: str):
    """
    SSE (Server-Sent Events) endpoint for real-time agent progress updates.
    Concept: Session 12 (streaming APIs, real-time GenAI products).
    
    The frontend polls the standard /api/report/{id} endpoint for status,
    but this SSE endpoint pushes trace events as they happen for a richer
    live experience.
    """
    async def event_generator():
        # Poll trace until complete or timeout (60 seconds)
        from .trace import get_trace
        timeout = 60
        elapsed = 0
        last_step_count = 0

        while elapsed < timeout:
            trace = get_trace(report_id)
            if trace:
                steps = trace.to_dict().get("steps", [])
                # Send any new steps since last poll
                new_steps = steps[last_step_count:]
                for step in new_steps:
                    data = _json_module.dumps({"type": "agent_step", "step": step})
                    yield f"data: {data}\n\n"
                last_step_count = len(steps)

            # Check if report is done
            try:
                factory = get_db()
                async with factory() as session:
                    record = await get_query(session, report_id)
                if record and record.status in ("done", "error"):
                    payload = _json_module.dumps({"type": "complete", "status": record.status})
                    yield f"data: {payload}\n\n"
                    break
            except Exception:
                pass

            await asyncio.sleep(1.5)
            elapsed += 1.5

        yield f"data: {_json_module.dumps({'type': 'timeout'})}\n\n"

    return StreamingResponse(
        event_generator(),
        media_type="text/event-stream",
        headers={
            "Cache-Control": "no-cache",
            "Connection": "keep-alive",
            "X-Accel-Buffering": "no",
        },
    )


@app.get("/api/agents/capabilities")
async def get_agent_capabilities():
    """
    Returns formal capability declarations for all 6 agents.
    Concept: Session 9 (agent identity, multi-agent architecture).
    """
    try:
        from .agent.multi_agent_coordinator import get_capability_registry
        registry = get_capability_registry()
        return {
            "agents": registry.get_all(),
            "pipeline": registry.get_pipeline_summary(),
        }
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))


@app.get("/api/agents/health")
async def get_agents_health():
    """
    Returns rolling health metrics for each agent (latency, success rate).
    Concept: Session 14 (LLMOps, production monitoring).
    """
    try:
        from .agent.multi_agent_coordinator import get_health_monitor
        monitor = get_health_monitor()
        return {
            "agent_metrics": monitor.get_all_metrics(),
            "overall_healthy": all(
                monitor.is_healthy(aid)
                for aid in ["planner","researcher","validator","summarizer","report_writer","reviewer"]
            ),
        }
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))


# ── Static Files & Frontend ───────────────────────────────────────────────────

# Define the path to the frontend build directory
# In the unified Docker structure, this will be next to the 'app' package
FRONTEND_PATH = os.getenv("FRONTEND_PATH")
if FRONTEND_PATH:
    FRONTEND_PATH = Path(FRONTEND_PATH)
else:
    # Fallback to local development path: backend/app/main.py -> backend/../frontend/dist
    FRONTEND_PATH = Path(__file__).parent.parent.parent / "frontend" / "dist"

if FRONTEND_PATH.exists():
    app.mount("/assets", StaticFiles(directory=FRONTEND_PATH / "assets"), name="assets")

    @app.get("/{full_path:path}")
    async def serve_frontend(full_path: str):
        # If the path looks like an API call, it should have been caught by routes above.
        # Otherwise, serve index.html for React Router support.
        if full_path.startswith("api/"):
            raise HTTPException(status_code=404, detail="API route not found")
        
        index_file = FRONTEND_PATH / "index.html"
        if index_file.exists():
            return FileResponse(index_file)
        
        return {"error": "Frontend build not found"}
else:
    print(f"Warning: Frontend path {FRONTEND_PATH} not found. Static files will not be served.")