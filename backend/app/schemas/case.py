from typing import Optional, List
from datetime import datetime
from pydantic import BaseModel, Field, ConfigDict


class CaseBase(BaseModel):
    case_no: str = Field(..., max_length=100)
    title: str = Field(..., max_length=300)
    court: str = Field(..., max_length=150)
    year: int = Field(..., ge=1900, le=2100)
    judge: Optional[str] = Field(default=None, max_length=255)
    parties: Optional[str] = Field(default=None, max_length=500)
    act_tags: List[str] = Field(default_factory=list)
    section_tags: List[str] = Field(default_factory=list)
    keyword_tags: List[str] = Field(default_factory=list)
    summary: Optional[str] = None
    outcome: Optional[str] = Field(default=None, max_length=100)


class CaseCreate(CaseBase):
    pass


class CaseResponse(CaseBase):
    id: str
    file_hash: str
    redacted_file_hash: Optional[str] = None
    status: str
    uploaded_by_id: str
    approved_by_id: Optional[str] = None
    approved_at: Optional[datetime] = None
    created_at: datetime
    updated_at: datetime

    model_config = ConfigDict(from_attributes=True)


class CaseDetailResponse(CaseResponse):
    file_path: str
    redacted_file_path: Optional[str] = None
    integrity_status: str = "verified"  # verified, tampered, pending_check


class CaseVerificationResponse(BaseModel):
    case_id: str
    expected_hash: str
    computed_hash: str
    is_valid: bool
    status_badge: str  # "VERIFIED_UNTAMPERED" or "INTEGRITY_VIOLATION"
    verified_at: datetime


class CaseStatusUpdate(BaseModel):
    status: str = Field(..., pattern="^(published|rejected|quarantined)$")
    review_note: Optional[str] = Field(default=None, max_length=1000)
