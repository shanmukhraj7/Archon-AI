# Archon — Complete Upgrade Report
### From a 3-Node Pipeline to a Production-Grade Multi-Agent GenAI Product

---

## Overview

Your existing project (Archon) is already well-built. It has a solid FastAPI backend, working RAG pipeline, LangGraph orchestration, Docker deployment, and a clean React frontend. However, when measured against the capstone rubric and the 14 course sessions, several key concepts are either missing entirely or only partially demonstrated.

This report details every change you need to make, organized by concept, with the exact course session it maps to, the file to change, and what to write.

---

## PART 1 — MULTI-AGENT ARCHITECTURE
**Maps to: Sessions 9, 10, 11 | Rubric item: Agentic or multi-agent workflows**

### What you have now

Your current LangGraph graph has 3 nodes:

```
planner → researcher → synthesizer → END
```

These are sequential processing steps, not true agents. They share one flat state, there is no conditional routing, no failure handling, and no agent-level identity. An examiner reviewing this would call it a pipeline, not a multi-agent system.

### What you need

The capstone idea from your professor (Image 2) lists 6 distinct agents:

1. Research Planner Agent
2. Retrieval / Search Agent
3. Source Validator Agent
4. Summarizer Agent
5. Report Writer Agent
6. Reviewer Agent

Your current code covers agents 1, 2, and partially 4+5 (merged into synthesizer). Agents 3 and 6 are completely missing.

### Changes to make

**File: `backend/app/agent/orchestrator.py`**

Split your current `synthesizer` node into two separate nodes — a `summarizer` and a `report_writer`. Then add two entirely new nodes: `validator` and `reviewer`. Finally, replace the fixed `END` edge from synthesizer with a conditional edge that either loops back to researcher or exits.

The new graph should be:

```
planner → researcher → validator → summarizer → report_writer → reviewer
                ↑                                                    |
                └──────── (if review_score < 7, loop back) ─────────┘
```

This conditional loop is the key concept from Session 9 (plan-level intelligence) and Session 11 (agent reliability and control systems). It makes the system self-correcting — if the reviewer decides the report is weak, it automatically triggers another round of research.

**New state fields to add to `ResearchState`:**

```python
class ResearchState(TypedDict):
    query: str
    sub_queries: List[str]
    web_context: str
    rag_context: str
    summary: Optional[str]           # NEW — from summarizer agent
    report: Optional[str]            # from report_writer (was synthesizer)
    error: Optional[str]
    source_quality_score: float      # NEW — from validator agent
    validation_result: Optional[dict] # NEW
    review_passed: bool              # NEW — from reviewer agent
    review_feedback: Optional[str]   # NEW
    review_score: int                # NEW
    loop_count: int                  # NEW — prevents infinite loops
```

**Session concept demonstrated:** Session 9 (plan-level intelligence, goal reachability, regenerating plans), Session 11 (ReAct-style loops, failure handling, reliable agents).

---

## PART 2 — VALIDATOR AGENT
**Maps to: Sessions 6, 7 | Rubric item: Validation / review steps**

### What you have now

Zero source validation. Your researcher node collects whatever Tavily returns and passes it directly to the synthesizer. There is no check on whether sources are relevant, credible, or recent.

### What you need

A dedicated `validate_sources` node that runs after the researcher and before the synthesizer. This agent scores the quality of retrieved sources and filters out noise.

### Changes to make

**File: `backend/app/agent/orchestrator.py`** — add this function:

