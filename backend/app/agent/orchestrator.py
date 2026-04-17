"""
LangGraph-based orchestrator: planner → researcher → synthesizer.

LLM priority order (first key found in .env wins, auto-falls-through on quota/rate errors):
  1. Groq        — GROQ_API_KEY       (FREE, 14,400 req/day, llama-3.3-70b)
  2. OpenAI      — OPENAI_API_KEY     (paid, gpt-4o-mini)
  3. Gemini      — GEMINI_API_KEY     (FREE, gemini-2.0-flash-lite)
  4. Claude      — ANTHROPIC_API_KEY  (paid, last resort)
"""

import os
import json
import asyncio
import logging
from typing import TypedDict, List, Optional

from langgraph.graph import StateGraph, END

from .prompts import (
    PLANNER_PROMPT,
    SYNTHESIZER_SYSTEM_PROMPT,
    SYNTHESIZER_USER_TEMPLATE,
)
from .tools import multi_query_web_search, multi_query_rag_search

logger = logging.getLogger(__name__)


# ── State ─────────────────────────────────────────────────────────────────────

class ResearchState(TypedDict):
    query: str
    sub_queries: List[str]
    web_context: str
    rag_context: str
    report: Optional[str]
    error: Optional[str]


# ── LLM router ────────────────────────────────────────────────────────────────

_FALLTHROUGH_PHRASES = (
    "quota", "rate limit", "429", "exceeded", "too many requests",
    "resource exhausted", "billing",
)

def _is_quota_error(e: Exception) -> bool:
    return any(p in str(e).lower() for p in _FALLTHROUGH_PHRASES)


def _call_llm(system: str, user: str, max_tokens: int = 4096) -> str:
    """
    Try each provider in order. Falls through to the next on quota/rate errors.
    Priority: Groq → OpenAI → Gemini → Claude
    """
    providers = []

    if os.environ.get("GROQ_API_KEY"):
        providers.append(("Groq",   lambda: _call_groq(system, user, max_tokens)))
    if os.environ.get("OPENAI_API_KEY"):
        providers.append(("OpenAI", lambda: _call_openai(system, user, max_tokens)))
    if os.environ.get("GEMINI_API_KEY"):
        providers.append(("Gemini", lambda: _call_gemini(system, user, max_tokens)))
    if os.environ.get("ANTHROPIC_API_KEY"):
        providers.append(("Claude", lambda: _call_claude(system, user, max_tokens)))

    if not providers:
        raise RuntimeError(
            "No LLM API key found. Add at least one to your .env:\n"
            "  GROQ_API_KEY      — console.groq.com            (FREE)\n"
            "  OPENAI_API_KEY    — platform.openai.com/api-keys\n"
            "  GEMINI_API_KEY    — aistudio.google.com/apikey  (FREE)\n"
            "  ANTHROPIC_API_KEY — console.anthropic.com"
        )

    last_error = None
    for name, fn in providers:
        try:
            logger.info(f"Trying LLM provider: {name}")
            result = fn()
            logger.info(f"Success with provider: {name}")
            return result
        except Exception as e:
            if _is_quota_error(e):
                logger.warning(f"{name} quota/rate error, falling through. Error: {e}")
                last_error = e
                continue
            raise

    raise RuntimeError(
        f"All LLM providers exhausted (quota/rate limits). Last error: {last_error}"
    )


# ── Provider implementations ──────────────────────────────────────────────────

def _call_groq(system: str, user: str, max_tokens: int) -> str:
    from groq import Groq

    client = Groq(api_key=os.environ["GROQ_API_KEY"])
    response = client.chat.completions.create(
        model="llama-3.3-70b-versatile",
        max_tokens=min(max_tokens, 8000),
        temperature=0.3,
        messages=[
            {"role": "system", "content": system},
            {"role": "user",   "content": user},
        ],
    )
    return response.choices[0].message.content


def _call_openai(system: str, user: str, max_tokens: int) -> str:
    from openai import OpenAI

    client = OpenAI(api_key=os.environ["OPENAI_API_KEY"])
    response = client.chat.completions.create(
        model="gpt-4o-mini",
        max_tokens=max_tokens,
        temperature=0.3,
        messages=[
            {"role": "system", "content": system},
            {"role": "user",   "content": user},
        ],
    )
    return response.choices[0].message.content


def _call_gemini(system: str, user: str, max_tokens: int) -> str:
    import google.generativeai as genai

    genai.configure(api_key=os.environ["GEMINI_API_KEY"])
    model = genai.GenerativeModel(
        model_name="gemini-2.0-flash-lite",
        system_instruction=system,
        generation_config=genai.types.GenerationConfig(
            max_output_tokens=max_tokens,
            temperature=0.3,
        ),
    )
    return model.generate_content(user).text


def _call_claude(system: str, user: str, max_tokens: int) -> str:
    import anthropic

    client = anthropic.Anthropic(api_key=os.environ["ANTHROPIC_API_KEY"])
    response = client.messages.create(
        model="claude-sonnet-4-20250514",
        max_tokens=max_tokens,
        system=system,
        messages=[{"role": "user", "content": user}],
    )
    return response.content[0].text


# ── Node functions ────────────────────────────────────────────────────────────

def plan_steps(state: ResearchState) -> ResearchState:
    try:
        raw = _call_llm(
            system=PLANNER_PROMPT,
            user=f"Research query: {state['query']}",
            max_tokens=512,
        )
        raw = raw.strip()
        if raw.startswith("```"):
            raw = raw.split("```")[1]
            if raw.startswith("json"):
                raw = raw[4:]
        raw = raw.strip()

        sub_queries = json.loads(raw)
        if not isinstance(sub_queries, list):
            sub_queries = [state["query"]]
    except Exception:
        sub_queries = [state["query"]]

    return {**state, "sub_queries": sub_queries}


def run_tools(state: ResearchState) -> ResearchState:
    queries = state.get("sub_queries") or [state["query"]]

    web_context = ""
    rag_context = ""

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
    user_prompt = SYNTHESIZER_USER_TEMPLATE.format(
        query=state["query"],
        web_context=state.get("web_context", "No web results."),
        rag_context=state.get("rag_context", "No document context."),
    )

    try:
        report = _call_llm(
            system=SYNTHESIZER_SYSTEM_PROMPT,
            user=user_prompt,
            max_tokens=4096,
        )
    except Exception as e:
        report = f"## Error\n\nFailed to generate report: {e}"

    return {**state, "report": report}


# ── Graph ─────────────────────────────────────────────────────────────────────

def build_graph():
    graph = StateGraph(ResearchState)

    graph.add_node("planner",     plan_steps)
    graph.add_node("researcher",  run_tools)
    graph.add_node("synthesizer", synthesize)

    graph.set_entry_point("planner")
    graph.add_edge("planner",     "researcher")
    graph.add_edge("researcher",  "synthesizer")
    graph.add_edge("synthesizer", END)

    return graph.compile()


_compiled_graph = None


def get_graph():
    global _compiled_graph
    if _compiled_graph is None:
        _compiled_graph = build_graph()
    return _compiled_graph


async def run_research(query: str) -> str:
    graph = get_graph()

    initial_state: ResearchState = {
        "query": query,
        "sub_queries": [],
        "web_context": "",
        "rag_context": "",
        "report": None,
        "error": None,
    }

    loop = asyncio.get_event_loop()
    final_state = await loop.run_in_executor(None, graph.invoke, initial_state)

    return final_state.get("report") or "No report generated."