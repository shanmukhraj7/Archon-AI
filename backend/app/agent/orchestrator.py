"""
LangGraph-based orchestrator: planner → researcher → synthesizer.
"""

import os
import json
import asyncio
from typing import TypedDict, List, Optional, Annotated
import operator

from langgraph.graph import StateGraph, END

from .prompts import (
    PLANNER_PROMPT,
    SYNTHESIZER_SYSTEM_PROMPT,
    SYNTHESIZER_USER_TEMPLATE,
)
from .tools import multi_query_web_search, multi_query_rag_search


# ── State ─────────────────────────────────────────────────────────────────────

class ResearchState(TypedDict):
    query: str
    sub_queries: List[str]
    web_context: str
    rag_context: str
    report: Optional[str]
    error: Optional[str]


# ── LLM client helper ─────────────────────────────────────────────────────────

def _get_anthropic_client():
    import anthropic
    return anthropic.Anthropic(api_key=os.environ["ANTHROPIC_API_KEY"])


def _call_claude(system: str, user: str, max_tokens: int = 4096) -> str:
    client = _get_anthropic_client()
    response = client.messages.create(
        model="claude-sonnet-4-20250514",
        max_tokens=max_tokens,
        system=system,
        messages=[{"role": "user", "content": user}],
    )
    return response.content[0].text


# ── Node functions ────────────────────────────────────────────────────────────

def plan_steps(state: ResearchState) -> ResearchState:
    """Break the main query into focused sub-queries."""
    try:
        raw = _call_claude(
            system=PLANNER_PROMPT,
            user=f"Research query: {state['query']}",
            max_tokens=512,
        )
        # Strip potential markdown code fences
        raw = raw.strip().strip("```json").strip("```").strip()
        sub_queries = json.loads(raw)
        if not isinstance(sub_queries, list):
            sub_queries = [state["query"]]
    except Exception:
        sub_queries = [state["query"]]

    return {**state, "sub_queries": sub_queries}


def run_tools(state: ResearchState) -> ResearchState:
    """Execute web search and RAG in parallel (via threads since they're sync)."""
    queries = state.get("sub_queries") or [state["query"]]

    web_context = ""
    rag_context = ""

    # Run both searches — if Tavily key missing, gracefully skip web search
    try:
        web_context = multi_query_web_search(queries, max_per_query=3)
    except Exception as e:
        web_context = f"Web search unavailable: {e}"

    try:
        rag_context = multi_query_rag_search(queries, k_per_query=3)
    except Exception as e:
        rag_context = f"Document search unavailable: {e}"

    return {**state, "web_context": web_context, "rag_context": rag_context}


def synthesize(state: ResearchState) -> ResearchState:
    """Write the final structured report from gathered context."""
    user_prompt = SYNTHESIZER_USER_TEMPLATE.format(
        query=state["query"],
        web_context=state.get("web_context", "No web results."),
        rag_context=state.get("rag_context", "No document context."),
    )

    try:
        report = _call_claude(
            system=SYNTHESIZER_SYSTEM_PROMPT,
            user=user_prompt,
            max_tokens=4096,
        )
    except Exception as e:
        report = f"## Error\n\nFailed to generate report: {e}"

    return {**state, "report": report}


# ── Graph definition ──────────────────────────────────────────────────────────

def build_graph() -> StateGraph:
    graph = StateGraph(ResearchState)

    graph.add_node("planner", plan_steps)
    graph.add_node("researcher", run_tools)
    graph.add_node("synthesizer", synthesize)

    graph.set_entry_point("planner")
    graph.add_edge("planner", "researcher")
    graph.add_edge("researcher", "synthesizer")
    graph.add_edge("synthesizer", END)

    return graph.compile()


# ── Public API ────────────────────────────────────────────────────────────────

_compiled_graph = None


def get_graph():
    global _compiled_graph
    if _compiled_graph is None:
        _compiled_graph = build_graph()
    return _compiled_graph


async def run_research(query: str) -> str:
    """
    Run the full research pipeline for a query.
    Returns the final markdown report string.
    """
    graph = get_graph()

    initial_state: ResearchState = {
        "query": query,
        "sub_queries": [],
        "web_context": "",
        "rag_context": "",
        "report": None,
        "error": None,
    }

    # LangGraph's invoke is synchronous; run in executor to keep FastAPI async
    loop = asyncio.get_event_loop()
    final_state = await loop.run_in_executor(None, graph.invoke, initial_state)

    return final_state.get("report") or "No report generated.""""
LangGraph-based orchestrator: planner → researcher → synthesizer.
"""

