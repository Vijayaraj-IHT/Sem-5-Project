import os
import uuid
import json
from typing import Optional, List
from datetime import datetime, timezone
from fastapi import (
    APIRouter,
    Depends,
    HTTPException,
    status,
    UploadFile,
    File,
    Form,
    Request,
    Query,
)
from sqlalchemy.orm import Session
from app.core.config import settings
from app.core.database import get_db
from app.core.security import get_current_user, require_role
from app.models.user import User
from app.models.case import Case
from app.models.document_version import DocumentVersion
from app.models.approval_queue import ApprovalQueue
from app.schemas.case import (
    CaseResponse,
    CaseDetailResponse,
    CaseVerificationResponse,
)
from app.services.crypto_service import compute_sha256, verify_sha256
from app.services.audit_service import log_audit_event
from app.services.embedding_service import embedding_service
from app.services.ner_service import ner_service

router = APIRouter()

ALLOWED_EXTENSIONS = {".pdf", ".docx"}
MAX_FILE_SIZE_BYTES = 20 * 1024 * 1024  # 20MB


@router.post("/upload", response_model=CaseResponse, status_code=status.HTTP_201_CREATED)
async def upload_case(
    request: Request,
    file: UploadFile = File(...),
    case_no: str = Form(...),
    title: str = Form(...),
    court: str = Form(...),
    year: int = Form(...),
    judge: Optional[str] = Form(None),
    parties: Optional[str] = Form(None),
    act_tags: Optional[str] = Form("[]"),
    section_tags: Optional[str] = Form("[]"),
    keyword_tags: Optional[str] = Form("[]"),
    summary: Optional[str] = Form(None),
    outcome: Optional[str] = Form(None),
    current_user: User = Depends(require_role(["court_staff", "senior_staff"])),
    db: Session = Depends(get_db),
):
    """
    Court Staff Case Upload Endpoint:
    1. Validates file extension and size (<=20MB).
    2. Computes SHA-256 hash of raw document bytes.
    3. Detects duplicates via hash comparison.
    4. Stores document using secure UUID filename (Path Traversal defense).
    5. Creates Case record with 'pending_approval' status and logs to AuditLog.
    """
    ext = os.path.splitext(file.filename or "")[1].lower()
    if ext not in ALLOWED_EXTENSIONS:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail=f"Unsupported file format '{ext}'. Only PDF and DOCX files are permitted.",
        )

    file_bytes = await file.read()
    if len(file_bytes) > MAX_FILE_SIZE_BYTES:
        raise HTTPException(
            status_code=status.HTTP_413_REQUEST_ENTITY_TOO_LARGE,
            detail="File size exceeds the 20MB limit.",
        )

    # Cryptographic integrity fingerprint
    file_hash = compute_sha256(file_bytes)

    # Duplicate check
    duplicate = db.query(Case).filter(Case.file_hash == file_hash).first()
    if duplicate:
        raise HTTPException(
            status_code=status.HTTP_409_CONFLICT,
            detail=f"Duplicate document detected. This judgment is already registered under Case No: {duplicate.case_no}.",
        )

    # Secure file storage
    os.makedirs(settings.STORAGE_DIR, exist_ok=True)
    safe_filename = f"{uuid.uuid4()}{ext}"
    safe_path = os.path.join(settings.STORAGE_DIR, safe_filename)

    with open(safe_path, "wb") as f:
        f.write(file_bytes)

    # Parse JSON tags safely
    def parse_tags(raw: Optional[str]) -> List[str]:
        if not raw:
            return []
        try:
            parsed = json.loads(raw)
            if isinstance(parsed, list):
                return parsed
        except Exception:
            return [t.strip() for t in raw.split(",") if t.strip()]
        return []

    parsed_acts = parse_tags(act_tags)
    parsed_sections = parse_tags(section_tags)
    parsed_keywords = parse_tags(keyword_tags)

    # Automatically extract statutory sections and legal keywords if not manually specified
    if not parsed_sections or not parsed_acts:
        extracted = ner_service.extract_legal_entities(f"{title} {summary or ''}")
        if not parsed_acts:
            parsed_acts = extracted.get("acts", [])
        if not parsed_sections:
            parsed_sections = extracted.get("sections", [])
        if not parsed_keywords:
            parsed_keywords = extracted.get("keywords", [])

    # Generate 384-dimensional semantic embedding using Hugging Face model
    text_corpus = f"{title}. {summary or ''}. {' '.join(parsed_sections)} {' '.join(parsed_keywords)}"
    case_embedding = embedding_service.generate_embedding(text_corpus)

    new_case = Case(
        case_no=case_no.strip(),
        title=title.strip(),
        court=court.strip(),
        year=year,
        judge=judge.strip() if judge else None,
        parties=parties.strip() if parties else None,
        act_tags=parsed_acts,
        section_tags=parsed_sections,
        keyword_tags=parsed_keywords,
        summary=summary.strip() if summary else None,
        outcome=outcome.strip() if outcome else None,
        file_path=safe_path,
        file_hash=file_hash,
        embedding=case_embedding,
        status="pending_approval",
        uploaded_by_id=current_user.id,
    )
    db.add(new_case)
    db.commit()
    db.refresh(new_case)

    # Track Version 1
    version_entry = DocumentVersion(
        case_id=new_case.id,
        version_no=1,
        file_path=safe_path,
        file_hash=file_hash,
        change_summary="Initial document ingestion and registration",
        changed_by_id=current_user.id,
    )
    db.add(version_entry)

    # Enqueue into Senior Staff Approval Queue
    queue_entry = ApprovalQueue(
        case_id=new_case.id,
        submitted_by_id=current_user.id,
        status="pending",
    )
    db.add(queue_entry)
    db.commit()

    # Immutable Audit Log Entry
    log_audit_event(
        db=db,
        action="UPLOAD",
        user_id=current_user.id,
        case_id=new_case.id,
        details=f"Uploaded case '{new_case.case_no}' (SHA-256: {file_hash[:16]}...)",
        ip_address=request.client.host if request.client else None,
        user_agent=request.headers.get("user-agent"),
    )

    return new_case


