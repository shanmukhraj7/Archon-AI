"""
LangGraph-based orchestrator — 6-agent multi-agent research pipeline.

Pipeline:
    planner → researcher → validator → summarizer → report_writer → reviewer
                  ↑                                                      |
                  └──────── (if review_score < 7 AND loop < 2) ─────────┘

Session concepts demonstrated:
  - Session 9:  Plan-level intelligence, goal reachability, regenerating plans
  - Session 10: DecisionTrace, audit logging, execution correctness
  - Session 11: ReAct-style loops, failure handling, reliable agents
"""

import os
import json
import time
import asyncio
import logging
from typing import TypedDict, List, Optional

from langgraph.graph import StateGraph, END

from .prompts import (
    PLANNER_PROMPT,
    VALIDATOR_SYSTEM_PROMPT,
    SUMMARIZER_SYSTEM_PROMPT,
    SUMMARIZER_USER_TEMPLATE,
    REPORT_WRITER_SYSTEM_PROMPT,
    REPORT_WRITER_USER_TEMPLATE,
    REVIEWER_SYSTEM_PROMPT,
    QUERY_REWRITER_PROMPT,
)
from .tools import multi_query_web_search, multi_query_rag_search

logger = logging.getLogger(__name__)


# ── State ─────────────────────────────────────────────────────────────────────

class ResearchState(TypedDict):
    query: str
    sub_queries: List[str]
    web_context: str
    rag_context: str
    summary: Optional[str]           # from summarizer agent
    report: Optional[str]            # from report_writer agent
    error: Optional[str]
    source_quality_score: float      # from validator agent
    validation_result: Optional[dict]
    review_passed: bool              # from reviewer agent
    review_feedback: Optional[str]
    review_score: int
    loop_count: int                  # prevents infinite loops
    job_id: Optional[str]            # for DecisionTrace lookup


# ── LLM router ────────────────────────────────────────────────────────────────

_FALLTHROUGH_PHRASES = (
    "quota", "rate limit", "429", "exceeded", "too many requests",
    "resource exhausted", "billing", "safety",
)


def _is_quota_error(e: Exception) -> bool:
    return any(p in str(e).lower() for p in _FALLTHROUGH_PHRASES)


def _call_llm(system: str, user: str, max_tokens: int = 4096, require_json: bool = False) -> str:
    """
    Smart LLM router: Gemini Flash → Groq llama-3.1-8b-instant → error.
    Override with LLM_PROVIDER env var: 'gemini', 'groq', or 'auto' (default).
    """
    provider = os.getenv("LLM_PROVIDER", "auto").lower()

    providers_map = {
        "gemini": [_call_gemini],
        "groq":   [_call_groq],
        "auto":   [_call_gemini, _call_groq],
    }
    chain = providers_map.get(provider, [_call_gemini, _call_groq])

    last_err = None
    for fn in chain:
        try:
            name = fn.__name__.replace("_call_", "")
            logger.info(f"Trying LLM provider: {name}")
            result = fn(system, user, max_tokens, require_json)
            logger.info(f"Success with provider: {name}")
            return result
        except Exception as e:
            last_err = e
            if _is_quota_error(e):
                logger.warning(
                    f"{fn.__name__} hit quota/rate-limit — falling through. Error: {e}"
                )
                continue
            # Non-quota errors (bad key, network, etc.) bubble immediately
            logger.warning(f"{fn.__name__} failed with non-quota error: {e}")
            raise

    raise RuntimeError(
        f"All LLM providers exhausted. Last error: {last_err}. "
        "Check GEMINI_API_KEY and GROQ_API_KEY environment variables."
    )


# ── Provider implementations ──────────────────────────────────────────────────

