"""
Session memory: keeps recent query/report pairs in memory for context injection.
"""

from collections import deque
from typing import List, Dict, Optional
from dataclasses import dataclass, field


@dataclass
class MemoryEntry:
    query: str
    report_summary: str  # first 500 chars of the report


class SessionMemoryStore:
    """
    Lightweight in-memory store for the current session's query history.
    Used to inject prior context into new queries.
    """

    def __init__(self, max_entries: int = 10):
        self._entries: deque[MemoryEntry] = deque(maxlen=max_entries)

    def add(self, query: str, report: str) -> None:
        summary = report[:500].strip()
        self._entries.append(MemoryEntry(query=query, report_summary=summary))

    def get_context_string(self, max_entries: int = 3) -> str:
        """Return a formatted string of recent queries for LLM context."""
        recent = list(self._entries)[-max_entries:]
        if not recent:
            return ""

        parts = ["## Prior Research Context (this session)"]
        for i, entry in enumerate(recent, 1):
            parts.append(
                f"\n### Prior Query {i}: {entry.query}\n"
                f"Summary: {entry.report_summary}..."
            )
        return "\n".join(parts)

    def clear(self) -> None:
        self._entries.clear()

    def to_list(self) -> List[Dict[str, str]]:
        return [{"query": e.query, "summary": e.report_summary} for e in self._entries]


# Singleton for the lifetime of the server process
_store = SessionMemoryStore()


def get_memory_store() -> SessionMemoryStore:
    return _store