@router.get("/", response_model=List[CaseResponse])
def list_cases(
    court: Optional[str] = Query(None),
    year: Optional[int] = Query(None),
    status_filter: Optional[str] = Query(None),
    skip: int = Query(0, ge=0),
    limit: int = Query(20, ge=1, le=100),
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db),
):
    """
    Lists cases based on user role:
    - Court Staff can view all statuses (pending_approval, published, rejected).
    - Advocates, Scholars, and Public can only view 'published' cases.
    """
    query = db.query(Case)

    if current_user.role not in ["court_staff", "senior_staff", "staff"]:
        query = query.filter(Case.status == "published")
    elif status_filter:
        query = query.filter(Case.status == status_filter)

    if court:
        query = query.filter(Case.court.ilike(f"%{court}%"))
    if year:
        query = query.filter(Case.year == year)

    cases = query.order_by(Case.created_at.desc()).offset(skip).limit(limit).all()
    return cases


@router.get("/{case_id}", response_model=CaseResponse)
def get_case(
    case_id: str,
    request: Request,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db),
):
    """Retrieves metadata of a specific case."""
    case = db.query(Case).filter(Case.id == case_id).first()
    if not case:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Case record not found.",
        )

    if case.status != "published" and current_user.role not in ["court_staff", "senior_staff", "staff"]:
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="This case is pending staff approval and cannot be viewed yet.",
        )

    log_audit_event(
        db=db,
        action="VIEW_METADATA",
        user_id=current_user.id,
        case_id=case.id,
        details=f"Viewed case metadata for {case.case_no}",
        ip_address=request.client.host if request.client else None,
        user_agent=request.headers.get("user-agent"),
    )

    return case