def _call_gemini(system: str, user: str, max_tokens: int, require_json: bool = False) -> str:
    """Call Google Gemini Flash via google-generativeai SDK."""
    import google.generativeai as genai

    api_key = os.environ.get("GEMINI_API_KEY")
    if not api_key:
        raise RuntimeError("GEMINI_API_KEY not set")

    genai.configure(api_key=api_key)
    generation_config = genai.GenerationConfig(
        max_output_tokens=max_tokens,
        temperature=0.3,
        response_mime_type="application/json" if require_json else "text/plain",
    )
    model = genai.GenerativeModel(
        model_name="gemini-2.0-flash",
        system_instruction=system,
        generation_config=generation_config,
    )
    response = model.generate_content(user)
    return response.text


def _call_groq(system: str, user: str, max_tokens: int, require_json: bool = False) -> str:
    """Call Groq (llama-3.1-8b-instant) via the official Groq SDK."""
    from groq import Groq

    api_key = os.environ.get("GROQ_API_KEY")
    if not api_key:
        raise RuntimeError("GROQ_API_KEY not set")

    client = Groq(api_key=api_key)
    kwargs: dict = dict(
        model="llama-3.1-8b-instant",
        messages=[
            {"role": "system", "content": system},
            {"role": "user",   "content": user},
        ],
        max_tokens=max_tokens,
        temperature=0.3,
    )
    if require_json:
        kwargs["response_format"] = {"type": "json_object"}

    chat = client.chat.completions.create(**kwargs)
    return chat.choices[0].message.content





# ── Trace helper ──────────────────────────────────────────────────────────────

def _log_trace(state: ResearchState, node: str, input_text: str,
               output_text: str, duration_ms: float, success: bool, **meta):
    """Log to DecisionTrace and AgentHealthMonitor."""
    try:
        from ..trace import get_trace
        trace = get_trace(state.get("job_id", ""))
        if trace:
            trace.log(node, input_text, output_text, duration_ms, success, **meta)
    except Exception:
        pass  # Trace is optional — never break agent execution

    # Record to health monitor
    try:
        from .multi_agent_coordinator import get_health_monitor
        monitor = get_health_monitor()
        if success:
            monitor.record_success(node, duration_ms)
        else:
            monitor.record_failure(node, meta.get("error", "unknown"), duration_ms)
    except Exception:
        pass


# ── Helper: query rewriting ───────────────────────────────────────────────────

def rewrite_queries(queries: List[str]) -> List[str]:
    """
    Query rewriting for better retrieval.
    Concept: Session 6 — query rewriting, debugging retrieval,
             embedding weaknesses.
    """
    rewritten = []
    for q in queries:
        try:
            raw = _call_llm(
                system=QUERY_REWRITER_PROMPT,
                user=f"Original query: {q}",
                max_tokens=256
            )
            raw = raw.strip()
            # Strip markdown code fences if present
            if raw.startswith("```"):
                raw = raw.split("```")[1]
                if raw.startswith("json"):
                    raw = raw[4:]
                raw = raw.strip()
            variants = json.loads(raw)
            if isinstance(variants, list):
                rewritten.extend(variants)
            else:
                rewritten.append(q)
        except Exception as exc:
            logger.warning(f"Query rewrite failed for '{q}': {exc}")
            rewritten.append(q)  # Fall back to original

    # Deduplicate while preserving order
    seen: set = set()
    unique = []
    for q in rewritten:
        if q not in seen:
            seen.add(q)
            unique.append(q)
    return unique


# ── Node 1 — Planner Agent ────────────────────────────────────────────────────

def plan_steps(state: ResearchState) -> ResearchState:
    """
    Research Planner Agent.
    Concept: Session 9 (plan-level intelligence, breaking queries into
             actionable sub-goals).
    """
    t0 = time.time()
    try:
        raw = _call_llm(
            system=PLANNER_PROMPT,
            user=f"Research query: {state['query']}",
            max_tokens=512,
            require_json=True
        )
        raw = raw.strip()
        if raw.startswith("```"):
            raw = raw.split("```")[1]
            if raw.startswith("json"):
                raw = raw[4:]
        raw = raw.strip()

        # Robust fallback using regex
        import re
        match = re.search(r"(\[.*\]|\{.*\})", raw, re.DOTALL)
        if match:
            raw = match.group(1)

        sub_queries = json.loads(raw)
        if not isinstance(sub_queries, list):
            sub_queries = [state["query"]]
    except Exception as e:
        logger.warning(f"[planner] Failed: {e}")
        return {**state, "error": f"Planner failed: {e}"}

    duration = (time.time() - t0) * 1000
    _log_trace(state, "planner", state["query"],
               str(sub_queries), duration, True,
               sub_query_count=len(sub_queries))
    logger.info(f"[planner] Generated {len(sub_queries)} sub-queries")

    return {**state, "sub_queries": sub_queries}


