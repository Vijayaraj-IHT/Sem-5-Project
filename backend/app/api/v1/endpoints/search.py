from typing import List, Optional
from fastapi import APIRouter, Depends, Request
from sqlalchemy.orm import Session
from sqlalchemy import or_
from app.core.database import get_db
from app.core.security import get_optional_current_user
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


import re


def _extract_matched_snippets(text: str, tokens: List[str], max_snippets: int = 2) -> tuple[List[str], List[str]]:
    if not text or not tokens:
        return [], []
    snippets = []
    matched_kws = set()
    lines = text.split("\n")
    current_page = 1
    for line in lines:
        stripped = line.strip()
        if stripped.startswith("--- PAGE "):
            m_pg = re.search(r'\d+', stripped)
            if m_pg:
                try:
                    current_page = int(m_pg.group())
                except Exception:
                    pass
            continue
        line_lower = stripped.lower()
        for tok in tokens:
            if tok in line_lower:
                matched_kws.add(tok)
                if len(snippets) < max_snippets:
                    # Highlight match with <mark> tags
                    pattern = re.compile(re.escape(tok), re.IGNORECASE)
                    highlighted = pattern.sub(lambda m: f"<mark>{m.group(0)}</mark>", stripped)
                    if len(highlighted) > 220:
                        # Trim around the first match
                        m_pos = highlighted.lower().find("<mark>")
                        start_pos = max(0, m_pos - 40)
                        end_pos = min(len(highlighted), m_pos + 160)
                        highlighted = ("..." if start_pos > 0 else "") + highlighted[start_pos:end_pos] + ("..." if end_pos < len(highlighted) else "")
                    snippets.append(f"[Page {current_page}] {highlighted}")
    return snippets, list(matched_kws)


@router.post("/", response_model=SearchResponse)
def search_cases(
    search_in: SearchRequest,
    request: Request,
    current_user: Optional[User] = Depends(get_optional_current_user),
    db: Session = Depends(get_db),
):
    """
    Hugging Face Hybrid Legal Precedent Search:
    1. Local LLM / NER extracts statutory sections and legal issues from natural language query.
    2. Sentence-Transformers (all-MiniLM-L6-v2) computes 384-dimensional query vector.
    3. Fuses vector cosine similarity (0.5), statutory section matches (0.3), and keywords across official PDF text (0.2).
    4. Extracts matched context snippets from official judgment text with page numbers.
    5. Logs search query in the immutable audit trail.
    """
    # Fast-path for empty or short browse query (< 2 characters)
    query_text = (search_in.query or "").strip()
    if len(query_text) < 2:
        query_obj = db.query(Case).filter(Case.status == "published")
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

        total_matches = query_obj.count()
        cases_page = (
            query_obj.order_by(Case.created_at.desc())
            .offset(search_in.offset)
            .limit(search_in.limit)
            .all()
        )

        results = [
            SearchResultItem(
                id=c.id,
                case_no=c.case_no,
                title=c.title,
                court=c.court,
                year=c.year,
                matched_sections=[],
                relevance_score=1.0,
                outcome=c.outcome,
                summary=c.summary,
                file_hash=c.file_hash,
                matched_snippets=[],
                matched_keywords=[],
            )
            for c in cases_page
        ]

        log_audit_event(
            db=db,
            action="SEARCH_BROWSE",
            user_id=current_user.id if current_user else None,
            details=f"Browsed {len(results)} of {total_matches} published cases",
            ip_address=request.client.host if request.client else None,
            user_agent=request.headers.get("user-agent"),
        )

        return SearchResponse(
            total=total_matches,
            results=results,
            query_understanding={"sections": [], "issue": "All Published Cases", "jurisdiction": "All Courts"},
        )

    # 1. AI Query Enrichment (Local Qwen/Llama or InLegalBERT NER)
    enriched = local_llm_service.enrich_query(search_in.query)
    query_sections = enriched.get("sections", [])

    # 2. Vector Embedding for Query
    query_embedding = embedding_service.generate_embedding(search_in.query)

    # 3. Base Query: Only published cases
    query_obj = db.query(Case).filter(Case.status == "published")

    # Apply optional filters
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

    # 4. Score Fusion and Ranking across official PDF text and metadata
    scored_results = []
    tokens = [t.lower() for t in search_in.query.split() if len(t) > 2]

    for c in candidates:
        matched_sections = []
        c_sections = c.section_tags or []
        for s in query_sections:
            if any(s.lower() in sec.lower() for sec in c_sections):
                matched_sections.append(s)

        # Keyword matching across title, summary, and official judgment full text
        haystack = f"{c.title} {c.summary or ''} {' '.join(c.keyword_tags or [])} {c.facts or ''} {c.ratio_decidendi or ''} {(c.full_text or '')[:10000]}".lower()
        keyword_hits = sum(1 for tok in tokens if tok in haystack)

        # Extract matched snippet excerpts from the official judgment
        matched_snippets, matched_kws = _extract_matched_snippets(
            c.full_text or c.summary or "", tokens, max_snippets=2
        )

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

        # Baseline fallback for direct title or official full-text keyword matches
        if any(tok in c.title.lower() for tok in tokens) and relevance_score < 0.35:
            relevance_score = 0.40
        elif len(matched_kws) > 0 and relevance_score < 0.25:
            relevance_score = 0.30

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
                        matched_snippets=matched_snippets,
                        matched_keywords=matched_kws,
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
        user_id=current_user.id if current_user else None,
        details=f"Query: '{search_in.query[:100]}' - Returned {len(paged)} of {total_matches} results",
        ip_address=request.client.host if request.client else None,
        user_agent=request.headers.get("user-agent"),
    )

    return SearchResponse(
        total=total_matches,
        results=paged,
        query_understanding=enriched,
    )
