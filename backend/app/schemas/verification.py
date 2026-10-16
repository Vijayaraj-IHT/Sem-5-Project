from typing import Optional
from datetime import datetime
from pydantic import BaseModel, Field


class HashLookupRequest(BaseModel):
    sha256_hash: str = Field(..., pattern="^[a-fA-F0-9]{64}$", description="Lowercase 64-character SHA-256 hexadecimal hash")


class MatchedCaseSummary(BaseModel):
    id: str
    case_no: str
    title: str
    court: str
    year: int
    source_url: Optional[str] = None
    source_verification_state: Optional[str] = "unverified"
    precedential_status: Optional[str] = "Precedential status not checked"
    expected_hash: str
    verified_at: datetime


class HashLookupResponse(BaseModel):
    matched: bool
    query_hash: str
    message: str
    case: Optional[MatchedCaseSummary] = None
    hash_label: Optional[str] = None
    audit_label: Optional[str] = None
