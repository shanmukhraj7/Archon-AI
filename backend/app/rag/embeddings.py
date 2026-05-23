"""
Embedding model configuration.
Uses local HuggingFace sentence-transformers.
"""

from functools import lru_cache

@lru_cache(maxsize=1)
def get_embedding_function():
    """
    Returns a LangChain-compatible embedding object.
    Uses a local HuggingFace sentence-transformers model (all-MiniLM-L6-v2).
    """
    try:
        from langchain_community.embeddings import HuggingFaceEmbeddings
        return HuggingFaceEmbeddings(model_name="all-MiniLM-L6-v2")
    except ImportError:
        raise RuntimeError(
            "sentence-transformers is not installed. "
            "Run: pip install sentence-transformers"
        )