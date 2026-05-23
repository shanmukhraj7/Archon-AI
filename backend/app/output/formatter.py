"""
Structured markdown generation and post-processing utilities.
"""

import re
from datetime import datetime
from zoneinfo import ZoneInfo


def ensure_report_structure(raw_report: str, query: str) -> str:
    """
    Ensure the report has a title and timestamp header.
    Cleans up minor formatting issues.
    """
    ist = ZoneInfo("Asia/Kolkata")
    timestamp = datetime.now(ist).strftime("%B %d, %Y at %H:%M IST")

    header = f"# Research Report\n\n**Query:** {query}\n\n**Generated:** {timestamp}\n\n---\n\n"

    # If the report already starts with a header, don't double-add
    if raw_report.strip().startswith("#"):
        return header + raw_report.strip()

    return header + raw_report.strip()


def extract_summary(report_markdown: str) -> str:
    """
    Extract the Executive Summary section from a report.
    Returns the first 300 chars of the report if no section found.
    """
    match = re.search(
        r"##\s*Executive Summary\s*\n(.*?)(?=\n##|\Z)",
        report_markdown,
        re.DOTALL | re.IGNORECASE,
    )
    if match:
        return match.group(1).strip()[:500]
    # Fallback: first non-header paragraph
    lines = [l for l in report_markdown.splitlines() if l.strip() and not l.startswith("#")]
    return " ".join(lines[:3])[:300]


def word_count(text: str) -> int:
    return len(text.split())


def report_metadata(report_markdown: str) -> dict:
    return {
        "word_count": word_count(report_markdown),
        "has_table": "|" in report_markdown,
        "section_count": len(re.findall(r"^##\s", report_markdown, re.MULTILINE)),
        "summary": extract_summary(report_markdown),
    }