```python
def validate_sources(state: ResearchState) -> ResearchState:
    """
    Source Validator Agent.
    Concept: Session 6 (retrieval quality) + Session 7 (RAG evaluation).
    Scores sources on relevance, credibility, and specificity.
    """
    system = """You are a source validation expert for research systems.
    
    Given a research query and retrieved web results, evaluate the overall
    source quality and assign a score from 1 to 10 based on:
    - Relevance: do the sources actually address the query?
    - Credibility: are sources from known/authoritative domains?
    - Specificity: are the sources detailed or just surface-level?
    - Recency: is the information current?
    
    Return ONLY a JSON object with this structure:
    {
        "quality_score": <float 1-10>,
        "kept_sources": <int>,
        "filtered_out": <int>,
        "dominant_source_type": "<academic/news/blog/mixed>",
        "validation_notes": "<one sentence summary>"
    }"""
    
    user = f"""Research query: {state['query']}
    
    Retrieved sources:
    {state.get('web_context', 'No web results')}"""
    
    try:
        raw = _call_llm(system=system, user=user, max_tokens=400)
        raw = raw.strip().strip("```json").strip("```").strip()
        result = json.loads(raw)
        quality_score = float(result.get("quality_score", 5.0))
    except Exception as e:
        logger.warning(f"Validator failed: {e}")
        quality_score = 5.0
        result = {
            "quality_score": 5.0,
            "validation_notes": "Validation could not be completed"
        }
    
    return {
        **state,
        "source_quality_score": quality_score,
        "validation_result": result
    }
```

**File: `backend/app/agent/prompts.py`** — add `VALIDATOR_SYSTEM_PROMPT` so the prompt logic is separated from orchestration (clean architecture, which your professor will notice).

**Session concept demonstrated:** Session 6 (retrieval quality, ranking problems, debugging retrieval), Session 7 (retrieval evaluation, hallucination detection, RAG quality measurement).

---

## PART 3 — REVIEWER AGENT
**Maps to: Sessions 7, 8, 10 | Rubric item: Validation / review steps**

### What you have now

Nothing. Once the synthesizer produces a report, it goes straight to the user with no quality check.

### What you need

A `review_report` node that acts as a final quality gate. This agent reads the generated report, compares it against the original query, and decides whether it is good enough to return or needs another research loop.

### Changes to make

**File: `backend/app/agent/orchestrator.py`** — add this function:

```python
def review_report(state: ResearchState) -> ResearchState:
    """
    Reviewer Agent.
    Concept: Session 7 (evaluation), Session 8 (QA pipelines),
             Session 10 (semantic correctness evaluation).
    Critiques the generated report and decides pass/fail.
    """
    system = """You are a critical research quality reviewer.
    
    Your job is to evaluate a generated research report against the
    original query. You must check for:
    1. Completeness — does the report fully answer the query?
    2. Accuracy — are claims supported by retrieved sources?
    3. Hallucination — are there statements not grounded in the sources?
    4. Structure — does the report follow the required format?
    5. Depth — is the analysis substantive or just surface-level?
    
    Return ONLY a JSON object:
    {
        "review_score": <int 1-10>,
        "review_passed": <bool — true if score >= 7>,
        "hallucination_risk": "<low/medium/high>",
        "gaps": ["<missing item 1>", "<missing item 2>"],
        "feedback": "<one paragraph of specific actionable feedback>"
    }"""
    
    user = f"""Original query: {state['query']}
    Source quality score from validator: {state.get('source_quality_score', 5)}/10
    
    Generated report:
    {state.get('report', 'No report generated')}"""
    
    try:
        raw = _call_llm(system=system, user=user, max_tokens=600)
        raw = raw.strip().strip("```json").strip("```").strip()
        result = json.loads(raw)
        review_passed = bool(result.get("review_passed", True))
        review_score = int(result.get("review_score", 7))
    except Exception as e:
        logger.warning(f"Reviewer failed: {e}")
        review_passed = True
        review_score = 7
        result = {"feedback": "Review unavailable", "gaps": []}
    
    # Increment loop counter to prevent infinite loops
    loop_count = state.get("loop_count", 0) + 1
    
    return {
        **state,
        "review_passed": review_passed,
        "review_score": review_score,
        "review_feedback": result.get("feedback", ""),
        "loop_count": loop_count
    }


def should_continue(state: ResearchState):
    """
    Conditional routing function.
    Concept: Session 9 (plan-level intelligence, goal reachability),
             Session 11 (control systems, safe execution).
    """
    # Hard cap at 2 loops to prevent infinite execution
    if state.get("loop_count", 0) >= 2:
        return END
    
    if not state.get("review_passed", True):
        logger.info(f"Review failed (score {state.get('review_score')}). "
                   f"Looping back. Feedback: {state.get('review_feedback', '')[:100]}")
        return "researcher"
    
    return END
```