import os
import json
import asyncio
from typing import TypedDict, List, Optional, Annotated
import operator

from langgraph.graph import StateGraph, END

from .prompts import (
    PLANNER_PROMPT,
    SYNTHESIZER_SYSTEM_PROMPT,
    SYNTHESIZER_USER_TEMPLATE,
)
from .tools import multi_query_web_search, multi_query_rag_search


# ── State ─────────────────────────────────────────────────────────────────────

class ResearchState(TypedDict):
    query: str
    sub_queries: List[str]
    web_context: str
    rag_context: str
    report: Optional[str]
    error: Optional[str]


# ── LLM client helper ─────────────────────────────────────────────────────────

def _get_anthropic_client():
    import anthropic
    return anthropic.Anthropic(api_key=os.environ["ANTHROPIC_API_KEY"])


def _call_claude(system: str, user: str, max_tokens: int = 4096) -> str:
    client = _get_anthropic_client()
    response = client.messages.create(
        model="claude-sonnet-4-20250514",
        max_tokens=max_tokens,
        system=system,
        messages=[{"role": "user", "content": user}],
    )
    return response.content[0].text


# ── Node functions ────────────────────────────────────────────────────────────

def plan_steps(state: ResearchState) -> ResearchState:
    """Break the main query into focused sub-queries."""
    try:
        raw = _call_claude(
            system=PLANNER_PROMPT,
            user=f"Research query: {state['query']}",
            max_tokens=512,
        )
        # Strip potential markdown code fences
        raw = raw.strip().strip("```json").strip("```").strip()
        sub_queries = json.loads(raw)
        if not isinstance(sub_queries, list):
            sub_queries = [state["query"]]
    except Exception:
        sub_queries = [state["query"]]

    return {**state, "sub_queries": sub_queries}


def run_tools(state: ResearchState) -> ResearchState:
    """Execute web search and RAG in parallel (via threads since they're sync)."""
    queries = state.get("sub_queries") or [state["query"]]

    web_context = ""
    rag_context = ""

    # Run both searches — if Tavily key missing, gracefully skip web search
    try:
        web_context = multi_query_web_search(queries, max_per_query=3)
    except Exception as e:
        web_context = f"Web search unavailable: {e}"

    try:
        rag_context = multi_query_rag_search(queries, k_per_query=3)
    except Exception as e:
        rag_context = f"Document search unavailable: {e}"

    return {**state, "web_context": web_context, "rag_context": rag_context}


def synthesize(state: ResearchState) -> ResearchState:
    """Write the final structured report from gathered context."""
    user_prompt = SYNTHESIZER_USER_TEMPLATE.format(
        query=state["query"],
        web_context=state.get("web_context", "No web results."),
        rag_context=state.get("rag_context", "No document context."),
    )

    try:
        report = _call_claude(
            system=SYNTHESIZER_SYSTEM_PROMPT,
            user=user_prompt,
            max_tokens=4096,
        )
    except Exception as e:
        report = f"## Error\n\nFailed to generate report: {e}"

    return {**state, "report": report}


# ── Graph definition ──────────────────────────────────────────────────────────

def build_graph() -> StateGraph:
    graph = StateGraph(ResearchState)

    graph.add_node("planner", plan_steps)
    graph.add_node("researcher", run_tools)
    graph.add_node("synthesizer", synthesize)

    graph.set_entry_point("planner")
    graph.add_edge("planner", "researcher")
    graph.add_edge("researcher", "synthesizer")
    graph.add_edge("synthesizer", END)

    return graph.compile()


# ── Public API ────────────────────────────────────────────────────────────────

_compiled_graph = None


def get_graph():
    global _compiled_graph
    if _compiled_graph is None:
        _compiled_graph = build_graph()
    return _compiled_graph


async def run_research(query: str) -> str:
    """
    Run the full research pipeline for a query.
    Returns the final markdown report string.
    """
    graph = get_graph()

    initial_state: ResearchState = {
        "query": query,
        "sub_queries": [],
        "web_context": "",
        "rag_context": "",
        "report": None,
        "error": None,
    }

    # LangGraph's invoke is synchronous; run in executor to keep FastAPI async
    loop = asyncio.get_event_loop()
    final_state = await loop.run_in_executor(None, graph.invoke, initial_state)

    return final_state.get("report") or "No report generated."