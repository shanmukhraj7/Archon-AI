"""
Multi-Agent Coordinator — Advanced agent orchestration patterns.

This module implements additional multi-agent coordination concepts:
1. AgentHealthMonitor — tracks per-agent failure rates and latency
2. DynamicAgentRouter  — routes queries to specialized sub-pipelines
3. AgentCapabilityRegistry — declares agent capabilities for dynamic dispatch

Concept: Sessions 9, 10, 11 — advanced multi-agent coordination,
         reliable agents, production agent systems.
"""

import time
import logging
from typing import Dict, List, Optional, Callable, Any
from dataclasses import dataclass, field
from collections import defaultdict, deque

logger = logging.getLogger(__name__)


# ── Agent Health Monitor ───────────────────────────────────────────────────────

@dataclass
class AgentMetrics:
    """Tracks rolling performance metrics for a single agent node."""
    node_name:        str
    call_count:       int   = 0
    failure_count:    int   = 0
    total_latency_ms: float = 0.0
    recent_latencies: deque = field(default_factory=lambda: deque(maxlen=20))
    last_error:       Optional[str] = None

    @property
    def success_rate(self) -> float:
        if self.call_count == 0:
            return 1.0
        return (self.call_count - self.failure_count) / self.call_count

    @property
    def avg_latency_ms(self) -> float:
        if not self.recent_latencies:
            return 0.0
        return sum(self.recent_latencies) / len(self.recent_latencies)

    @property
    def p95_latency_ms(self) -> float:
        """Approximate 95th percentile of recent latencies."""
        if not self.recent_latencies:
            return 0.0
        sorted_lats = sorted(self.recent_latencies)
        idx = int(0.95 * len(sorted_lats))
        return sorted_lats[min(idx, len(sorted_lats) - 1)]

    def to_dict(self) -> dict:
        return {
            "node_name":     self.node_name,
            "call_count":    self.call_count,
            "failure_count": self.failure_count,
            "success_rate":  round(self.success_rate, 3),
            "avg_latency_ms": round(self.avg_latency_ms, 1),
            "p95_latency_ms": round(self.p95_latency_ms, 1),
            "last_error":    self.last_error,
            "health":        "healthy" if self.success_rate > 0.8 else "degraded",
        }


class AgentHealthMonitor:
    """
    Production-grade agent health monitoring.
    Concept: Session 14 (LLMOps, production monitoring, continuous evaluation loops).
    """

    def __init__(self):
        self._metrics: Dict[str, AgentMetrics] = {}

    def _get_or_create(self, node_name: str) -> AgentMetrics:
        if node_name not in self._metrics:
            self._metrics[node_name] = AgentMetrics(node_name=node_name)
        return self._metrics[node_name]

    def record_success(self, node_name: str, latency_ms: float) -> None:
        m = self._get_or_create(node_name)
        m.call_count += 1
        m.total_latency_ms += latency_ms
        m.recent_latencies.append(latency_ms)

    def record_failure(self, node_name: str, error: str, latency_ms: float = 0.0) -> None:
        m = self._get_or_create(node_name)
        m.call_count += 1
        m.failure_count += 1
        m.last_error = error[:200]
        m.recent_latencies.append(latency_ms)
        logger.warning(f"[health] Agent '{node_name}' failure #{m.failure_count}: {error[:80]}")

    def get_all_metrics(self) -> List[dict]:
        return [m.to_dict() for m in self._metrics.values()]

    def get_agent_health(self, node_name: str) -> dict:
        m = self._metrics.get(node_name)
        if not m:
            return {"node_name": node_name, "health": "unknown", "call_count": 0}
        return m.to_dict()

    def is_healthy(self, node_name: str, threshold: float = 0.6) -> bool:
        m = self._metrics.get(node_name)
        if not m or m.call_count == 0:
            return True  # Assume healthy if never called
        return m.success_rate >= threshold


# ── Dynamic Agent Router ───────────────────────────────────────────────────────