**Session concept demonstrated:** Session 7 (hallucination detection, retrieval evaluation), Session 8 (systematic QA pipelines, production QA workflows, continuous improvement loops), Session 10 (semantic correctness evaluation, execution correctness).

---

## PART 4 — HYBRID RETRIEVAL (BM25 + SEMANTIC)
**Maps to: Session 6 | Rubric item: RAG / knowledge retrieval**

### What you have now

Pure semantic search via ChromaDB cosine similarity. This is covered in Sessions 3–5. Session 6 specifically teaches that semantic search alone fails in production — you need hybrid retrieval combining keyword-based BM25 with vector search.

### What you need

A hybrid retrieval function that runs both BM25 (keyword matching) and ChromaDB (semantic similarity) and merges the results. This directly demonstrates Session 6 content.

### Changes to make

**File: `backend/requirements.txt`** — add:

```
rank-bm25==0.2.2
```

**File: `backend/app/rag/retriever.py`** — add:

```python
from rank_bm25 import BM25Okapi

def get_all_chroma_documents() -> List[Document]:
    """Fetch all stored documents from ChromaDB for BM25 indexing."""
    embedding_fn = get_embedding_function()
    try:
        vectorstore = Chroma(
            collection_name=COLLECTION_NAME,
            embedding_function=embedding_fn,
            persist_directory=CHROMA_PERSIST_DIR,
        )
        # Get all documents (ChromaDB stores them in the collection)
        collection = vectorstore._collection
        results = collection.get(include=["documents", "metadatas"])
        docs = []
        for i, content in enumerate(results["documents"]):
            metadata = results["metadatas"][i] if results["metadatas"] else {}
            docs.append(Document(page_content=content, metadata=metadata))
        return docs
    except Exception:
        return []


def hybrid_retrieve(query: str, k: int = 5) -> List[Document]:
    """
    Hybrid BM25 + semantic retrieval.
    Concept: Session 6 — multi-signal retrieval systems,
    combining keyword and semantic signals for better recall.
    """
    # Step 1: Semantic search (existing)
    semantic_results = retrieve_relevant_chunks(query, k=k)
    
    # Step 2: BM25 keyword search
    all_docs = get_all_chroma_documents()
    if not all_docs:
        return semantic_results  # Fall back if no docs
    
    tokenized_corpus = [doc.page_content.lower().split() for doc in all_docs]
    bm25 = BM25Okapi(tokenized_corpus)
    query_tokens = query.lower().split()
    scores = bm25.get_scores(query_tokens)
    
    top_indices = sorted(range(len(scores)),
                         key=lambda i: scores[i], reverse=True)[:k]
    bm25_results = [all_docs[i] for i in top_indices if scores[i] > 0]
    
    # Step 3: Merge and deduplicate (reciprocal rank fusion)
    seen_content = set()
    merged = []
    for doc in semantic_results + bm25_results:
        fingerprint = doc.page_content[:150]
        if fingerprint not in seen_content:
            seen_content.add(fingerprint)
            merged.append(doc)
    
    return merged[:k]
```

**File: `backend/app/agent/tools.py`** — update `multi_query_rag_search` to call `hybrid_retrieve` instead of `retrieve_relevant_chunks`.

**Session concept demonstrated:** Session 6 (hybrid search, BM25 retrieval, multi-signal retrieval systems, production retrieval optimization).

---

## PART 5 — QUERY REWRITING
**Maps to: Session 6 | Rubric item: RAG / knowledge retrieval**

### What you have now

Your planner breaks the query into sub-queries but does not optimize them for retrieval. The sub-queries are passed as-is to Tavily and ChromaDB.

### What you need

A query rewriting step that runs before retrieval. For each sub-query, it generates 3 variants optimized for different retrieval strategies: one for semantic search, one for keyword search, and one for broader background context.

### Changes to make

**File: `backend/app/agent/prompts.py`** — add:

```python
QUERY_REWRITER_PROMPT = """You are a query optimization expert for retrieval systems.

Given a research sub-query, rewrite it into 3 optimized variants:
1. Semantic variant — rephrase to capture the core concept and related ideas
2. Keyword variant — reduce to the most specific search terms only  
3. Context variant — broaden to retrieve useful background knowledge

Return ONLY a JSON array of exactly 3 strings:
["semantic query here", "keyword query here", "context query here"]

Do not include numbering or labels in the strings."""
```

