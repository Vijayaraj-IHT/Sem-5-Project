from typing import Optional, List, Dict, Any
from datetime import datetime
from pydantic import BaseModel, Field, ConfigDict


class CitationSuggestion(BaseModel):
    case_id: str
    case_title: str
    citation: str
    relevant_section: str
    reasoning: str
    quote: str


class DraftAnalyzeRequest(BaseModel):
    petition_text: str = Field(..., min_length=20)
    session_id: Optional[str] = None
    title: Optional[str] = Field(default="Draft Petition Analysis")


class DraftAnalyzeResponse(BaseModel):
    identified_grounds: List[str]
    missing_arguments: List[str]
    suggested_sections: List[str]
    citation_suggestions: List[CitationSuggestion]
    disclaimer: str = (
        "AI suggestions are generated as research references and require independent verification. "
        "Every citation links directly to a verified repository judgment."
    )


class DraftSessionCreate(BaseModel):
    title: str = Field(default="Untitled Petition Draft", max_length=200)
    draft_text: str


class DraftSessionResponse(BaseModel):
    id: str
    title: str
    draft_text: str
    citations_inserted: List[Dict[str, Any]]
    gap_analysis_result: Optional[Dict[str, Any]] = None
    created_at: datetime
    updated_at: datetime

    model_config = ConfigDict(from_attributes=True)