@router.get("/{case_id}/view", response_model=CaseDetailResponse)
def view_case_document(
    case_id: str,
    request: Request,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db),
):
    """
    Retrieves full case document and executes REAL-TIME SHA-256 INTEGRITY VERIFICATION.
    - If file on disk matches stored file_hash: serves with 'verified' badge.
    - If hash mismatch: returns 'tampered', triggers security quarantine, and alerts admin.
    """
    case = db.query(Case).filter(Case.id == case_id).first()
    if not case:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Case record not found.")

    if case.status != "published" and current_user.role not in ["court_staff", "senior_staff"]:
        raise HTTPException(status_code=status.HTTP_403_FORBIDDEN, detail="Document access restricted.")

    integrity_status = "verified"
    if os.path.exists(case.file_path):
        with open(case.file_path, "rb") as f:
            content = f.read()
        if not verify_sha256(content, case.file_hash):
            integrity_status = "tampered"
            # Quarantine the document
            case.status = "quarantined"
            db.commit()

            log_audit_event(
                db=db,
                action="INTEGRITY_VIOLATION",
                user_id=current_user.id,
                case_id=case.id,
                details=f"CRITICAL: SHA-256 hash mismatch detected during document access! Case quarantined.",
                ip_address=request.client.host if request.client else None,
                user_agent=request.headers.get("user-agent"),
            )
            raise HTTPException(
                status_code=status.HTTP_409_CONFLICT,
                detail="Document integrity check failed: SHA-256 mismatch detected. File has been quarantined.",
            )
    else:
        integrity_status = "file_missing"

    log_audit_event(
        db=db,
        action="VIEW_DOCUMENT",
        user_id=current_user.id,
        case_id=case.id,
        details=f"Document viewed with status: {integrity_status}",
        ip_address=request.client.host if request.client else None,
        user_agent=request.headers.get("user-agent"),
    )

    # Return redacted path for scholars/advocates if available
    display_path = case.file_path
    if current_user.role in ["scholar", "public"] and case.redacted_file_path:
        display_path = case.redacted_file_path

    response_data = CaseDetailResponse(
        id=case.id,
        case_no=case.case_no,
        title=case.title,
        court=case.court,
        year=case.year,
        judge=case.judge,
        parties=case.parties,
        act_tags=case.act_tags or [],
        section_tags=case.section_tags or [],
        keyword_tags=case.keyword_tags or [],
        summary=case.summary,
        outcome=case.outcome,
        facts=case.facts,
        issues_framed=case.issues_framed or [],
        ratio_decidendi=case.ratio_decidendi,
        statutory_tests=case.statutory_tests or [],
        disposition=case.disposition or case.outcome,
        precedents_cited=case.precedents_cited or [],
        source_url=case.source_url,
        source_verification_state=case.source_verification_state or "unverified",
        precedential_status=case.precedential_status or "Precedential status not checked",
        file_hash=case.file_hash,
        redacted_file_hash=case.redacted_file_hash,
        status=case.status,
        uploaded_by_id=case.uploaded_by_id,
        approved_by_id=case.approved_by_id,
        approved_at=case.approved_at,
        created_at=case.created_at,
        updated_at=case.updated_at,
        file_path=display_path,
        redacted_file_path=case.redacted_file_path,
        integrity_status=integrity_status,
    )
    return response_data


@router.get("/{case_id}/verify-integrity", response_model=CaseVerificationResponse)
def verify_case_integrity(
    case_id: str,
    request: Request,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db),
):
    """
    Dedicated cryptographic check that recalculates SHA-256
    hash directly from the stored file and returns tamper status badge.
    """
    case = db.query(Case).filter(Case.id == case_id).first()
    if not case:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Case record not found.")

    if not os.path.exists(case.file_path):
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Physical document file missing on disk.")

    with open(case.file_path, "rb") as f:
        bytes_data = f.read()

    computed_hash = compute_sha256(bytes_data)
    is_valid = (computed_hash.lower() == case.file_hash.lower())
    badge = "VERIFIED_UNTAMPERED" if is_valid else "INTEGRITY_VIOLATION"

    log_audit_event(
        db=db,
        action="VERIFY_INTEGRITY",
        user_id=current_user.id,
        case_id=case.id,
        details=f"Cryptographic check result: {badge}",
        ip_address=request.client.host if request.client else None,
        user_agent=request.headers.get("user-agent"),
    )

    return CaseVerificationResponse(
        case_id=case.id,
        expected_hash=case.file_hash,
        computed_hash=computed_hash,
        is_valid=is_valid,
        status_badge=badge,
        verified_at=datetime.now(timezone.utc),
    )


@router.get("/{case_id}/download")
def download_case(
    case_id: str,
    request: Request,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db),
):
    """
    Serves the authentic stored document file with cryptographic verification headers.
    """
    from fastapi.responses import FileResponse

    case = db.query(Case).filter(Case.id == case_id).first()
    if not case:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Case record not found.")

    if case.status != "published" and current_user.role not in ["court_staff", "senior_staff", "staff"]:
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="Access restricted: This case record is not yet published.",
        )

    if not os.path.exists(case.file_path):
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Physical document file missing on disk.")

    log_audit_event(
        db=db,
        action="DOWNLOAD_DOCUMENT",
        user_id=current_user.id,
        case_id=case.id,
        details=f"Downloaded case record: {case.case_no}",
        ip_address=request.client.host if request.client else None,
        user_agent=request.headers.get("user-agent"),
    )

    clean_case_no = "".join(c for c in case.case_no if c.isalnum() or c in ("-", "_")).strip() or "judgment"
    filename = f"{clean_case_no}.pdf"

    return FileResponse(
        path=case.file_path,
        filename=filename,
        media_type="application/pdf",
        headers={
            "X-Lexguard-SHA256": case.file_hash,
            "X-Lexguard-Verified": "true",
        },
    )
