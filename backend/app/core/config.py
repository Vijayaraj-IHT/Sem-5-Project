from typing import List, Union, Optional
import json
from pydantic import field_validator
from pydantic_settings import BaseSettings, SettingsConfigDict


class Settings(BaseSettings):
    model_config = SettingsConfigDict(
        env_file=".env",
        env_file_encoding="utf-8",
        case_sensitive=True,
        extra="ignore",
    )

    ENVIRONMENT: str = "development"
    DEBUG: bool = True
    PROJECT_NAME: str = "Lexguard Legal Research & Verification System"
    API_V1_STR: str = "/api/v1"

    # Cryptography & JWT Security
    SECRET_KEY: str = "lexguard-super-secret-jwt-key-2026-production-ready-32-chars-min"
    ALGORITHM: str = "HS256"
    ACCESS_TOKEN_EXPIRE_MINUTES: int = 480  # 8 hours
    REFRESH_TOKEN_EXPIRE_DAYS: int = 7

    # Cookie & CSRF Protection
    COOKIE_NAME: str = "lexguard_access_token"
    COOKIE_SECURE: bool = False  # Set to True when served over HTTPS
    COOKIE_SAMESITE: str = "lax"
    CSRF_HEADER_NAME: str = "X-CSRF-Token"
    CSRF_SECRET: str = "lexguard-csrf-protection-secret-key-salt"

    # Database Configuration (PostgreSQL / SQLite fallback)
    DATABASE_URL: str = "sqlite:///./lexguard.db"

    # File Storage
    STORAGE_DIR: str = "./storage/cases"

    # Hugging Face Open-Source Model Stack
    EMBEDDING_MODEL_NAME: str = "sentence-transformers/all-MiniLM-L6-v2"
    LEGAL_NER_MODEL_NAME: str = "law-ai/InLegalBERT"
    LOCAL_LLM_MODEL_NAME: str = "Qwen/Qwen2.5-3B-Instruct"  # or meta-llama/Llama-3.2-3B-Instruct
    USE_LOCAL_LLM: bool = True
    HF_TOKEN: Optional[str] = None
    DEVICE: str = "cpu"  # "cuda" if GPU is available
    QUANTIZATION_BITS: int = 4

    # Optional Fallbacks
    ANTHROPIC_API_KEY: str = ""
    USE_MOCK_LLM: bool = False

    # CORS Allowed Origins
    CORS_ORIGINS: Union[List[str], str] = [
        "http://localhost:3000",
        "http://localhost:5173",
        "http://127.0.0.1:3000",
        "http://127.0.0.1:5173",
    ]

    @field_validator("CORS_ORIGINS", mode="before")
    @classmethod
    def assemble_cors_origins(cls, v: Union[str, List[str]]) -> List[str]:
        if isinstance(v, str) and not v.startswith("["):
            return [i.strip() for i in v.split(",")]
        elif isinstance(v, str) and v.startswith("["):
            return json.loads(v)
        return v


settings = Settings()