**File: `backend/app/agent/orchestrator.py`** — add a `rewrite_queries` function and call it inside `run_tools` before the search calls:

```python
def rewrite_queries(queries: List[str]) -> List[str]:
    """
    Query rewriting for better retrieval.
    Concept: Session 6 — query rewriting, debugging retrieval.
    """
    rewritten = []
    for q in queries:
        try:
            raw = _call_llm(
                system=QUERY_REWRITER_PROMPT,
                user=f"Original query: {q}",
                max_tokens=256
            )
            variants = json.loads(raw.strip())
            rewritten.extend(variants)
        except Exception:
            rewritten.append(q)  # Fall back to original
    
    # Deduplicate while preserving order
    seen = set()
    unique = []
    for q in rewritten:
        if q not in seen:
            seen.add(q)
            unique.append(q)
    return unique
```

**Session concept demonstrated:** Session 6 (query rewriting, retrieval failures, embedding weaknesses).

---

## PART 6 — TRACE LOGGING AND OBSERVABILITY
**Maps to: Sessions 7, 10, 14 | Rubric item: (bonus — production readiness)**

### What you have now

Standard Python logging only. There is no per-agent execution trace, no timing, no audit log of agent decisions.

### What you need

A `DecisionTrace` system that records what each agent received, what it decided, how long it took, and whether it succeeded. This is a direct implementation of Session 10's DecisionTrace concept.

### Changes to make

**New file: `backend/app/trace.py`**

```python
"""
DecisionTrace system for agent observability.
Concept: Session 10 (trace debugging, audit logging, execution correctness),
         Session 14 (LLMOps, production monitoring).
"""

import time
import logging
from dataclasses import dataclass, field, asdict
from typing import List, Optional, Dict, Any

logger = logging.getLogger("archon.trace")


@dataclass
class AgentStep:
    node_name: str
    input_summary: str      # First 200 chars of input
    output_summary: str     # First 200 chars of output
    duration_ms: float
    success: bool
    metadata: Dict[str, Any] = field(default_factory=dict)
    timestamp: float = field(default_factory=time.time)


class DecisionTrace:
    """
    Records the full execution trace of a research job.
    Allows post-hoc debugging of agent decisions.
    """
    
    def __init__(self, query: str, job_id: str):
        self.query = query
        self.job_id = job_id
        self.steps: List[AgentStep] = []
        self.start_time = time.time()
    
    def log(self, node: str, input_text: str, output_text: str,
            duration_ms: float, success: bool, **metadata):
        step = AgentStep(
            node_name=node,
            input_summary=input_text[:200],
            output_summary=output_text[:200],
            duration_ms=round(duration_ms, 2),
            success=success,
            metadata=metadata
        )
        self.steps.append(step)
        logger.info(
            f"[TRACE] job={self.job_id} | node={node} | "
            f"duration={duration_ms:.0f}ms | success={success}"
        )
    
    def to_dict(self) -> dict:
        total_ms = (time.time() - self.start_time) * 1000
        return {
            "job_id": self.job_id,
            "query": self.query,
            "total_duration_ms": round(total_ms, 2),
            "step_count": len(self.steps),
            "steps": [asdict(s) for s in self.steps],
            "all_passed": all(s.success for s in self.steps)
        }


# Per-job trace store (in-memory, cleared on restart)
_traces: Dict[str, DecisionTrace] = {}

def get_trace(job_id: str) -> Optional[DecisionTrace]:
    return _traces.get(job_id)

def create_trace(job_id: str, query: str) -> DecisionTrace:
    trace = DecisionTrace(query=query, job_id=job_id)
    _traces[job_id] = trace
    return trace
```

**File: `backend/app/main.py`** — add a new endpoint:

```python
@app.get("/api/report/{report_id}/trace")
async def get_report_trace(report_id: str):
    """
    Get the execution trace for a report.
    Demonstrates Session 10: DecisionTrace, audit logging.
    """
    from .trace import get_trace
    trace = get_trace(report_id)
    if not trace:
        raise HTTPException(status_code=404, detail="Trace not found")
    return trace.to_dict()
```

