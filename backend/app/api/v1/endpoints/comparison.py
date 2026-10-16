from typing import Optional
from fastapi import APIRouter, Depends, HTTPException, status, Request
from sqlalchemy.orm import Session
from app.core.database import get_db
from app.core.security import get_optional_current_user
from app.models.user import User
from app.models.case import Case
from app.schemas.comparison import CaseComparisonRequest, CaseComparisonResponse
from app.services.comparison_service import comparison_service
from app.services.audit_service import log_audit_event

router = APIRouter()


@router.get("/precedents")
def list_published_precedents(
    q: Optional[str] = None,
    limit: int = 50,
    db: Session = Depends(get_db),
):
    """
    Returns list of verified published precedents for the comparator.
    Excludes drafts and unpublished records.
    """
    query = db.query(Case).filter(Case.status == "published")
    if q:
        search_pattern = f"%{q}%"
        query = query.filter(
            (Case.title.ilike(search_pattern))
            | (Case.case_no.ilike(search_pattern))
            | (Case.court.ilike(search_pattern))
        )
    cases = query.limit(limit).all()
    return [
        {
            "id": c.id,
            "title": c.title,
            "case_no": c.case_no,
            "citation": getattr(c, "citation", None) or c.case_no,
            "court": c.court,
            "year": c.year,
            "file_hash": c.file_hash,
            "precedential_status": getattr(c, "precedential_status", None) or "Precedential status not checked",
            "source_verification_state": getattr(c, "source_verification_state", None) or "unverified",
            "source_url": getattr(c, "source_url", None),
        }
        for c in cases
    ]


@router.post("/compare", response_model=CaseComparisonResponse)
def compare_case_with_precedent(
    payload: CaseComparisonRequest,
    request: Request,
    current_user: User = Depends(get_optional_current_user),
    db: Session = Depends(get_db),
):
    """
    Compares a user's structured case against a registered, published landmark precedent.
    - Validates precedent ID strictly server-side (only published cases).
    - Computes deterministic, explainable dimension-by-dimension alignment score.
    - Never retains or silently stores the user's factual summary.
    - Audit log records only non-confidential metadata (user_id, precedent case_id, score).
    """
    # Validate precedent exists and is published
    precedent = (
        db.query(Case)
        .filter(Case.id == payload.precedent_case_id, Case.status == "published")
        .first()
    )
    if not precedent:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Precedent case not found or is not a published judicial record."
        )

    # Execute deterministic comparison
    result = comparison_service.compare_case(req=payload, precedent=precedent)

    # Privacy-preserving audit logging: log ONLY metadata (no user facts or summaries!)
    log_audit_event(
        db=db,
        action="CASE_COMPARISON",
        user_id=current_user.id if current_user else None,
        case_id=precedent.id,
        details=f"Compared user case against precedent: {precedent.case_no}, overall_score={result.overall_score}",
        ip_address=request.client.host if request.client else None,
        user_agent=request.headers.get("user-agent"),
    )

    return result
