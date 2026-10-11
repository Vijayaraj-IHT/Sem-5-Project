from typing import Optional, List, Dict, Any
from pydantic import BaseModel, Field


class SearchFilters(BaseModel):
    court: Optional[str] = None
    year_from: Optional[int] = Field(default=None, ge=1900)
    year_to: Optional[int] = Field(default=None, le=2100)
    act: Optional[str] = None
    outcome: Optional[str] = None


class SearchRequest(BaseModel):
    query: str = Field(..., min_length=2, max_length=1000)
    filters: Optional[SearchFilters] = None
    limit: int = Field(default=10, ge=1, le=50)
    offset: int = Field(default=0, ge=0)


class SearchResultItem(BaseModel):
    id: str
    case_no: str
    title: str
    court: str
    year: int
    matched_sections: List[str] = []
    relevance_score: float
    outcome: Optional[str] = None
    summary: Optional[str] = None
    file_hash: str


class SearchResponse(BaseModel):
    total: int
    results: List[SearchResultItem]
    query_understanding: Optional[Dict[str, Any]] = None