# ── Node 2 — Researcher Agent ─────────────────────────────────────────────────

def run_tools(state: ResearchState) -> ResearchState:
    """
    Retrieval / Search Agent.
    Concept: Session 6 (hybrid retrieval, query rewriting).
    """
    t0 = time.time()
    
    if state.get("error"):
        return state

    queries = state.get("sub_queries") or [state["query"]]

    # Query rewriting for better retrieval (Session 6)
    rewritten = rewrite_queries(queries)
    logger.info(f"[researcher] Rewritten {len(queries)} queries → {len(rewritten)} variants")

    web_context = ""
    rag_context = ""

    try:
        web_context = multi_query_web_search(rewritten, max_per_query=3)
    except Exception as e:
        web_context = f"Web search unavailable: {e}"

    try:
        rag_context = multi_query_rag_search(rewritten, k_per_query=3)
    except Exception as e:
        rag_context = f"Document search unavailable: {e}"

    if not web_context and not rag_context or "unavailable" in web_context and "unavailable" in rag_context:
        return {**state, "error": "Both web search and document search are unavailable."}

    duration = (time.time() - t0) * 1000
    _log_trace(state, "researcher",
               f"Queries: {queries[:2]}",
               f"web_len={len(web_context)} rag_len={len(rag_context)}",
               duration, True,
               rewritten_query_count=len(rewritten))

    return {**state, "web_context": web_context, "rag_context": rag_context}


# ── Node 3 — Validator Agent ──────────────────────────────────────────────────

def validate_sources(state: ResearchState) -> ResearchState:
    """
    Source Validator Agent.
    Concept: Session 6 (retrieval quality, ranking problems, debugging
             retrieval) + Session 7 (RAG evaluation, hallucination detection).
    Scores sources on relevance, credibility, and specificity.
    """
    t0 = time.time()

    if state.get("error"):
        return state

    user_prompt = (
        f"Research query: {state['query']}\n\n"
        f"Retrieved sources:\n{state.get('web_context', 'No web results')}"
    )

    try:
        raw = _call_llm(system=VALIDATOR_SYSTEM_PROMPT, user=user_prompt, max_tokens=400, require_json=True)
        raw = raw.strip()
        if raw.startswith("```"):
            raw = raw.split("```")[1]
            if raw.startswith("json"):
                raw = raw[4:]
            raw = raw.strip()
            
        # Robust fallback using regex
        import re
        match = re.search(r"(\[.*\]|\{.*\})", raw, re.DOTALL)
        if match:
            raw = match.group(1)
            
        result = json.loads(raw)
        quality_score = float(result.get("quality_score", 5.0))
    except Exception as e:
        logger.warning(f"[validator] Failed: {e}")
        return {**state, "error": f"Validator failed: {e}"}

    duration = (time.time() - t0) * 1000
    _log_trace(state, "validator", state["query"], str(result),
               duration, True, quality_score=quality_score)
    logger.info(f"[validator] Source quality score: {quality_score}/10")

    return {
        **state,
        "source_quality_score": quality_score,
        "validation_result": result,
    }


# ── Node 4 — Summarizer Agent ─────────────────────────────────────────────────

