"""
Configuration for LexGuard AI Microservice (lexguard-ai-service).
Runs on port 8001 independently from the main backend.
"""

import os
from pydantic_settings import BaseSettings


class AIServiceSettings(BaseSettings):
    HOST: str = os.getenv("AI_SERVICE_HOST", "127.0.0.1")
    PORT: int = int(os.getenv("AI_SERVICE_PORT", "8001"))
    USE_MOCK_AI: bool = os.getenv("USE_MOCK_AI", "false").lower() in ("true", "1", "yes")

    # Models
    NER_MODEL: str = os.getenv("NER_MODEL", "law-ai/InLegalBERT")
    EMBEDDING_MODEL: str = os.getenv("EMBEDDING_MODEL", "intfloat/multilingual-e5-small")
    FALLBACK_EMBEDDING_MODEL: str = "sentence-transformers/all-MiniLM-L6-v2"
    LLM_MODEL: str = os.getenv("LLM_MODEL", "Qwen/Qwen2.5-1.5B-Instruct")

    DEVICE: str = os.getenv("DEVICE", "cpu")
    EMBEDDING_DIMENSION: int = 384


ai_settings = AIServiceSettings()
