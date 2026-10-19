"""
Pydantic schemas for LexGuard AI Service endpoints.
"""

from typing import List, Optional, Dict, Any
from pydantic import BaseModel, Field


# ─── NER Schemas ─────────────────────────────────────────────────────────────
class NERRequest(BaseModel):
    text: str = Field(..., description="Legal judgment or petition text to extract entities from")
    court_context: Optional[str] = Field(default=None, description="Optional court name or bench context")


class LegalEntity(BaseModel):
    text: str
    label: str  # LAW, SECTION, COURT, JUDGE, PETITIONER, RESPONDENT, LOCATION
    start: Optional[int] = None
    end: Optional[int] = None
    confidence: float = 1.0


class NERResponse(BaseModel):
    acts: List[str] = Field(default_factory=list)
    sections: List[str] = Field(default_factory=list)
    parties: List[str] = Field(default_factory=list)
    judges: List[str] = Field(default_factory=list)
    courts: List[str] = Field(default_factory=list)
    entities: List[LegalEntity] = Field(default_factory=list)
    model_used: str


# ─── Embedding Schemas ───────────────────────────────────────────────────────
class EmbedRequest(BaseModel):
    texts: List[str] = Field(..., description="List of text chunks to generate dense vector embeddings for")
    model: Optional[str] = None


class EmbedResponse(BaseModel):
    embeddings: List[List[float]] = Field(..., description="Array of dense vector embeddings")
    dimension: int
    model_used: str


# ─── Summarization Schemas ───────────────────────────────────────────────────
class SummarizeRequest(BaseModel):
    text: str = Field(..., description="Full text or operative portion of the judgment")
    max_sentences: int = Field(default=3, ge=1, le=10)
    court: Optional[str] = None
    case_no: Optional[str] = None


class SummarizeResponse(BaseModel):
    summary: str
    sentence_count: int
    model_used: str


# ─── Ratio Decidendi Schemas ─────────────────────────────────────────────────
class RatioRequest(BaseModel):
    text: str = Field(..., description="Order and reasoning body of the judgment")
    prayer: Optional[str] = None
    outcome: Optional[str] = None
    acts_cited: Optional[List[str]] = None


class RatioResponse(BaseModel):
    ratio_decidendi: str
    legal_issue: str
    court_reasoning: str
    decision_basis: str
    binding_nature: str  # Binding Precedent / Persuasive Ruling / Case Specific
    model_used: str


# ─── Gap Analysis Schemas ────────────────────────────────────────────────────
class PrecedentItem(BaseModel):
    title: str
    case_no: Optional[str] = None
    court: Optional[str] = None
    ratio: Optional[str] = None
    sections: List[str] = Field(default_factory=list)


class GapAnalysisRequest(BaseModel):
    draft_text: str = Field(..., description="User's draft petition or legal memorandum")
    precedents: List[PrecedentItem] = Field(..., description="Selected relevant precedents to compare against")


class GapAnalysisResponse(BaseModel):
    alignment_score: float = Field(..., ge=0.0, le=1.0)
    missing_arguments: List[str] = Field(default_factory=list)
    missing_sections: List[str] = Field(default_factory=list)
    relevant_precedents: List[str] = Field(default_factory=list)
    weaknesses: List[str] = Field(default_factory=list)
    recommendations: List[str] = Field(default_factory=list)
    model_used: str
