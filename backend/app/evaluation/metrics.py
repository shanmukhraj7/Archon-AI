"""
RAG evaluation metrics — RAGAS-style lightweight scoring.
Concept: Sessions 7 and 8 — RAGAS metrics, retrieval evaluation,
hallucination detection, production QA, systematic QA pipelines.
"""

from typing import Dict, List


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


def compute_source_coverage(sub_queries: List[str], report: str) -> float:
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
                         sub_queries: List[str]) -> Dict[str, float]:
    """
    Compute all evaluation metrics and return as a dict.
    Concept: Session 8 (systematic QA pipeline, production QA).
    """
    return {
        "faithfulness":     compute_faithfulness(report, web_context, rag_context),
        "answer_relevance": compute_answer_relevance(query, report),
        "source_coverage":  compute_source_coverage(sub_queries, report),
    }
