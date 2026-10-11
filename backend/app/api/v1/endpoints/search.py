from typing import List
from fastapi import APIRouter, Depends, Request
from sqlalchemy.orm import Session
from sqlalchemy import or_
from app.core.database import get_db
from app.core.security import get_current_user
from app.models.user import User
from app.models.case import Case
from app.schemas.search import (
    SearchRequest,
    SearchResponse,
    SearchResultItem,
)
from app.services.local_llm_service import local_llm_service
from app.services.claude_service import claude_service
from app.services.embedding_service import embedding_service
from app.services.audit_service import log_audit_event

router = APIRouter()


@router.post("/", response_model=SearchResponse)
def search_cases(
    search_in: SearchRequest,
    request: Request,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db),
):
    """
    Hugging Face Hybrid Legal Precedent Search:
    1. Local LLM / NER extracts statutory sections and legal issues from natural language query.
    2. Sentence-Transformers (all-MiniLM-L6-v2) computes 384-dimensional query vector.
    3. Fuses vector cosine similarity (0.5), statutory section matches (0.3), and keywords (0.2).
    4. Logs search query in the immutable audit trail.
    """
    # 1. AI Query Enrichment (Local Qwen/Llama or InLegalBERT NER)
    enriched = local_llm_service.enrich_query(search_in.query)
    query_sections = enriched.get("sections", [])

    # 2. Vector Embedding for Query
    query_embedding = embedding_service.generate_embedding(search_in.query)

    # 2. Base Query: Only published cases
    query_obj = db.query(Case).filter(Case.status == "published")

    # 3. Apply optional filters
    if search_in.filters:
        f = search_in.filters
        if f.court:
            query_obj = query_obj.filter(Case.court.ilike(f"%{f.court}%"))
        if f.year_from:
            query_obj = query_obj.filter(Case.year >= f.year_from)
        if f.year_to:
            query_obj = query_obj.filter(Case.year <= f.year_to)
        if f.outcome:
            query_obj = query_obj.filter(Case.outcome.ilike(f"%{f.outcome}%"))

    candidates: List[Case] = query_obj.all()

    # 4. Score Fusion and Ranking
    scored_results = []
    tokens = [t.lower() for t in search_in.query.split() if len(t) > 2]

    for c in candidates:
        matched_sections = []
        c_sections = c.section_tags or []
        for s in query_sections:
            if any(s.lower() in sec.lower() for sec in c_sections):
                matched_sections.append(s)

        # Keyword matching across title and summary
        haystack = f"{c.title} {c.summary or ''} {' '.join(c.keyword_tags or [])}".lower()
        keyword_hits = sum(1 for tok in tokens if tok in haystack)

        # 3-Way Score Fusion:
        # 0.5 * Semantic Vector Cosine Similarity + 0.3 * Statutory Section Overlap + 0.2 * Keyword Overlap
        semantic_sim = 0.0
        if c.embedding:
            try:
                semantic_sim = embedding_service.cosine_similarity(query_embedding, c.embedding)
            except Exception:
                semantic_sim = 0.0

        section_score = len(matched_sections) / max(len(query_sections), 1)
        keyword_score = min(keyword_hits / max(len(tokens), 1), 1.0)
        relevance_score = round(
            (0.5 * semantic_sim) + (0.3 * section_score) + (0.2 * keyword_score), 3
        )

        # Baseline fallback for direct title match
        if any(tok in c.title.lower() for tok in tokens) and relevance_score < 0.25:
            relevance_score = 0.35

        if relevance_score > 0.0 or not tokens:
            scored_results.append(
                (
                    relevance_score,
                    SearchResultItem(
                        id=c.id,
                        case_no=c.case_no,
                        title=c.title,
                        court=c.court,
                        year=c.year,
                        matched_sections=matched_sections,
                        relevance_score=relevance_score,
                        outcome=c.outcome,
                        summary=c.summary,
                        file_hash=c.file_hash,
                    ),
                )
            )

    # Sort descending by relevance score
    scored_results.sort(key=lambda x: x[0], reverse=True)
    total_matches = len(scored_results)

    # Paginate
    paged = [
        item for _, item in scored_results[search_in.offset : search_in.offset + search_in.limit]
    ]

    # 5. Log audit trail
    log_audit_event(
        db=db,
        action="SEARCH",
        user_id=current_user.id,
        details=f"Query: '{search_in.query[:100]}' - Returned {len(paged)} of {total_matches} results",
        ip_address=request.client.host if request.client else None,
        user_agent=request.headers.get("user-agent"),
    )

    return SearchResponse(
        total=total_matches,
        results=paged,
        query_understanding=enriched,
    )