def summarize_findings(state: ResearchState) -> ResearchState:
    """
    Summarizer Agent.
    Concept: Session 9 (breaking synthesis into distinct agent responsibilities).
    Produces a structured bullet-point summary from raw retrieved context.
    """
    t0 = time.time()

    if state.get("error"):
        return state

    user_prompt = SUMMARIZER_USER_TEMPLATE.format(
        query=state["query"],
        web_context=state.get("web_context", "No web results."),
        rag_context=state.get("rag_context", "No document context."),
    )

    try:
        summary = _call_llm(
            system=SUMMARIZER_SYSTEM_PROMPT,
            user=user_prompt,
            max_tokens=1024,
        )
    except Exception as e:
        logger.warning(f"[summarizer] Failed: {e}")
        return {**state, "error": f"Summarizer failed: {e}"}

    duration = (time.time() - t0) * 1000
    _log_trace(state, "summarizer", state["query"], summary[:200],
               duration, True, summary_len=len(summary))
    logger.info(f"[summarizer] Summary generated ({len(summary)} chars)")

    return {**state, "summary": summary}


# ── Node 5 — Report Writer Agent ──────────────────────────────────────────────

def write_report(state: ResearchState) -> ResearchState:
    """
    Report Writer Agent.
    Concept: Session 9 (agent specialization — one agent summarises,
             another structures and formats the final deliverable).
    """
    t0 = time.time()

    if state.get("error"):
        return state

    user_prompt = REPORT_WRITER_USER_TEMPLATE.format(
        query=state["query"],
        summary=state.get("summary", "No summary available."),
    )

    try:
        report = _call_llm(
            system=REPORT_WRITER_SYSTEM_PROMPT,
            user=user_prompt,
            max_tokens=4096,
        )
    except Exception as e:
        logger.warning(f"[report_writer] Failed: {e}")
        return {**state, "error": f"Report Writer failed: {e}"}

    duration = (time.time() - t0) * 1000
    _log_trace(state, "report_writer", state["query"], report[:200],
               duration, True, report_len=len(report))
    logger.info(f"[report_writer] Report generated ({len(report)} chars)")

    return {**state, "report": report}


# ── Node 6 — Reviewer Agent ───────────────────────────────────────────────────

def review_report(state: ResearchState) -> ResearchState:
    """
    Reviewer Agent.
    Concept: Session 7 (hallucination detection, retrieval evaluation),
             Session 8 (systematic QA pipelines, continuous improvement),
             Session 10 (semantic correctness evaluation).
    Critiques the generated report and decides pass/fail.
    """
    t0 = time.time()

    if state.get("error"):
        return state

    user_prompt = (
        f"Original query: {state['query']}\n"
        f"Source quality score from validator: "
        f"{state.get('source_quality_score', 5)}/10\n\n"
        f"Generated report:\n{state.get('report', 'No report generated')}"
    )

    try:
        raw = _call_llm(system=REVIEWER_SYSTEM_PROMPT, user=user_prompt, max_tokens=600, require_json=True)
        raw = raw.strip()
        if raw.startswith("```"):
            raw = raw.split("```")[1]
            if raw.startswith("json"):
                raw = raw[4:]
            raw = raw.strip()
        
        # Robust fallback using regex
        import re
        match = re.search(r"(\[.*\]|\{.*\})", raw, re.DOTALL)
        if match:
            raw = match.group(1)

        result = json.loads(raw)
        review_passed = bool(result.get("review_passed", True))
        review_score  = int(result.get("review_score", 7))
    except Exception as e:
        logger.warning(f"[reviewer] Failed: {e}")
        return {**state, "error": f"Reviewer failed: {e}"}

    # Increment loop counter to prevent infinite loops
    loop_count = state.get("loop_count", 0) + 1

    duration = (time.time() - t0) * 1000
    _log_trace(state, "reviewer", state["query"],
               f"score={review_score} passed={review_passed}",
               duration, True,
               review_score=review_score, review_passed=review_passed,
               loop_count=loop_count)

    logger.info(
        f"[reviewer] Score: {review_score}/10 | Passed: {review_passed} | "
        f"Loop: {loop_count}"
    )

    return {
        **state,
        "review_passed":   review_passed,
        "review_score":    review_score,
        "review_feedback": result.get("feedback", ""),
        "loop_count":      loop_count,
    }