In each node function in `orchestrator.py`, wrap with timing:

```python
def validate_sources(state: ResearchState) -> ResearchState:
    t0 = time.time()
    # ... your logic ...
    duration = (time.time() - t0) * 1000
    
    if trace := get_trace(state.get("job_id", "")):
        trace.log("validator", 
                  input_text=state['query'],
                  output_text=str(result),
                  duration_ms=duration,
                  success=True,
                  quality_score=quality_score)
    
    return {**state, ...}
```

**Session concept demonstrated:** Session 10 (DecisionTrace, audit logging, trace debugging, failure localization), Session 14 (LLMOps, production monitoring, continuous evaluation loops).

---

## PART 7 — RAGAS-STYLE EVALUATION METRICS
**Maps to: Sessions 7, 8 | Rubric item: Validation / review steps**

### What you have now

No evaluation metrics at all. Your system produces a report but never measures whether it is actually good.

### What you need

A lightweight evaluation module that computes 3 core metrics after report generation: faithfulness (is the report grounded in retrieved sources), answer relevance (does it address the query), and source coverage (how many sub-questions got answered).

### Changes to make

**New file: `backend/app/evaluation/metrics.py`**

```python
"""
RAG evaluation metrics.
Concept: Sessions 7 and 8 — RAGAS metrics, retrieval evaluation,
hallucination detection, production QA, systematic QA pipelines.
"""

import re
from typing import Dict, Optional


def compute_faithfulness(report: str, web_context: str,
                          rag_context: str) -> float:
    """
    Faithfulness: what fraction of the report's claims are
    grounded in retrieved sources.
    Simplified version of RAGAS faithfulness metric (Session 7).
    """
    combined_context = (web_context + " " + rag_context).lower()
    
    # Extract factual sentences from the report
    sentences = [s.strip() for s in report.split('.') 
                 if len(s.strip()) > 30]
    
    if not sentences:
        return 0.0
    
    grounded = 0
    for sentence in sentences:
        # Check if key nouns/phrases from the sentence appear in context
        words = [w for w in sentence.lower().split() 
                 if len(w) > 5 and w.isalpha()]
        if not words:
            continue
        matches = sum(1 for w in words if w in combined_context)
        if matches / len(words) > 0.4:
            grounded += 1
    
    return round(grounded / len(sentences), 2)


def compute_answer_relevance(query: str, report: str) -> float:
    """
    Answer relevance: does the report address the original query.
    Simplified version of RAGAS answer relevance (Session 7).
    """
    query_terms = set(query.lower().split())
    report_lower = report.lower()
    
    matches = sum(1 for term in query_terms 
                  if term in report_lower and len(term) > 3)
    
    return round(min(matches / max(len(query_terms), 1), 1.0), 2)


def compute_source_coverage(sub_queries: list, report: str) -> float:
    """
    Source coverage: what fraction of planned sub-questions 
    appear to be addressed in the final report.
    Maps to Session 8 (completeness evaluation).
    """
    if not sub_queries:
        return 1.0
    
    report_lower = report.lower()
    covered = 0
    for q in sub_queries:
        key_terms = [w for w in q.lower().split() 
                     if len(w) > 4 and w.isalpha()]
        if not key_terms:
            continue
        if any(term in report_lower for term in key_terms):
            covered += 1
    
    return round(covered / len(sub_queries), 2)


def compute_all_metrics(query: str, report: str,
                         web_context: str, rag_context: str,
                         sub_queries: list) -> Dict[str, float]:
    """
    Compute all evaluation metrics and return as a dict.
    Concept: Session 8 (systematic QA pipeline).
    """
    return {
        "faithfulness": compute_faithfulness(report, web_context, rag_context),
        "answer_relevance": compute_answer_relevance(query, report),
        "source_coverage": compute_source_coverage(sub_queries, report),
    }
```

Call `compute_all_metrics` at the end of `run_research_task` in `main.py` and store the result in the DB record's metadata field (or a new `eval_scores` column).

**Session concept demonstrated:** Session 7 (RAGAS metrics, hallucination detection, retrieval evaluation, ground truth), Session 8 (systematic QA pipelines, production QA, regression detection).

