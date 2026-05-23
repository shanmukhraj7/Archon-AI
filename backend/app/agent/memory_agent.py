"""
Memory Agent — Cross-session memory and context injection.
Concept: Session 10 (agent memory, state persistence),
         Session 11 (reliable agents, fallback strategies).

This agent enhances the multi-agent pipeline by:
1. Storing and retrieving past research summaries
2. Injecting relevant past context into new queries
3. Detecting duplicate or related queries to save LLM calls
"""

import os
import re
import time
import logging
from typing import Optional, List, Tuple

logger = logging.getLogger(__name__)


class MemoryAgent:
    """
    Lightweight cross-session memory for the research pipeline.
    Uses a sliding window of recent query-report pairs.
    """

    MAX_ENTRIES = 20          # Maximum items to keep in memory
    SIMILARITY_THRESHOLD = 0.5  # Threshold to trigger memory injection

    def __init__(self):
        self._store: List[dict] = []  # [{query, summary, timestamp, score}]

    # ── Ingestion ──────────────────────────────────────────────────────────────

    def add(self, query: str, report: str) -> None:
        """Store a query-report pair. Evicts oldest if over capacity."""
        summary = self._extract_executive_summary(report)
        entry = {
            "query":     query.strip(),
            "summary":   summary,
            "timestamp": time.time(),
        }
        self._store.append(entry)
        # Evict oldest entries when over capacity
        if len(self._store) > self.MAX_ENTRIES:
            self._store = self._store[-self.MAX_ENTRIES:]
        logger.info(f"[memory] Stored research entry. Total: {len(self._store)}")

    # ── Retrieval ──────────────────────────────────────────────────────────────

    def get_relevant_context(self, query: str, top_k: int = 3) -> Optional[str]:
        """
        Find the top-k most relevant past research summaries for a given query.
        Returns a formatted context string or None if no relevant entries found.
        """
        if not self._store:
            return None

        scored: List[Tuple[float, dict]] = []
        query_tokens = set(self._tokenize(query))

        for entry in self._store:
            entry_tokens = set(self._tokenize(entry["query"]))
            if not entry_tokens:
                continue
            # Jaccard similarity between query token sets
            intersection = query_tokens & entry_tokens
            union = query_tokens | entry_tokens
            score = len(intersection) / len(union) if union else 0.0
            if score >= self.SIMILARITY_THRESHOLD:
                scored.append((score, entry))

        if not scored:
            return None

        # Sort by relevance score descending
        scored.sort(key=lambda x: x[0], reverse=True)
        top = scored[:top_k]

        parts = []
        for score, entry in top:
            age_hrs = (time.time() - entry["timestamp"]) / 3600
            parts.append(
                f"[Past Research — relevance {score:.0%}, {age_hrs:.1f}h ago]\n"
                f"Query: {entry['query']}\n"
                f"Summary: {entry['summary']}"
            )

        return "\n\n---\n\n".join(parts)

    def get_context_string(self) -> str:
        """
        Return the most recent memory context as a plain string for injection
        into the current query. Used by main.py's run_research_task.
        """
        if not self._store:
            return ""
        # Take the last 3 entries
        recent = self._store[-3:]
        lines = []
        for e in recent:
            lines.append(f"- Previous research on '{e['query']}': {e['summary'][:200]}")
        return "### Relevant context from previous sessions:\n" + "\n".join(lines)

    # ── Helpers ────────────────────────────────────────────────────────────────

    @staticmethod
    def _extract_executive_summary(report: str) -> str:
        """Extract the Executive Summary section from a markdown report."""
        match = re.search(
            r"##\s*Executive Summary\s*\n(.*?)(?=\n##|\Z)",
            report, re.DOTALL | re.IGNORECASE
        )
        if match:
            return match.group(1).strip()[:400]
        # Fallback: first 400 chars of the report
        return report.strip()[:400]

    @staticmethod
    def _tokenize(text: str) -> List[str]:
        """Simple whitespace+punctuation tokenizer; filters short stop words."""
        stop_words = {
            "a", "an", "the", "in", "on", "at", "to", "for", "of", "and",
            "or", "is", "it", "be", "as", "by", "was", "are", "this", "that",
            "with", "from", "have", "has", "had", "but", "not", "what", "how"
        }
        tokens = re.findall(r"[a-z0-9]+", text.lower())
        return [t for t in tokens if len(t) > 3 and t not in stop_words]


# ── Module-level singleton ────────────────────────────────────────────────────

_memory_agent: Optional[MemoryAgent] = None


def get_memory_store() -> MemoryAgent:
    global _memory_agent
    if _memory_agent is None:
        _memory_agent = MemoryAgent()
    return _memory_agent