# ── Conditional routing ───────────────────────────────────────────────────────

def should_continue(state: ResearchState):
    """
    Conditional routing function — the ReAct loop.
    Concept: Session 9 (plan-level intelligence, goal reachability),
             Session 11 (control systems, safe execution, failure handling).

    Loops back to researcher if the review fails AND we haven't hit the loop cap.
    Hard cap at 2 iterations to prevent infinite LLM spending.
    """
    if state.get("error"):
        logger.info("[router] Error in state — exiting to END")
        return END

    if state.get("loop_count", 0) >= 2:
        logger.info("[router] Loop cap reached — exiting to END")
        return END

    if not state.get("review_passed", True):
        logger.info(
            f"[router] Review failed (score {state.get('review_score')}). "
            f"Looping back to researcher. "
            f"Feedback: {state.get('review_feedback', '')[:100]}"
        )
        return "researcher"

    logger.info(f"[router] Review passed (score {state.get('review_score')}) — exiting to END")
    return END


# ── Graph ─────────────────────────────────────────────────────────────────────

def build_graph():
    """
    Build the 6-agent multi-agent research graph with conditional routing.

    Concept: Sessions 9, 10, 11 — agentic workflows, plan-level intelligence,
             ReAct loops, reliable agent systems.
    """
    graph = StateGraph(ResearchState)

    # All 6 agents as named nodes
    graph.add_node("planner",      plan_steps)
    graph.add_node("researcher",   run_tools)
    graph.add_node("validator",    validate_sources)
    graph.add_node("summarizer",   summarize_findings)
    graph.add_node("report_writer", write_report)
    graph.add_node("reviewer",     review_report)

    graph.set_entry_point("planner")
    graph.add_edge("planner",       "researcher")
    graph.add_edge("researcher",    "validator")
    graph.add_edge("validator",     "summarizer")
    graph.add_edge("summarizer",    "report_writer")
    graph.add_edge("report_writer", "reviewer")

    # Conditional routing — loops back to researcher or exits
    graph.add_conditional_edges(
        "reviewer",
        should_continue,
        {
            "researcher": "researcher",  # retry loop if review fails
            END: END,                    # exit if review passes
        }
    )

    return graph.compile()


_compiled_graph = None


def get_graph():
    global _compiled_graph
    if _compiled_graph is None:
        _compiled_graph = build_graph()
    return _compiled_graph


async def run_research(query: str, job_id: str = "") -> dict:
    """
    Run the full 6-agent research pipeline.

    Returns a dict with 'report' and agent metadata fields so that
    main.py can store them alongside the report.
    """
    # Create a DecisionTrace for this job (optional — won't break if trace module missing)
    if job_id:
        try:
            from ..trace import create_trace
            create_trace(job_id=job_id, query=query)
        except Exception:
            pass

    graph = get_graph()

    initial_state: ResearchState = {
        "query":               query,
        "sub_queries":         [],
        "web_context":         "",
        "rag_context":         "",
        "summary":             None,
        "report":              None,
        "error":               None,
        "source_quality_score": 0.0,
        "validation_result":   None,
        "review_passed":       False,
        "review_feedback":     None,
        "review_score":        0,
        "loop_count":          0,
        "job_id":              job_id,
    }

    loop = asyncio.get_event_loop()
    final_state = await loop.run_in_executor(None, graph.invoke, initial_state)

    return {
        "report":               final_state.get("report") or "No report generated.",
        "error":                final_state.get("error"),
        "source_quality_score": final_state.get("source_quality_score", 0.0),
        "validation_result":    final_state.get("validation_result"),
        "review_score":         final_state.get("review_score", 0),
        "review_passed":        final_state.get("review_passed", False),
        "review_feedback":      final_state.get("review_feedback"),
        "loop_count":           final_state.get("loop_count", 0),
        "sub_queries":          final_state.get("sub_queries", []),
        "web_context":          final_state.get("web_context", ""),
        "rag_context":          final_state.get("rag_context", ""),
    }