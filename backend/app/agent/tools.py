"""
Tool definitions: web search (Tavily) and RAG search (ChromaDB).
"""

import os
from typing import List, Dict, Any

from ..rag.retriever import retrieve_relevant_chunks, format_rag_context, hybrid_retrieve


def web_search(query: str, max_results: int = 5) -> List[Dict[str, Any]]:
    """
    Search the web using Tavily and return structured results.
    """
    from tavily import TavilyClient

    api_key = os.environ.get("TAVILY_API_KEY")
    if not api_key:
        raise ValueError("TAVILY_API_KEY environment variable is not set")

    client = TavilyClient(api_key=api_key)
    response = client.search(
        query,
        max_results=max_results,
        search_depth="advanced",
        include_answer=True,
    )
    return response.get("results", [])


def format_web_results(results: List[Dict[str, Any]]) -> str:
    """Format Tavily search results into a readable context string."""
    if not results:
        return "No web results found."

    parts = []
    for i, r in enumerate(results, 1):
        title = r.get("title", "Untitled")
        url = r.get("url", "")
        content = r.get("content", "")
        parts.append(f"[Web Result {i}: {title}]\nURL: {url}\n{content}")

    return "\n\n---\n\n".join(parts)


def rag_search(query: str, k: int = 5) -> str:
    """
    Search uploaded documents via ChromaDB and return formatted context.
    """
    docs = hybrid_retrieve(query, k=k)
    return format_rag_context(docs)


def multi_query_web_search(queries: List[str], max_per_query: int = 3) -> str:
    """
    Run multiple web searches and deduplicate + format the combined results.
    """
    seen_urls = set()
    all_results = []

    for q in queries:
        try:
            results = web_search(q, max_results=max_per_query)
            for r in results:
                url = r.get("url", "")
                if url and url not in seen_urls:
                    seen_urls.add(url)
                    all_results.append(r)
        except Exception as e:
            all_results.append({
                "title": f"Search error for '{q}'",
                "url": "",
                "content": str(e),
            })

    return format_web_results(all_results)


def multi_query_rag_search(queries: List[str], k_per_query: int = 3) -> str:
    """
    Run multiple RAG searches across sub-queries, deduplicate chunks.
    """
    from ..rag.retriever import hybrid_retrieve
    from langchain_core.documents import Document

    seen_contents = set()
    all_docs: List[Document] = []

    for q in queries:
        docs = hybrid_retrieve(q, k=k_per_query)
        for doc in docs:
            snippet = doc.page_content[:200]
            if snippet not in seen_contents:
                seen_contents.add(snippet)
                all_docs.append(doc)

    from ..rag.retriever import format_rag_context
    return format_rag_context(all_docs)