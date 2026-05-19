"""
DecisionTrace system for agent observability.
Concept: Session 10 (trace debugging, audit logging, execution correctness,
         failure localization), Session 14 (LLMOps, production monitoring,
         continuous evaluation loops).
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
    Allows post-hoc debugging of agent decisions and timing.
    Concept: Session 10 — DecisionTrace, audit logging, trace debugging.
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
            metadata=metadata,
        )
        self.steps.append(step)
        logger.info(
            f"[TRACE] job={self.job_id} | node={node} | "
            f"duration={duration_ms:.0f}ms | success={success}"
        )

    def to_dict(self) -> dict:
        total_ms = (time.time() - self.start_time) * 1000
        return {
            "job_id":            self.job_id,
            "query":             self.query,
            "total_duration_ms": round(total_ms, 2),
            "step_count":        len(self.steps),
            "steps":             [asdict(s) for s in self.steps],
            "all_passed":        all(s.success for s in self.steps),
        }


# Per-job trace store (in-memory, cleared on restart)
_traces: Dict[str, DecisionTrace] = {}


def get_trace(job_id: str) -> Optional[DecisionTrace]:
    return _traces.get(job_id)


def create_trace(job_id: str, query: str) -> DecisionTrace:
    trace = DecisionTrace(query=query, job_id=job_id)
    _traces[job_id] = trace
    return trace
