"""
Similarity search over ChromaDB.
"""

import os
from typing import List

from langchain_community.vectorstores import Chroma
from langchain_core.documents import Document

from .embeddings import get_embedding_function


CHROMA_PERSIST_DIR = os.getenv("CHROMA_PERSIST_DIR", "./data/chroma")
COLLECTION_NAME = "research_docs"


def retrieve_relevant_chunks(query: str, k: int = 5) -> List[Document]:
    """
    Return the top-k most relevant chunks for a given query.
    Returns an empty list if the collection is empty or doesn't exist.
    """
    embedding_fn = get_embedding_function()

    try:
        vectorstore = Chroma(
            collection_name=COLLECTION_NAME,
            embedding_function=embedding_fn,
            persist_directory=CHROMA_PERSIST_DIR,
        )
        results = vectorstore.similarity_search(query, k=k)
        return results
    except Exception:
        # Collection may not exist yet (no docs uploaded)
        return []


def get_all_chroma_documents() -> List[Document]:
    """Fetch all stored documents from ChromaDB for BM25 indexing."""
    embedding_fn = get_embedding_function()
    try:
        vectorstore = Chroma(
            collection_name=COLLECTION_NAME,
            embedding_function=embedding_fn,
            persist_directory=CHROMA_PERSIST_DIR,
        )
        # Get all documents (ChromaDB stores them in the collection)
        collection = vectorstore._collection
        results = collection.get(include=["documents", "metadatas"])
        docs = []
        for i, content in enumerate(results["documents"]):
            metadata = results["metadatas"][i] if results["metadatas"] else {}
            docs.append(Document(page_content=content, metadata=metadata))
        return docs
    except Exception:
        return []


def hybrid_retrieve(query: str, k: int = 5) -> List[Document]:
    """
    Hybrid BM25 + semantic retrieval.
    Concept: Session 6 — multi-signal retrieval systems,
    combining keyword and semantic signals for better recall.
    """
    # Step 1: Semantic search (existing)
    semantic_results = retrieve_relevant_chunks(query, k=k)

    # Step 2: BM25 keyword search
    try:
        from rank_bm25 import BM25Okapi
    except ImportError:
        import logging
        logging.getLogger(__name__).warning("rank_bm25 not installed, falling back to semantic search only")
        return semantic_results

    all_docs = get_all_chroma_documents()
    if not all_docs:
        return semantic_results  # Fall back if no docs

    tokenized_corpus = [doc.page_content.lower().split() for doc in all_docs]
    bm25 = BM25Okapi(tokenized_corpus)
    query_tokens = query.lower().split()
    scores = bm25.get_scores(query_tokens)

    top_indices = sorted(range(len(scores)),
                         key=lambda i: scores[i], reverse=True)[:k]
    bm25_results = [all_docs[i] for i in top_indices if scores[i] > 0]

    # Step 3: Merge and deduplicate (reciprocal rank fusion / deduplication)
    seen_content = set()
    merged = []
    for doc in semantic_results + bm25_results:
        fingerprint = doc.page_content[:150]
        if fingerprint not in seen_content:
            seen_content.add(fingerprint)
            merged.append(doc)

    return merged[:k]


def format_rag_context(docs: List[Document]) -> str:
    """Format retrieved docs into a context string for the LLM."""
    if not docs:
        return ""

    parts = []
    for i, doc in enumerate(docs, 1):
        source = doc.metadata.get("source", "unknown")
        page = doc.metadata.get("page", "")
        loc = f"{source}" + (f", page {page}" if page else "")
        parts.append(f"[Document {i} — {loc}]\n{doc.page_content}")

    return "\n\n---\n\n".join(parts)