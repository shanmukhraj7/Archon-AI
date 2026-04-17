"""
Embedding model configuration.
Falls back to HuggingFace sentence-transformers if no OpenAI key is set.
"""

import os
from functools import lru_cache


@lru_cache(maxsize=1)
def get_embedding_function():
    """
    Returns a LangChain-compatible embedding object.
    Prefers OpenAI if OPENAI_API_KEY is set, otherwise uses a local
    HuggingFace sentence-transformers model (all-MiniLM-L6-v2).
    """
    openai_key = os.getenv("OPENAI_API_KEY")

    if openai_key:
        from langchain_openai import OpenAIEmbeddings
        return OpenAIEmbeddings(
            model="text-embedding-3-small",
            openai_api_key=openai_key,
        )

    # Free local fallback
    try:
        from langchain_community.embeddings import HuggingFaceEmbeddings
        return HuggingFaceEmbeddings(model_name="all-MiniLM-L6-v2")
    except ImportError:
        raise RuntimeError(
            "Neither OPENAI_API_KEY is set nor sentence-transformers is installed. "
            "Set OPENAI_API_KEY or run: pip install sentence-transformers"
        )