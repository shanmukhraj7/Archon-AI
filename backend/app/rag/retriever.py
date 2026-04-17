"""
Similarity search over ChromaDB.
"""

import os
from typing import List

from langchain_community.vectorstores import Chroma
from langchain.docstore.document import Document

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