class QueryRouter:
    """
    Dynamic query routing — classifies a query and selects the optimal
    pipeline configuration.
    
    Concept: Session 9 (plan-level intelligence, goal reachability),
             Session 11 (dynamic routing, ReAct adaptation).
    """

    # Simple keyword-based routing rules
    _RULES: List[Dict[str, Any]] = [
        {
            "pipeline": "fast_track",
            "keywords": ["what is", "define", "explain", "meaning of"],
            "description": "Simple factual / definitional query — may skip some agents",
            "skip_agents": [],  # All 6 agents still run for quality
        },
        {
            "pipeline": "deep_research",
            "keywords": ["compare", "analyze", "evaluate", "impact of", "trends in",
                         "overview of", "comprehensive", "in-depth"],
            "description": "Complex analytical query — full 6-agent pipeline with max loops",
            "skip_agents": [],
        },
        {
            "pipeline": "document_focus",
            "keywords": ["from the document", "in my file", "from uploaded", "according to"],
            "description": "Document-centric query — prioritize RAG over web search",
            "skip_agents": [],
        },
    ]

    @classmethod
    def classify(cls, query: str) -> dict:
        """
        Classify a query and return routing metadata.
        Returns the first matching rule, or a 'general' default.
        """
        query_lower = query.lower()
        for rule in cls._RULES:
            if any(kw in query_lower for kw in rule["keywords"]):
                logger.info(f"[router] Classified as '{rule['pipeline']}': {rule['description']}")
                return {
                    "pipeline": rule["pipeline"],
                    "description": rule["description"],
                    "skip_agents": rule["skip_agents"],
                }
        return {
            "pipeline": "general",
            "description": "General research query — standard 6-agent pipeline",
            "skip_agents": [],
        }


# ── Agent Capability Registry ──────────────────────────────────────────────────

class AgentCapabilityRegistry:
    """
    Declares the capabilities of each agent in the pipeline.
    Concept: Session 9 (agent identity, specialization, multi-agent systems).
    
    This enables future dynamic dispatch — e.g., adding a "Code Analyst"
    agent that only activates for programming queries.
    """

    AGENTS = {
        "planner": {
            "name":        "Research Planner Agent",
            "description": "Decomposes the user query into 3–5 specific sub-questions using LLM planning",
            "input":       "Raw user query",
            "output":      "JSON array of sub-queries",
            "session_map": "Session 9 — plan-level intelligence, goal decomposition",
        },
        "researcher": {
            "name":        "Retrieval / Search Agent",
            "description": "Runs hybrid BM25 + semantic search across the web and uploaded documents",
            "input":       "Sub-queries from planner",
            "output":      "Web context + RAG context strings",
            "session_map": "Session 6 — hybrid retrieval, query rewriting",
        },
        "validator": {
            "name":        "Source Validator Agent",
            "description": "Scores retrieved sources on relevance, credibility, specificity, and recency",
            "input":       "Web context from researcher",
            "output":      "Quality score (1–10) + validation metadata",
            "session_map": "Sessions 6, 7 — retrieval evaluation, hallucination detection",
        },
        "summarizer": {
            "name":        "Summarizer Agent",
            "description": "Extracts key facts from retrieved context into a structured bullet-point summary",
            "input":       "Web + RAG context",
            "output":      "Concise findings summary (< 600 words)",
            "session_map": "Session 9 — agent specialization, task decomposition",
        },
        "report_writer": {
            "name":        "Report Writer Agent",
            "description": "Expands summary into a professionally formatted Markdown research report",
            "input":       "Summary from summarizer",
            "output":      "Full Markdown report with sections, tables, and sources",
            "session_map": "Session 9 — agent specialization, output formatting",
        },
        "reviewer": {
            "name":        "Reviewer Agent",
            "description": "QA gate — scores the report for completeness, accuracy, and hallucination risk",
            "input":       "Query + report + source quality score",
            "output":      "Pass/fail decision + score (1–10) + feedback",
            "session_map": "Sessions 7, 8, 10 — QA pipelines, hallucination detection",
        },
    }

    @classmethod
    def get_agent_info(cls, agent_id: str) -> Optional[dict]:
        return cls.AGENTS.get(agent_id)

    @classmethod
    def get_all(cls) -> List[dict]:
        return [{"id": k, **v} for k, v in cls.AGENTS.items()]

    @classmethod
    def get_pipeline_summary(cls) -> dict:
        return {
            "agent_count": len(cls.AGENTS),
            "pipeline": list(cls.AGENTS.keys()),
            "topology": "sequential with conditional ReAct loop (reviewer → researcher)",
            "max_loops": 2,
        }


# ── Module-level singletons ────────────────────────────────────────────────────

_health_monitor: Optional[AgentHealthMonitor] = None


def get_health_monitor() -> AgentHealthMonitor:
    global _health_monitor
    if _health_monitor is None:
        _health_monitor = AgentHealthMonitor()
    return _health_monitor


def get_query_router() -> QueryRouter:
    return QueryRouter()


def get_capability_registry() -> AgentCapabilityRegistry:
    return AgentCapabilityRegistry()