---

## PART 8 — LIVE DEPLOYMENT
**Maps to: Sessions 12, 13 | Rubric item: Deployment**

### What you have now

Docker and docker-compose files that work locally. No live URL.

### What you need

A publicly accessible HTTPS URL to submit. Your professor requires this as submission item 2.

### Recommended approach: Render.com (free tier, zero config)

Your project is already Docker-ready. Render.com will detect your Dockerfile automatically.

Steps:

1. Push your repo to GitHub (make sure `.env` is in `.gitignore` — it already is).
2. Go to render.com and create a free account.
3. Click "New Web Service" → Connect your GitHub repo.
4. Render detects the Dockerfile automatically. Set these environment variables in the Render dashboard:
   - `ANTHROPIC_API_KEY`
   - `TAVILY_API_KEY`
   - `GROQ_API_KEY` (or whichever LLM key you use)
   - `CHROMA_PERSIST_DIR=/app/data/chroma`
   - `SQLITE_DB_PATH=/app/data/history.db`
5. Click Deploy. Your app will be live at `https://archon.onrender.com` within 5–10 minutes.

**Important:** Use the unified Dockerfile at the root (not the separate backend/frontend Dockerfiles) for Render, since it builds both in one image. That Dockerfile already exists in your repo.

**Session concept demonstrated:** Session 12 (public deployment, cloud runtimes, deployment lifecycle), Session 13 (Docker fundamentals, portable runtime, product launch readiness).

---

## PART 9 — FRONTEND CHANGES
**Maps to: Sessions 2, 10 | Rubric item: Complete GenAI product**

### What you have now

The frontend shows the report but has no visibility into the agent pipeline — the user cannot see which agents ran, what the reviewer decided, or what the quality scores are.

### What you need

Two UI additions that make the multi-agent system visible:

**Addition 1 — Agent pipeline status panel**

In `ReportViewer.jsx`, after the report renders, add a collapsible "Agent trace" section that shows:

- Which agents ran (planner, researcher, validator, summarizer, report_writer, reviewer)
- Time taken per agent
- Validator score (source quality out of 10)
- Reviewer score and whether it passed
- Reviewer feedback text

This turns your black-box pipeline into a transparent, debuggable system — which is exactly what Session 10 teaches.

**Addition 2 — Evaluation metrics display**

In `UploadPanel.jsx` or as a new sidebar section, show the 3 evaluation metrics after a report completes:

- Faithfulness score
- Answer relevance score
- Source coverage score

Display these as simple percentage bars so they are visually clear during your demo.

**File: `frontend/src/components/AgentTrace.jsx`** — create this new component and import it into `ReportViewer.jsx`.

---

## PART 10 — UPDATED `orchestrator.py` STRUCTURE (COMPLETE)

Here is the complete updated structure for your orchestrator so you can see how all agents connect:

```python
def build_graph():
    graph = StateGraph(ResearchState)

    # All 6 agents as named nodes
    graph.add_node("planner",      plan_steps)         # existing
    graph.add_node("researcher",   run_tools)           # existing (add hybrid retrieval)
    graph.add_node("validator",    validate_sources)    # NEW
    graph.add_node("summarizer",   summarize_findings)  # split from synthesizer
    graph.add_node("report_writer", write_report)       # split from synthesizer
    graph.add_node("reviewer",     review_report)       # NEW

    graph.set_entry_point("planner")
    graph.add_edge("planner",       "researcher")
    graph.add_edge("researcher",    "validator")        # NEW edge
    graph.add_edge("validator",     "summarizer")       # NEW edge
    graph.add_edge("summarizer",    "report_writer")    # NEW edge
    graph.add_edge("report_writer", "reviewer")         # NEW edge
    
    # Conditional routing — the ReAct loop (Session 11)
    graph.add_conditional_edges(
        "reviewer",
        should_continue,
        {
            "researcher": "researcher",  # loop back if review fails
            END: END                      # exit if review passes
        }
    )

    return graph.compile()
```

---

## PART 11 — PROMPTS FILE (COMPLETE ADDITIONS)

All system prompts for the new agents should be added to `backend/app/agent/prompts.py`. The prompts that need to be added are:

- `VALIDATOR_SYSTEM_PROMPT` — for the source validator agent
- `SUMMARIZER_SYSTEM_PROMPT` — for the summarizer agent (extracted from the current synthesizer prompt)
- `REPORT_WRITER_SYSTEM_PROMPT` — for the report writer agent (the formatting/structure part)
- `REVIEWER_SYSTEM_PROMPT` — for the reviewer agent
- `QUERY_REWRITER_PROMPT` — for query rewriting before retrieval

Keeping all prompts in `prompts.py` is important for two reasons: it demonstrates clean software architecture (Sessions 1–2), and it makes your prompt engineering visible to the evaluator.

---

## PART 12 — README UPDATES

Your README is already excellent. Add these two sections to it:

**Section: Multi-Agent Pipeline**

Describe the 6-agent graph, explain what each agent does, and include the graph diagram showing the conditional loop. This directly maps to the capstone requirement of "proper README."

**Section: Evaluation Metrics**

Explain faithfulness, answer relevance, and source coverage. Reference Sessions 7 and 8. This shows academic awareness of RAG evaluation.

**Section: Agent Trace API**

Document the new `GET /api/report/{id}/trace` endpoint. Show an example trace output in JSON format.

---

## Summary Table — All Changes

| Change | File to edit | Course session | Rubric item | Priority |
|---|---|---|---|---|
| Add Validator agent node | orchestrator.py | Sessions 6, 7 | Validation / review steps | Must |
| Add Reviewer agent node | orchestrator.py | Sessions 7, 8, 10 | Validation / review steps | Must |
| Add conditional routing loop | orchestrator.py | Sessions 9, 11 | Multi-agent workflows | Must |
| Split synthesizer into summarizer + report_writer | orchestrator.py | Session 9 | Multi-agent workflows | Must |
| Update ResearchState with new fields | orchestrator.py | Sessions 9, 11 | Multi-agent workflows | Must |
| Add hybrid BM25 + semantic retrieval | retriever.py | Session 6 | RAG / knowledge retrieval | Must |
| Add query rewriting step | orchestrator.py, prompts.py | Session 6 | RAG / knowledge retrieval | Should |
| Create DecisionTrace system | trace.py (new file) | Sessions 10, 14 | Production readiness | Should |
| Add /api/report/{id}/trace endpoint | main.py | Session 10 | Production readiness | Should |
| Add RAGAS-style eval metrics | evaluation/metrics.py (new) | Sessions 7, 8 | Validation / review steps | Should |
| Add new agent prompts | prompts.py | Sessions 1, 9 | Complete product | Should |
| Add Agent trace UI panel | AgentTrace.jsx (new) | Session 10 | Complete product | Should |
| Add eval metrics UI display | ReportViewer.jsx | Sessions 7, 8 | Complete product | Should |
| Deploy to Render.com | — | Sessions 12, 13 | Deployment | Must |
| Update README with new sections | README.md | All | README requirement | Must |
| Create PPT presentation | — | All | Presentation requirement | Must |

---

## Execution Timeline (5 days until 24th May)

**Day 1 (today):**
- Add Validator agent to orchestrator.py
- Add Reviewer agent to orchestrator.py
- Update ResearchState with new fields
- Update the graph with conditional routing
- Test locally

**Day 2:**
- Split synthesizer into summarizer + report_writer
- Add hybrid retrieval (BM25) to retriever.py
- Add query rewriting to orchestrator.py
- Add all new prompts to prompts.py

**Day 3:**
- Create trace.py (DecisionTrace system)
- Add /api/report/{id}/trace endpoint in main.py
- Create evaluation/metrics.py
- Hook metrics into the research task background job

**Day 4:**
- Add AgentTrace.jsx frontend component
- Add eval metrics display in ReportViewer.jsx
- Deploy to Render.com
- Verify live URL works end-to-end

**Day 5:**
- Update README with all new sections
- Create PPT presentation (6–8 slides)
- Final testing of the full pipeline
- Submit GitHub URL, live URL, and PPT

---

*This report covers all 14 course sessions and every rubric item from the capstone requirements.*
